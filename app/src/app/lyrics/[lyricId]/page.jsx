import LyricPageClient from './LyricPageClient';
import { getPublicLyric, languageName, songLabel, JsonLd, SITE_URL, SITE_NAME } from '@/lib/seo';

export async function generateMetadata({ params }) {
    const { lyricId } = await params;
    const lyric = await getPublicLyric(lyricId);
    if (!lyric) {
        return { title: 'Lyrics', robots: { index: false } };
    }

    const language = languageName(lyric.language);
    const song = songLabel(lyric);
    const title = `${song}: Lyrics Meaning & ${language} Breakdown`;
    const description = `Line-by-line English translation of "${lyric.title}"${lyric.artist ? ` by ${lyric.artist}` : ''}. Tap any line to see every ${language} word and grammar point explained, then save the words to your flashcards.`;
    const url = `/lyrics/${lyric.lyricId}`;

    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: { type: 'article', url, title, description, siteName: SITE_NAME },
        twitter: { card: 'summary_large_image', title, description },
    };
}

export default async function LyricPage({ params }) {
    const { lyricId } = await params;
    const lyric = await getPublicLyric(lyricId);

    const structuredData = lyric && [
        {
            '@context': 'https://schema.org',
            '@type': 'LearningResource',
            name: `Learn ${languageName(lyric.language)} with ${songLabel(lyric)}`,
            url: `${SITE_URL}/lyrics/${lyric.lyricId}`,
            inLanguage: lyric.language,
            learningResourceType: 'Song lyrics with translation and grammar breakdown',
            educationalLevel: 'Beginner to intermediate',
            isAccessibleForFree: true,
            about: {
                '@type': 'MusicRecording',
                name: lyric.title,
                ...(lyric.artist && { byArtist: { '@type': 'MusicGroup', name: lyric.artist } }),
            },
            provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
        },
        {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Lyrics', item: `${SITE_URL}/lyrics` },
                { '@type': 'ListItem', position: 2, name: songLabel(lyric), item: `${SITE_URL}/lyrics/${lyric.lyricId}` },
            ],
        },
    ];

    return (
        <>
            {structuredData && <JsonLd data={structuredData} />}
            <LyricPageClient initialLyric={lyric} />
        </>
    );
}

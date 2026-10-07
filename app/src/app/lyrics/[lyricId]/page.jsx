import LyricPageClient from './LyricPageClient';
import StudyNotes from '@/components/lyrics/StudyNotes';
import { getPublicLyric, languageName, songLabel, JsonLd, SITE_URL, SITE_NAME } from '@/lib/seo';

export async function generateMetadata({ params }) {
    const { lyricId } = await params;
    const lyric = await getPublicLyric(lyricId);
    if (!lyric) {
        return { title: 'Lyrics', robots: { index: false } };
    }

    const language = languageName(lyric.language);
    const title = `${lyric.title}${lyric.artist ? ` (${lyric.artist})` : ''} Lyrics: English Translation & Meaning`;
    const description = `${lyric.title}${lyric.artist ? ` by ${lyric.artist}` : ''}: full lyrics with a line-by-line English translation, plus study notes on the key ${language} words and grammar. Tap any line for a full breakdown.`;
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
            <LyricPageClient initialLyric={lyric} studyNotes={lyric && <StudyNotes lyric={lyric} />} />
        </>
    );
}

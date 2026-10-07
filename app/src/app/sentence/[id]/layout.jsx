import { getSharedSentence, clip } from '@/lib/share';
import { languageName, SITE_NAME } from '@/lib/seo';

// Gives each breakdown a real title and description so a shared link unfurls
// with the sentence itself. The preview image is opengraph-image.jsx next door.
export async function generateMetadata({ params }) {
    const { id } = await params;
    const sentence = await getSharedSentence(id);
    if (!sentence) return {};

    const language = languageName(sentence.originalLanguage) || 'the sentence';
    const title = `"${clip(sentence.original, 60)}" meaning, explained`;
    const description = sentence.translation
        ? `"${clip(sentence.translation, 110)}" Every ${language} word and grammar point in this sentence, broken down on Hanbok.`
        : `Every ${language} word and grammar point in this sentence, broken down on Hanbok.`;

    return {
        title,
        description,
        openGraph: { type: 'article', url: `/sentence/${id}`, title, description, siteName: SITE_NAME },
        twitter: { card: 'summary_large_image', title, description },
    };
}

export default function Layout({ children }) {
    return children;
}

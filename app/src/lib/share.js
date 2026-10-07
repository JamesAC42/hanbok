// Shared breakdown links: what a pasted /sentence/<id> link unfurls into
// (Discord, iMessage, Reddit, KakaoTalk) and the tagged URL the Share button copies.
import { cache } from 'react';
import { apiGet } from '@/lib/seo';

// One fetch per request even though generateMetadata and the image both ask.
export const getSharedSentence = cache(async (sentenceId) => {
    if (!/^(\d+|[A-Za-z0-9_-]{12})$/.test(String(sentenceId))) return null;
    const data = await apiGet(`/api/sentences/${sentenceId}`, { revalidate: 3600 });
    const sentence = data?.success ? data.sentence : null;
    const original = sentence?.analysis?.sentence?.original;
    if (!original) return null;
    return {
        original,
        translation: sentence.analysis.sentence.translation || '',
        originalLanguage: sentence.originalLanguage,
    };
});

export const clip = (text, max) => {
    const chars = Array.from(text || '');
    return chars.length > max ? `${chars.slice(0, max - 1).join('').trimEnd()}…` : chars.join('');
};

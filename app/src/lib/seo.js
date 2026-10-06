// Server-only helpers for what search engines see: the public site URL, fetches
// from the Express API during server rendering, and JSON-LD.
import { cache } from 'react';
import { supportedLanguages } from '@/translations/supportedLanguages';

export const SITE_URL = 'https://hanbokstudy.com';
export const SITE_NAME = 'Hanbok';

const API_URL = process.env.API_INTERNAL_URL || 'http://localhost:5666';

export async function apiGet(path, { revalidate = 0 } = {}) {
    try {
        const res = await fetch(`${API_URL}${path}`, revalidate
            ? { next: { revalidate } }
            : { cache: 'no-store' });
        if (!res.ok) return null;
        return await res.json();
    } catch (err) {
        console.error(`SEO fetch failed for ${path}:`, err.message);
        return null;
    }
}

// One fetch per request even though generateMetadata and the page both ask.
// Uncached on purpose: this request is what counts the page view.
export const getPublicLyric = cache(async (lyricId) => {
    const data = await apiGet(`/api/lyrics/${encodeURIComponent(lyricId)}?language=en`);
    return data?.success && data.lyric?.published ? data.lyric : null;
});

export function languageName(code) {
    const name = supportedLanguages[code];
    if (!name) return '';
    if (name === 'chineseTraditional') return 'Chinese';
    return name.charAt(0).toUpperCase() + name.slice(1);
}

export function songLabel(lyric) {
    return lyric.artist ? `${lyric.title} by ${lyric.artist}` : lyric.title;
}

// Renders a JSON-LD block. "<" is escaped so lyric text can't close the tag.
export function JsonLd({ data }) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
        />
    );
}

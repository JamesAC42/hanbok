import { apiGet, SITE_URL } from '@/lib/seo';
import { articles } from '@/content/learn';
import { updates } from '@/content/updates';

// Rebuilt at most hourly so new songs show up without a deploy.
export const revalidate = 3600;

const STATIC_PAGES = [
    { path: '/', changeFrequency: 'weekly', priority: 1 },
    { path: '/analyze', changeFrequency: 'monthly', priority: 0.9 },
    { path: '/lyrics', changeFrequency: 'daily', priority: 0.9 },
    { path: '/learn', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/hangeul', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/pricing', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/about', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/extension', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/lyrics/suggestions', changeFrequency: 'weekly', priority: 0.4 },
    { path: '/updates', changeFrequency: 'monthly', priority: 0.4 },
    { path: '/feedback', changeFrequency: 'monthly', priority: 0.3 },
];

export default async function sitemap() {
    const pages = STATIC_PAGES.map(({ path, ...rest }) => ({ url: `${SITE_URL}${path}`, ...rest }));

    const data = await apiGet('/api/lyrics', { revalidate });
    const songs = (data?.lyrics || []).map((lyric) => ({
        url: `${SITE_URL}/lyrics/${lyric.lyricId}`,
        lastModified: lyric.dateCreated ? new Date(lyric.dateCreated) : undefined,
        changeFrequency: 'monthly',
        priority: 0.8,
    }));

    const guides = articles.map(({ meta }) => ({
        url: `${SITE_URL}/learn/${meta.slug}`,
        lastModified: new Date(meta.updated || meta.published),
        changeFrequency: 'monthly',
        priority: 0.9,
    }));

    const posts = updates.map((post) => ({
        url: `${SITE_URL}/updates/${post.slug}`,
        lastModified: new Date(post.published),
        changeFrequency: 'yearly',
        priority: 0.4,
    }));

    return [...pages, ...guides, ...posts, ...songs];
}

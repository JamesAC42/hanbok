import { headers } from 'next/headers';
import { SITE_URL } from '@/lib/seo';

// Staging must stay out of search results. Behind the proxy the Host header
// can be the internal address (localhost:3059), so production can't be
// recognised by host; instead only a staging host, or a build pointed at the
// staging API (see docs/deploy.md), is blocked. Everything else is indexable.
const STAGING_API = /:5667\b/.test(process.env.API_INTERNAL_URL || '');

export default async function robots() {
    const h = await headers();
    const host = h.get('x-forwarded-host') || h.get('host') || '';
    if (STAGING_API || /(^|\.)staging\./.test(host)) {
        return { rules: { userAgent: '*', disallow: '/' } };
    }
    return {
        rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/admin'] },
        sitemap: `${SITE_URL}/sitemap.xml`,
    };
}

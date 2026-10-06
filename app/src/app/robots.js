import { headers } from 'next/headers';
import { SITE_URL } from '@/lib/seo';

// Only the production host is indexable; staging and previews ask crawlers to stay out.
export default async function robots() {
    const host = (await headers()).get('host') || '';
    if (!/^(www\.)?hanbokstudy\.com$/.test(host.split(':')[0])) {
        return { rules: { userAgent: '*', disallow: '/' } };
    }
    return {
        rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/admin'] },
        sitemap: `${SITE_URL}/sitemap.xml`,
    };
}

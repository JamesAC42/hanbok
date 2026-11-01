import { articles } from '@/content/learn';
import { patterns, patternHref, matchForms } from '@/content/grammar';

// Which Learn guide teaches which grammar form, for the Save grammar buttons
// and the grammar path (lib/grammarGuides.js). Built from each guide's
// meta.grammar and the grammar pattern pages, so a new one shows up here
// with no other change.
export const dynamic = 'force-static';

export function GET() {
    const guides = articles.flatMap((a) => (a.meta.grammar || []).map((g) => ({
        form: g.form,
        language: a.meta.language || 'ko',
        slug: a.meta.slug,
        title: a.meta.shortTitle || a.meta.title,
        // Guides that teach fewer forms are more focused on each one.
        focus: a.meta.grammar.length,
    })));
    // Grammar pattern pages teach one form each; Learn guides cover the
    // forms they don't, so the two lists don't compete.
    const patternGuides = patterns.flatMap((p) => matchForms(p).map((form) => ({
        form,
        language: 'ko',
        slug: p.slug,
        title: p.form,
        href: patternHref(p),
        focus: 1,
    })));
    guides.push(...patternGuides);
    return Response.json({ guides });
}

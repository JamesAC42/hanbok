import { articles } from '@/content/learn';

// Which Learn guide teaches which grammar form, for the Save grammar buttons
// and the grammar path (lib/grammarGuides.js). Built from each guide's
// meta.grammar, so a new guide shows up here with no other change.
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
    return Response.json({ guides });
}

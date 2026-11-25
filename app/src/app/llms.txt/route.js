import { SITE_URL } from '@/lib/seo';
import { articles } from '@/content/learn';
import { phrases, phraseHref } from '@/content/phrases';
import { sayings, sayingHref } from '@/content/how-to-say';
import { patterns, patternHref } from '@/content/grammar';
import { jaPatterns, jaPatternHref } from '@/content/japanese-grammar';
import { jaPhrases, jaPhraseHref } from '@/content/japanese-phrases';

// /llms.txt (llmstxt.org): a plain-text map of the site for AI assistants and
// answer engines, so they can describe Hanbok and link to the right page.
export const dynamic = 'force-static';

const link = (title, path, note) => `- [${title}](${SITE_URL}${path})${note ? `: ${note}` : ''}`;

export function GET() {
    const lines = [
        '# Hanbok',
        '',
        '> Hanbok (hanbokstudy.com) is a Korean learning site built around a sentence analyzer. Paste any Korean sentence, such as a K-pop lyric, a K-drama line or a text message, and Hanbok breaks it down word by word: each word with its dictionary form and romanization, every particle and ending marked and explained, the grammar patterns named, a natural English translation and audio. Words and grammar you look up become flashcards and short reviews. It also works for Japanese and Chinese. Free to try without an account, with paid plans for unlimited use.',
        '',
        'Hanbok is different from a translator like Google Translate or Papago: instead of only returning an English sentence, it shows how the Korean sentence is built so learners understand it.',
        '',
        '## Main tools',
        link('Korean sentence analyzer', '/korean-sentence-analyzer', 'paste a Korean sentence and get a word-by-word breakdown with grammar, translation and audio'),
        link('Japanese sentence analyzer', '/japanese-sentence-analyzer', 'paste a Japanese sentence and get a word-by-word breakdown with furigana, grammar, translation and audio'),
        link('Analyzer (Korean, Japanese, Chinese)', '/analyze'),
        link('K-pop lyrics broken down line by line', '/lyrics', 'popular songs with every line analyzed, plus key words and grammar for each song'),
        link('Hangeul (Korean alphabet)', '/hangeul'),
        link('Pricing', '/pricing'),
        '',
        '## Learn guides',
        'Short beginner and intermediate guides where every example is interactive.',
        ...articles.map(({ meta }) => link(meta.title, `/learn/${meta.slug}`)),
        '',
        `## How to say it in Korean (${sayings.length} pages)`,
        'Each page gives the answer first, then the casual, polite and formal ways to say it, when to use each, and example sentences.',
        link('All "How to say it in Korean" pages', '/how-to-say'),
        ...sayings.map((s) => link(`How to say "${s.english}" in Korean: ${s.answer.ko} (${s.answer.roman})`, sayingHref(s))),
        '',
        `## Korean grammar patterns (${patterns.length} pages)`,
        'Each page explains one ending or particle: what it means, how to attach it, when to use it, look-alikes and common mistakes.',
        link('All Korean grammar patterns', '/grammar'),
        ...patterns.map((g) => link(`${g.form}: ${g.meaning}`, patternHref(g))),
        '',
        `## Japanese grammar points, JLPT N5 to N3 (${jaPatterns.length} pages)`,
        'Each page explains one Japanese particle, verb form or grammar point: what it means, how to form it, when to use it, look-alikes, common mistakes and examples with furigana.',
        link('Japanese grammar list', '/japanese/grammar'),
        ...jaPatterns.map((g) => link(`${g.form} (${g.roman}, JLPT ${g.level}): ${g.meaning}`, jaPatternHref(g))),
        '',
        `## Japanese words explained (${jaPhrases.length} pages)`,
        'What common Japanese words, honorifics and anime expressions mean, with usage notes and examples with furigana.',
        link('All Japanese words', '/japanese/phrases'),
        ...jaPhrases.map((p) => link(`What does ${p.ja} (${p.roman}) mean? ${p.meaning}`, jaPhraseHref(p))),
        '',
        `## Korean words and slang explained (${phrases.length} pages)`,
        'What common Korean words, slang and texting abbreviations mean, with usage notes and examples.',
        link('All Korean phrases', '/phrases'),
        ...phrases.map((p) => link(`What does ${p.ko} (${p.roman}) mean? ${p.meaning}`, phraseHref(p))),
        '',
    ];
    return new Response(lines.join('\n'), {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
}

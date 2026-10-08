// Turns a lyric's saved line analyses into study notes: the words worth
// learning and the grammar the song uses, each tied to the line it came from.
// Runs on the server, so the notes are in the HTML search engines read.
import { articlesForGrammar } from '@/content/learn';
import { phraseForWord, phraseHref } from '@/content/phrases';

const SKIP_TYPES = /particle|punctuation|symbol|interjection|onomatopoeia|suffix|ending/i;
const HANGUL = /[가-힣ㄱ-ㅎ]/;

const lineGroups = (lyric) => (lyric?.analysis?.analysisData || [])
    .map((group) => ({ text: group.text, analysis: group.sentence?.analysis }))
    .filter((group) => group.analysis);

// Korean forms named in a grammar pattern like "-고 싶다 (want to)" or "Particle 은/는":
// whole Korean runs first ("-고 싶다"), then their single words ("싶다").
const formsIn = (pattern) => {
    const runs = (pattern.match(/-?[()가-힣ㄱ-ㅎ/][()가-힣ㄱ-ㅎ/\s-]*/g) || []).map((r) => r.trim());
    const words = runs.flatMap((r) => r.split(/\s+/));
    return [...new Set([...runs, ...words])].filter((f) => HANGUL.test(f));
};

const guideFor = (pattern, language) => {
    if (language !== 'ko') return null;
    for (const form of formsIn(pattern)) {
        const [article] = articlesForGrammar(form);
        if (article) return { href: `/learn/${article.meta.slug}`, title: article.meta.shortTitle };
    }
    return null;
};

export function buildStudyNotes(lyric, { maxWords = 12, maxGrammar = 8 } = {}) {
    const isKorean = lyric.language === 'ko';
    const groups = lineGroups(lyric);
    const words = new Map();
    const grammar = new Map();

    for (const { text, analysis } of groups) {
        const line = { text: analysis.sentence?.original || text, translation: analysis.sentence?.translation };

        for (const c of analysis.components || []) {
            const base = (c.dictionary_form || c.text || '').trim();
            const meaning = c.meaning?.description?.trim();
            if (!base || !meaning || SKIP_TYPES.test(c.type || '')) continue;
            const word = words.get(base) || { ko: base, rom: c.reading || c.transliteration || '', en: meaning, count: 0, seen: c.text };
            word.count += 1;
            words.set(base, word);
        }

        for (const g of analysis.grammar_points || []) {
            const pattern = g.pattern?.trim();
            if (!pattern || !g.explanation) continue;
            const key = pattern.toLowerCase();
            if (!grammar.has(key)) {
                grammar.set(key, { pattern, explanation: g.explanation, line, count: 0, guide: guideFor(pattern, lyric.language) });
            }
            grammar.get(key).count += 1;
        }
    }

    // Most repeated first; ties keep song order.
    const byCount = (a, b) => b.count - a.count;
    const vocab = [...words.values()].sort(byCount).slice(0, maxWords).map(({ ko, rom, en, count, seen }) => ({
        ko,
        rom,
        en,
        note: [seen && seen !== ko ? `In the song: ${seen}` : '', count > 1 ? `Appears ${count} times` : ''].filter(Boolean).join(' · '),
        ...(isKorean && phraseForWord(ko) && { href: phraseHref(phraseForWord(ko)) }),
    }));
    // Points with a Learn guide first, so readers can go deeper.
    const points = [...grammar.values()].sort((a, b) => (!!b.guide - !!a.guide) || byCount(a, b)).slice(0, maxGrammar);

    return { vocab, grammar: points, lineCount: groups.length, wordCount: words.size, grammarCount: grammar.size };
}

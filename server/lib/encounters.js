// "It knows what you know": for one analysis, which words and grammar points
// this learner has already met in their other sentences, and how many are new.

const { extractForm, aliasKey, formKeys } = require('../grammar/forms');

const SKIP_TYPES = new Set(['punctuation', 'particle', 'symbol', 'number']);

// Keys a grammar name matches on: its target-language form (and each slash
// variant) when there is one, else the exact wording.
const grammarKeys = (pattern, language) => {
    const form = extractForm(pattern, language);
    const keys = form ? formKeys(form) : [];
    return keys.length ? keys : [aliasKey(pattern)].filter(Boolean);
};

const wordsOf = (analysis) => {
    const out = new Set();
    for (const c of analysis?.components || []) {
        const type = String(c?.type || '').toLowerCase();
        const form = typeof c?.dictionary_form === 'string' ? c.dictionary_form.trim() : '';
        if (!form || SKIP_TYPES.has(type) || !/[\p{L}]/u.test(form)) continue;
        out.add(form);
    }
    return [...out];
};

// Fit: few new things is "just right"; none is review; many is a stretch.
const fitVerdict = (newWords, newGrammar, totalWords) => {
    if (!totalWords) return null;
    if (newWords === 0 && newGrammar === 0) return 'review';
    if (newWords <= 3 && newGrammar <= 2 && newWords / totalWords <= 0.5) return 'just_right';
    return 'stretch';
};

const MIN_HISTORY = 5;

/**
 * current: { analysis, text, sentenceId }
 * history: the learner's other sentences, newest first:
 *   [{ sentenceId, publicId, text, dateCreated, analysis: { components, grammar_points } }]
 */
const computeEncounters = (current, history, language) => {
    const others = history.filter(h => h.sentenceId !== current.sentenceId && h.text !== current.text);

    const seenWords = new Map();
    for (const h of others) {
        for (const w of wordsOf(h.analysis)) seenWords.set(w, (seenWords.get(w) || 0) + 1);
    }
    const words = wordsOf(current.analysis).map(form => ({ form, count: seenWords.get(form) || 0 }));

    const grammar = (current.analysis?.grammar_points || []).map((gp) => {
        const keys = new Set(grammarKeys(gp?.pattern, language));
        let count = 0;
        let last = null;
        for (const h of others) {
            const hit = (h.analysis?.grammar_points || []).some(o => grammarKeys(o?.pattern, language).some(k => keys.has(k)));
            if (!hit) continue;
            count += 1;
            if (!last) last = { sentenceId: h.sentenceId, publicId: h.publicId || null, text: h.text };
        }
        return { pattern: gp?.pattern || '', count, last };
    });

    const enoughHistory = others.length >= MIN_HISTORY;
    const newWords = words.filter(w => !w.count).map(w => w.form);
    const newGrammar = grammar.filter(g => !g.count).length;
    return {
        words,
        grammar,
        fit: enoughHistory ? {
            newWords,
            newGrammar,
            totalWords: words.length,
            verdict: fitVerdict(newWords.length, newGrammar, words.length),
        } : null,
        historySize: others.length,
    };
};

module.exports = { grammarKeys, wordsOf, fitVerdict, computeEncounters, MIN_HISTORY };

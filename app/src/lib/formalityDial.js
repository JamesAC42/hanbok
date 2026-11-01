// Turns an analysis's variants into stops on a formality dial, from casual to
// formal, with the learner's own sentence placed among them, and marks which
// words change between a stop and the original.

const RANKS = [
    [/informal|casual|intimate|banmal|반말|friend|close|plain speech/i, 0],
    [/written|literary|해라|diary|narrative/i, 3],
    [/formal|합니다|deferential|honorific|respect|business/i, 2],
    [/polite|해요|standard|neutral/i, 1],
];

export const formalityRank = (label = '') => {
    for (const [pattern, rank] of RANKS) {
        if (pattern.test(label)) return rank;
    }
    return null;
};

const normalize = (text = '') => text.replace(/[.,!?。！？\s]+$/u, '').replace(/\s+/g, ' ').trim();

// Words of `text` that differ from `base`: everything between the longest
// shared run of words at the start and at the end.
export const markChanges = (text = '', base = '') => {
    const a = text.trim().split(/\s+/);
    const b = base.trim().split(/\s+/);
    let start = 0;
    while (start < a.length && start < b.length && a[start] === b[start]) start++;
    let end = 0;
    while (end < a.length - start && end < b.length - start && a[a.length - 1 - end] === b[b.length - 1 - end]) end++;
    return a.map((word, i) => ({ word, changed: i >= start && i < a.length - end }));
};

export const buildDial = (analysis) => {
    const variants = analysis?.register_variants || analysis?.variants;
    const original = analysis?.sentence?.original || '';
    if (!variants || typeof variants !== 'object' || !original) return null;

    const stops = Object.entries(variants)
        .filter(([, v]) => v && typeof v.text === 'string' && v.text.trim())
        .map(([label, v], order) => ({ label, text: v.text.trim(), reading: v.reading, transliteration: v.transliteration, when: v.when_to_use || '', rank: formalityRank(label), order }));
    if (!stops.length) return null;

    // The learner's own sentence is a stop too, unless a variant repeats it.
    const same = stops.find(s => normalize(s.text) === normalize(original));
    if (same) same.isOriginal = true;
    else {
        stops.push({
            label: 'Your sentence',
            text: original,
            when: analysis.sentence.formality || '',
            rank: formalityRank(analysis.sentence.formality || ''),
            order: -1,
            isOriginal: true,
        });
    }

    // Unknown ranks sit in the middle; ties keep the model's order.
    const rankOf = s => (s.rank === null ? 1.5 : s.rank);
    stops.sort((x, y) => rankOf(x) - rankOf(y) || x.order - y.order);

    return {
        stops: stops.map(s => ({ ...s, words: markChanges(s.text, original) })),
        start: stops.findIndex(s => s.isOriginal),
    };
};

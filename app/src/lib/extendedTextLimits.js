// Characters per passage by plan (0 free, 1 Basic, 2 Plus). Matches
// TIER_CHARACTER_LIMITS in server/lib/extendedTextSplit.js.
export const CHARACTER_LIMITS = { 0: 1000, 1: 5000, 2: 20000 };

export const characterLimitFor = (tier) => CHARACTER_LIMITS[tier] ?? CHARACTER_LIMITS[0];

// Same sentence and paragraph split as the server, for the live counts on
// the paste screen.
const CJK_BOUNDARY = /(?<=[。！？])(?![。！？」』）)"'”’\s])/;
const ASCII_BOUNDARY = /(?<=[.!?。！？])\s+/;

export const countPassage = (text) => {
    let sentences = 0;
    let paragraphs = 0;
    for (const block of text.split(/\r?\n[ \t　]*\r?\n/)) {
        const count = block
            .split(/\r?\n+/)
            .flatMap((line) => line.split(ASCII_BOUNDARY))
            .flatMap((part) => part.split(CJK_BOUNDARY))
            .filter((s) => s.trim().length > 0).length;
        if (count > 0) {
            sentences += count;
            paragraphs += 1;
        }
    }
    return { sentences, paragraphs };
};

// Rough wait for the reading pass: sentences are read about 6 at a time,
// 8 calls in parallel, ~9 seconds a call.
export const estimateSeconds = (sentences) => {
    if (sentences <= 0) return 0;
    const waves = Math.ceil(sentences / 6 / 8);
    return Math.max(10, waves * 9);
};

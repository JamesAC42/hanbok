// Split text into sentences.
// - Line breaks always end a sentence (pasted paragraphs, dialogue, lyrics often
//   have no terminal punctuation on each line).
// - Full-width CJK terminators (。！？) end a sentence even with no following space,
//   since Japanese/Chinese text is normally written without spaces — unless the
//   terminator is followed by a closing quote/bracket (e.g. 「行こう。」と言った).
// - ASCII terminators (.!?) end a sentence only when followed by whitespace, so
//   decimals, abbreviations and URLs are left intact.
// Previously only "terminator + whitespace" split, so newline-separated or CJK text
// collapsed into one huge "sentence" that the per-sentence analyzer then only
// partially broke down.
const CJK_BOUNDARY = /(?<=[。！？])(?![。！？」』）)"'”’\s])/;
const ASCII_BOUNDARY = /(?<=[.!?。！？])\s+/;

// Character limit per text by plan (0 free, 1 Basic, 2 Plus). The reading
// pass makes a 20,000-character text cost about what 5,000 characters did
// with one full breakdown per sentence.
const TIER_CHARACTER_LIMITS = {
    0: 1000,
    1: 5000,
    2: 20000
};

const splitIntoSentences = (text) => {
    return text
        .split(/\r?\n+/)
        .flatMap((line) => line.split(ASCII_BOUNDARY))
        .flatMap((part) => part.split(CJK_BOUNDARY))
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
};

// Paragraphs are separated by a blank line. Returns the sentences and the
// paragraph index of each one.
const splitIntoParagraphs = (text) => {
    const sentences = [];
    const paragraphs = [];
    text.split(/\r?\n[ \t\u3000]*\r?\n/).forEach((block) => {
        const blockSentences = splitIntoSentences(block);
        if (blockSentences.length === 0) return;
        const paragraph = paragraphs.length > 0 ? paragraphs[paragraphs.length - 1] + 1 : 0;
        for (const sentence of blockSentences) {
            sentences.push(sentence);
            paragraphs.push(paragraph);
        }
    });
    return { sentences, paragraphs };
};

module.exports = {
    TIER_CHARACTER_LIMITS,
    splitIntoSentences,
    splitIntoParagraphs
};

// Splits a sentence into the reading pass's words and the text between them
// (spaces, punctuation), so each word can be a button and the sentence still
// reads exactly as written. Words that can't be found in order are skipped.
export const segmentSentence = (text, words = []) => {
    const parts = [];
    let cursor = 0;
    words.forEach((word, index) => {
        if (!word?.text) return;
        const position = text.indexOf(word.text, cursor);
        if (position === -1) return;
        if (position > cursor) parts.push({ gap: text.slice(cursor, position) });
        parts.push({ word: index, text: word.text });
        cursor = position + word.text.length;
    });
    if (cursor < text.length) parts.push({ gap: text.slice(cursor) });
    return parts;
};

// Languages written without spaces between sentences.
export const joinsWithoutSpace = (language) => ['ja', 'zh', 'zh-TW'].includes(language);

// Groups sentences into paragraphs, keeping their order.
export const groupParagraphs = (sentences) => {
    const groups = [];
    sentences.forEach((sentence) => {
        const last = groups[groups.length - 1];
        if (last && last.paragraph === sentence.paragraph) {
            last.sentences.push(sentence);
        } else {
            groups.push({ paragraph: sentence.paragraph, sentences: [sentence] });
        }
    });
    return groups;
};

// Content words worth flagging or saving (not particles and endings).
const CONTENT_POS = new Set(['noun', 'verb', 'adjective', 'adverb', 'expression', 'numeral', 'pronoun']);
export const isContentWord = (word) => !word?.pos || CONTENT_POS.has(word.pos);

// Play-along and shadowing helpers. Words come from
// /api/sentences/:id/karaoke as [{ text, start, end }] in seconds.

// Index of the word being spoken at time t, or -1 before the first word.
// Between two words the earlier one stays lit, so the highlight never flickers.
export const activeWordAt = (words, t) => {
    let idx = -1;
    for (let i = 0; i < words.length; i++) {
        if (words[i].start <= t) idx = i; else break;
    }
    return idx;
};

const ENDS_PHRASE = /[.,!?;:…。、，！？]$/;

// Short phrases to repeat one at a time: break at punctuation, otherwise
// after about maxSeconds of speech or maxWords words.
export const shadowPhrases = (words, { maxSeconds = 1.8, maxWords = 3 } = {}) => {
    const phrases = [];
    let cur = null;
    words.forEach((w, i) => {
        if (!cur) cur = { from: i, to: i, start: w.start, end: w.end };
        cur.to = i;
        cur.end = w.end;
        const long = cur.end - cur.start >= maxSeconds || cur.to - cur.from + 1 >= maxWords;
        if (ENDS_PHRASE.test(w.text) || long || i === words.length - 1) {
            phrases.push(cur);
            cur = null;
        }
    });
    return phrases;
};

// How long the learner gets to repeat a phrase: a bit longer than it took,
// never less than a second and a half.
export const repeatGapMs = (phrase, rate = 1) =>
    Math.max(1500, Math.round(((phrase.end - phrase.start) / rate) * 1500 + 600));

const SENTENCES = require('../data/dailySentences');

const DAY_MS = 24 * 60 * 60 * 1000;
// Day 0 of the rotation; any fixed date works.
const EPOCH = Date.UTC(2026, 0, 1);

const dayIndex = (now) => Math.floor((now.getTime() - EPOCH) / DAY_MS);

// The same sentence for everyone on a given UTC day.
const dailySentence = (now = new Date()) => {
    const index = ((dayIndex(now) % SENTENCES.length) + SENTENCES.length) % SENTENCES.length;
    return { ...SENTENCES[index], date: new Date(dayIndex(now) * DAY_MS + EPOCH).toISOString().slice(0, 10) };
};

const normalize = (text) => (typeof text === 'string' ? text.trim().replace(/\s+/g, ' ') : '');

// Breaking down the sentence of the day is free. Yesterday's still counts, so
// a learner whose evening is already the next UTC day isn't charged.
const isDailySentence = (text, now = new Date()) => {
    const value = normalize(text);
    if (!value) return false;
    return [now, new Date(now.getTime() - DAY_MS)].some((day) => normalize(dailySentence(day).text) === value);
};

module.exports = { dailySentence, isDailySentence };

// Turns ElevenLabs character alignment into word timings for play-along and
// shadowing: [{ text, start, end }] in seconds, one entry per space-separated
// word of the text that was read.

const round = (n) => Math.round(n * 1000) / 1000;

const wordTimings = (alignment) => {
    const chars = alignment?.characters || [];
    const starts = alignment?.character_start_times_seconds || [];
    const ends = alignment?.character_end_times_seconds || [];
    const words = [];
    let cur = null;
    chars.forEach((ch, i) => {
        if (/\s/.test(ch)) { cur = null; return; }
        const start = Number(starts[i]) || 0;
        const end = Number(ends[i]) || start;
        if (!cur) {
            cur = { text: '', start, end };
            words.push(cur);
        }
        cur.text += ch;
        cur.end = Math.max(cur.end, end);
    });
    return words.map(w => ({ text: w.text, start: round(w.start), end: round(w.end) }));
};

const MAX_TEXT = 300;

module.exports = { wordTimings, MAX_TEXT };

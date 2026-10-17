// Builds a short drill from one analysis: put the words in order, fill in a
// particle, match a word to its meaning. Everything comes from the analysis
// itself, so it costs no extra LLM call.

const strip = (s = '') => s.replace(/[.,!?。、！？…"“”'‘’()[\]{}:;~·\s]/g, '');

// Korean particles grouped by the sound before them, so wrong options look
// equally plausible (all after-vowel or all after-consonant forms).
const KO_AFTER_VOWEL = ['는', '를', '가', '와', '로', '랑'];
const KO_AFTER_CONSONANT = ['은', '을', '이', '과', '으로', '이랑'];
const KO_EITHER = ['에', '에서', '의', '도', '하고', '한테', '에게', '까지', '부터', '만', '처럼', '보다'];
const JA_PARTICLES = ['は', 'が', 'を', 'に', 'で', 'の', 'と', 'も', 'へ', 'から', 'まで', 'より'];

const shuffle = (list, seed = 1) => {
    // Seeded so the same sentence always shuffles the same way (and server
    // and client renders agree).
    const out = list.slice();
    let s = seed;
    for (let i = out.length - 1; i > 0; i--) {
        s = (s * 9301 + 49297) % 233280;
        const j = Math.floor((s / 233280) * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
};

const seedOf = (text = '') => Array.from(text).reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) % 100000, 7) || 1;

const particleText = (p) => strip(String(p?.particle || '').split(/[\s(/]/)[0]);

const particleOptions = (particle, language) => {
    let pool;
    if (language === 'ja') pool = JA_PARTICLES;
    else if (KO_AFTER_VOWEL.includes(particle)) pool = KO_AFTER_VOWEL;
    else if (KO_AFTER_CONSONANT.includes(particle)) pool = KO_AFTER_CONSONANT;
    else pool = KO_EITHER;
    const others = shuffle(pool.filter(p => p !== particle), seedOf(particle)).slice(0, 2);
    if (others.length < 2) return null;
    return shuffle([particle, ...others], seedOf(particle) + 3);
};

export const buildPractice = (analysis, language = 'ko') => {
    const sentence = analysis?.sentence?.original || '';
    const translation = analysis?.sentence?.translation || '';
    const parts = (analysis?.components || [])
        .filter(c => c && c.type !== 'punctuation' && strip(c.text))
        .map(c => ({ ...c, text: c.text.trim() }));
    const seed = seedOf(sentence);
    const exercises = [];

    // 1. Word order: 3 to 9 pieces, and not already in order after shuffling.
    if (parts.length >= 3 && parts.length <= 9) {
        const answer = parts.map(c => c.text);
        let tiles = shuffle(answer, seed);
        if (tiles.join('|') === answer.join('|')) tiles = [...answer.slice(1), answer[0]];
        exercises.push({ kind: 'order', prompt: translation, answer, tiles });
    }

    // 2. Particle: blank out a particle attached to the end of a word.
    for (const c of parts) {
        const particle = (c.grammar?.particles || []).map(particleText).find(p => p && strip(c.text).endsWith(p) && strip(c.text) !== p);
        if (!particle) continue;
        const options = particleOptions(particle, language);
        if (!options) continue;
        const word = strip(c.text);
        const at = sentence.indexOf(word);
        if (at === -1) continue;
        exercises.push({
            kind: 'particle',
            prompt: translation,
            before: sentence.slice(0, at + word.length - particle.length),
            after: sentence.slice(at + word.length),
            answer: particle,
            options,
            note: (c.grammar.particles.find(p => particleText(p) === particle)?.function) || '',
        });
        break;
    }

    // 3. Meaning: pick what one word means, with other words' meanings as decoys.
    const withMeaning = parts.filter(c => c.meaning?.description);
    if (withMeaning.length >= 3) {
        const target = withMeaning[seed % withMeaning.length];
        const decoys = shuffle(withMeaning.filter(c => c !== target), seed + 1).slice(0, 2);
        exercises.push({
            kind: 'meaning',
            word: target.text,
            answer: target.meaning.description,
            options: shuffle([target, ...decoys].map(c => c.meaning.description), seed + 2),
        });
    }

    return exercises;
};

// Daily allowance: Free 1, Basic 3, Plus unlimited. Counted on this device;
// the drill costs nothing to run, so a soft limit is enough.
export const PRACTICE_PER_DAY = { 0: 1, 1: 3 };

const dayKey = () => {
    const d = new Date();
    return `practice-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

export const practiceUsedToday = () => {
    try {
        return JSON.parse(localStorage.getItem(dayKey()) || '[]');
    } catch {
        return [];
    }
};

export const notePracticeStarted = (sentenceKey) => {
    try {
        const used = practiceUsedToday();
        if (used.includes(sentenceKey)) return;
        localStorage.setItem(dayKey(), JSON.stringify([...used, sentenceKey]));
    } catch {
        // Private mode: the limit just doesn't stick.
    }
};

// Can this learner start a drill on this sentence? Restarting one they
// already started today is always free.
export const canPractice = (tier = 0, sentenceKey) => {
    if (tier >= 2) return true;
    const used = practiceUsedToday();
    if (used.includes(sentenceKey)) return true;
    return used.length < (PRACTICE_PER_DAY[tier] ?? 1);
};

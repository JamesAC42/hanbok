// Quiz questions for one grammar point, written around words the learner
// saved. One model call makes a batch; code checks every question before it
// is stored, so a bad one never reaches a learner.
const llm = require('./llm');
const SupportedLanguages = require('../supported_languages');

const BATCH_SIZE = 8;
const LOW_WATER = 3;
const WORDS_PER_BATCH = 12;
const MAX_SENTENCE_CHARS = 90;
const MAX_OPTION_CHARS = 120;
const TYPES = ['fill_gap', 'meaning', 'pick_correct', 'build'];

const QUIZ_SCHEMA = {
    type: 'object',
    properties: {
        items: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    type: { type: 'string', enum: TYPES },
                    sentence: { type: 'string', description: 'The full, correct sentence in the learning language' },
                    translation: { type: 'string', description: 'Natural translation of sentence' },
                    blank: { type: 'string', description: 'fill_gap only: the exact part of sentence that is blanked out' },
                    options: { type: 'array', items: { type: 'string' } },
                    explanation: { type: 'string', description: 'One or two short sentences on why the answer is right' },
                    word_ids: { type: 'array', items: { type: 'integer' } },
                },
                required: ['type', 'sentence', 'translation', 'options', 'explanation', 'word_ids'],
            },
        },
    },
    required: ['items'],
};

const quizPrompt = ({ languageName, uiLanguageName, point, words }) => `You write short practice questions for a ${languageName} learner.

Grammar point: ${point.form} (${point.name})
${point.explanation ? `How it was explained to the learner: ${point.explanation}\n` : ''}${point.example ? `Sentence where the learner met it: ${point.example}\n` : ''}
Words the learner has saved (id | word | meaning):
${words.length ? words.map((w) => `${w.wordId} | ${w.originalWord} | ${w.translatedWord}`).join('\n') : '(none yet; use very common beginner words)'}

Write ${BATCH_SIZE} questions that each practice ${point.form}. Mix the types:
- 3 x "fill_gap": "sentence" is a correct sentence. "blank" is the exact substring of "sentence" that carries the grammar (copied character for character, e.g. "니까" or "으니까" or "는"). "options" has 4 different short choices: the blank plus 3 plausible wrong forms (other endings or particles a learner might confuse). Each wrong option must make the sentence ungrammatical or clearly wrong, never just a different correct sentence.
- 2 x "meaning": "options" has 4 different ${uiLanguageName} translations: the correct "translation" plus 3 that a learner who misread the grammar would pick.
- 1 x "pick_correct": "sentence" is a correct sentence. "options" has 3 sentences: "sentence" itself plus 2 versions with the grammar used wrongly (wrong form, wrong conjugation or wrong situation). The wrong ones must be clearly wrong to a teacher. A different ending that is also grammatical (for example -는데 in place of -니까) does not count as wrong.
- 2 x "build": "sentence" is a correct sentence of 3 to 7 words separated by spaces. "options" is an empty array.

Rules:
- Every sentence uses at least one of the learner's saved words (list their ids in "word_ids"; use [] only if none were given). Use them in natural, everyday situations that make sense (people go to a café, not to "coffee").
- Keep sentences short (under ${MAX_SENTENCE_CHARS} characters), natural and correct. Use polite 요 style unless the grammar point is about another speech level.
- Every other word in a sentence should be simpler than the grammar point.
- "translation", the "meaning" options and "explanation" are in ${uiLanguageName}. Explanations are one or two short, friendly sentences for a beginner.
- Do not repeat the same sentence twice.
Return JSON only.`;

const clean = (s) => (typeof s === 'string' ? s.trim() : '');

const initialConsonant = (ch) => {
    const code = ch.codePointAt(0) - 0xac00;
    return code >= 0 && code < 11172 ? Math.floor(code / 588) : null;
};

// Loose jamo never appear in a real sentence; the cheap model emits them
// when it garbles Hangul.
const LOOSE_JAMO = /[\u1100-\u11ff\u3130-\u318f\ua960-\ua97f\ud7b0-\ud7ff]/;

// Loose match of a saved word inside a sentence: the word itself, or its
// stem for verbs and adjectives (가다 -> 가, 먹다 -> 먹) since they get
// conjugated.
const usesWord = (sentence, word) => {
    const w = clean(word.originalWord);
    if (!w) return false;
    if (sentence.includes(w)) return true;
    if (word.originalLanguage === 'ko' && w.endsWith('다') && w.length >= 2) {
        const stem = w.slice(0, -1);
        // One-syllable stems contract when conjugated (오다 -> 와요), so only
        // the opening consonant has to show up at the start of a syllable.
        if (stem.length === 1) {
            const lead = initialConsonant(stem);
            return lead !== null && [...sentence].some((ch) => initialConsonant(ch) === lead);
        }
        return sentence.includes(stem.slice(0, -1));
    }
    if (word.originalLanguage === 'ja' && w.length >= 2 && sentence.includes(w.slice(0, -1))) return true;
    return false;
};

// Returns the questions that pass every check, ready to store.
const validateItems = (items, words) => {
    const seen = new Set();
    const valid = [];
    for (const raw of Array.isArray(items) ? items : []) {
        if (!raw || !TYPES.includes(raw.type)) continue;
        const sentence = clean(raw.sentence);
        const translation = clean(raw.translation);
        const explanation = clean(raw.explanation);
        if (!sentence || !translation || sentence.length > MAX_SENTENCE_CHARS || seen.has(sentence)) continue;
        if (LOOSE_JAMO.test(sentence)) continue;
        const options = (Array.isArray(raw.options) ? raw.options : []).map(clean).filter(Boolean);
        if (options.some((o) => o.length > MAX_OPTION_CHARS)) continue;
        const distinct = new Set(options);

        const item = { type: raw.type, sentence, translation, explanation: explanation.slice(0, 400) };
        if (raw.type === 'fill_gap') {
            const blank = clean(raw.blank);
            if (!blank || options.length !== 4 || distinct.size !== 4) continue;
            if (options.filter((o) => o === blank).length !== 1) continue;
            const at = sentence.indexOf(blank);
            if (at === -1 || sentence.indexOf(blank, at + 1) !== -1) continue;
            item.before = sentence.slice(0, at);
            item.after = sentence.slice(at + blank.length);
            item.options = options;
            item.answer = blank;
        } else if (raw.type === 'meaning') {
            if (options.length !== 4 || distinct.size !== 4) continue;
            if (options.filter((o) => o === translation).length !== 1) continue;
            item.options = options;
            item.answer = translation;
        } else if (raw.type === 'pick_correct') {
            if (options.length < 3 || options.length > 4 || distinct.size !== options.length) continue;
            if (options.filter((o) => o === sentence).length !== 1) continue;
            item.options = options;
            item.answer = sentence;
        } else if (raw.type === 'build') {
            const tiles = sentence.split(/\s+/).filter(Boolean);
            if (tiles.length < 3 || tiles.length > 8) continue;
            item.tiles = tiles;
            item.answer = sentence;
        }

        const ids = (Array.isArray(raw.word_ids) ? raw.word_ids : []).map(Number);
        const used = words.filter((w) => ids.includes(w.wordId) && usesWord(sentence, w));
        if (words.length > 0 && used.length === 0) continue;
        item.wordIds = used.map((w) => w.wordId);
        item.words = used.map((w) => w.originalWord);

        seen.add(sentence);
        valid.push(item);
    }
    return valid;
};

const shuffle = (list) => {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

// Half the newest saved words, half picked at random from the rest, so
// questions keep fresh words in play without forgetting older ones.
const pickWords = async (db, userId, language) => {
    const recent = await db.collection('words')
        .find({ userId, originalLanguage: language }, { projection: { _id: 0, wordId: 1, originalWord: 1, translatedWord: 1, originalLanguage: 1 } })
        .sort({ dateSaved: -1 })
        .limit(200)
        .toArray();
    const half = Math.ceil(WORDS_PER_BATCH / 2);
    return [...recent.slice(0, half), ...shuffle(recent.slice(half)).slice(0, WORDS_PER_BATCH - half)];
};

// Generates and stores a batch of questions for one saved point.
const generateBatch = async (db, saved, entry) => {
    const words = await pickWords(db, saved.userId, saved.language);
    const firstSource = (saved.sources || [])[0];
    const point = {
        form: entry.form,
        name: entry.name,
        explanation: saved.explanation,
        example: firstSource?.text || saved.examples?.[0]?.original || '',
    };
    const response = await llm.callJson(quizPrompt({
        languageName: SupportedLanguages[saved.language] || saved.language,
        uiLanguageName: SupportedLanguages[saved.uiLanguage] || 'english',
        point,
        words,
    }), QUIZ_SCHEMA);
    const items = validateItems(response?.items, words);
    if (items.length) {
        const now = new Date();
        await db.collection('grammar_quiz_items').insertMany(items.map((item) => ({
            ...item,
            userId: saved.userId,
            grammarId: saved.grammarId,
            dateCreated: now,
            usedAt: null,
        })));
    }
    return items.length;
};

const pending = new Map();

// Makes sure a point has unused questions. Returns once some exist when the
// bank is empty; otherwise refills in the background.
const ensureBank = async (db, saved, entry, { wait = true } = {}) => {
    const unused = await db.collection('grammar_quiz_items')
        .countDocuments({ userId: saved.userId, grammarId: saved.grammarId, usedAt: null });
    if (unused >= LOW_WATER) return unused;

    const key = `${saved.userId}:${saved.grammarId}`;
    if (!pending.has(key)) {
        pending.set(key, generateBatch(db, saved, entry)
            .catch((error) => {
                console.error(`[grammar] question batch failed for ${key}:`, error.message);
                return 0;
            })
            .finally(() => pending.delete(key)));
    }
    if (unused > 0 || !wait) return unused;
    return pending.get(key);
};

// The question as the learner's browser gets it. Options are shuffled here.
const toClientItem = (item) => ({
    itemId: String(item._id),
    type: item.type,
    sentence: item.sentence,
    translation: item.translation,
    before: item.before,
    after: item.after,
    options: item.options ? shuffle(item.options) : undefined,
    tiles: item.tiles ? shuffle(item.tiles) : undefined,
    answer: item.answer,
    explanation: item.explanation,
    words: item.words || [],
});

module.exports = {
    BATCH_SIZE,
    QUIZ_SCHEMA,
    quizPrompt,
    validateItems,
    usesWord,
    pickWords,
    generateBatch,
    ensureBank,
    toClientItem,
    shuffle,
};

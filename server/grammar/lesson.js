// Horangi's mini lesson for a grammar point. The generic lesson is written
// once per point and explanation language and shared by every learner; the
// learner's own examples come from their question bank.
const llm = require('./llm');
const SupportedLanguages = require('../supported_languages');

const LESSON_SCHEMA = {
    type: 'object',
    properties: {
        intro: { type: 'string', description: 'What the grammar does, in one or two friendly sentences' },
        formula: {
            type: 'array',
            description: 'How it is built, left to right, e.g. ["Verb stem", "+", "(으)니까", "+", "suggestion"]',
            items: { type: 'object', properties: { text: { type: 'string' }, grammar: { type: 'boolean' } }, required: ['text', 'grammar'] },
        },
        formula_note: { type: 'string', description: 'One sentence on how the form changes (after a vowel or consonant, irregulars)' },
        examples: {
            type: 'array',
            items: {
                type: 'object',
                properties: { sentence: { type: 'string' }, translation: { type: 'string' }, note: { type: 'string' } },
                required: ['sentence', 'translation', 'note'],
            },
        },
        mistake: {
            type: 'object',
            properties: { wrong: { type: 'string' }, right: { type: 'string' }, why: { type: 'string' } },
            required: ['wrong', 'right', 'why'],
        },
        check: {
            type: 'object',
            properties: {
                question: { type: 'string' },
                options: { type: 'array', items: { type: 'string' } },
                answer: { type: 'string' },
                explanation: { type: 'string' },
            },
            required: ['question', 'options', 'answer', 'explanation'],
        },
    },
    required: ['intro', 'formula', 'formula_note', 'examples', 'mistake', 'check'],
};

const lessonPrompt = ({ languageName, uiLanguageName, entry }) => `You are Horangi, a warm and clear ${languageName} tutor. Write a 2-minute lesson on one grammar point for a beginner.

Grammar point: ${entry.form} (${entry.name})

Write everything a learner reads in ${uiLanguageName}, except ${languageName} sentences and forms.
- intro: what it does and when people use it, in one or two short sentences. Talk to the learner as "you".
- formula: the building blocks from left to right. Mark the grammar form itself with grammar: true. Use "+" pieces between blocks. 3 to 5 blocks.
- formula_note: one sentence on how the form changes (after a vowel or a consonant, common irregulars). Leave it empty if it never changes.
- examples: exactly 2 short, natural, everyday sentences using it, each with a translation and a one-line note on what to notice.
- mistake: the most common learner mistake with this grammar. "wrong" is a learner's sentence that is wrong only in how it uses this grammar; "right" is the same sentence corrected so a native speaker would say it; "why" explains it in one sentence. Double-check that "right" is fully correct and natural.
- check: one multiple-choice question that tests understanding, with exactly 3 options; "answer" is copied exactly from "options"; one-sentence explanation.
Keep every sentence short and plain. Return JSON only.`;

const clean = (s) => (typeof s === 'string' ? s.trim() : '');

const validateLesson = (raw) => {
    if (!raw || typeof raw !== 'object') return null;
    const intro = clean(raw.intro);
    const formula = (Array.isArray(raw.formula) ? raw.formula : [])
        .map((p) => {
            const text = clean(p?.text);
            // The model sometimes spells the joiner out as "Plus".
            return /^(\+|plus)$/i.test(text) ? { text: '+', grammar: false } : { text, grammar: !!p?.grammar };
        })
        .filter((p) => p.text)
        .slice(0, 9);
    const examples = (Array.isArray(raw.examples) ? raw.examples : [])
        .map((e) => ({ sentence: clean(e?.sentence), translation: clean(e?.translation), note: clean(e?.note) }))
        .filter((e) => e.sentence && e.translation && e.sentence.length <= 120)
        .slice(0, 2);
    const mistake = raw.mistake && clean(raw.mistake.wrong) && clean(raw.mistake.right)
        ? { wrong: clean(raw.mistake.wrong), right: clean(raw.mistake.right), why: clean(raw.mistake.why) }
        : null;
    const options = (Array.isArray(raw.check?.options) ? raw.check.options : []).map(clean).filter(Boolean);
    const answer = clean(raw.check?.answer);
    const check = clean(raw.check?.question) && options.length >= 2 && options.length <= 4
        && new Set(options).size === options.length && options.filter((o) => o === answer).length === 1
        ? { question: clean(raw.check.question), options, answer, explanation: clean(raw.check.explanation) }
        : null;
    if (!intro || formula.length < 2 || examples.length < 1) return null;
    return { intro, formula, formulaNote: clean(raw.formula_note), examples, mistake, check };
};

const pending = new Map();

// The shared lesson for a point, generating it the first time it's asked for.
const getLesson = async (db, entry, uiLanguage) => {
    const lessons = db.collection('grammar_lessons');
    const cached = await lessons.findOne({ grammarId: entry.grammarId, uiLanguage });
    if (cached) return cached.lesson;

    const key = `${entry.grammarId}:${uiLanguage}`;
    if (!pending.has(key)) {
        pending.set(key, (async () => {
            const prompt = lessonPrompt({
                languageName: SupportedLanguages[entry.language] || entry.language,
                uiLanguageName: SupportedLanguages[uiLanguage] || 'english',
                entry,
            });
            // The lesson model writes better lessons but is often overloaded;
            // fall back to the everyday model rather than show no lesson.
            const write = async (model) => {
                try {
                    return validateLesson(await llm.callJson(prompt, LESSON_SCHEMA, { model, timeoutMs: 60000 }));
                } catch (error) {
                    console.error(`[grammar] lesson with ${model} failed:`, error.message);
                    return null;
                }
            };
            let lesson = await write(llm.LESSON_MODEL);
            if (!lesson && llm.GRAMMAR_MODEL !== llm.LESSON_MODEL) lesson = await write(llm.GRAMMAR_MODEL);
            if (!lesson) throw new Error('The lesson did not pass checks');
            await lessons.updateOne(
                { grammarId: entry.grammarId, uiLanguage },
                { $setOnInsert: { lesson, dateCreated: new Date() } },
                { upsert: true }
            );
            return lesson;
        })().finally(() => pending.delete(key)));
    }
    return pending.get(key);
};

module.exports = { LESSON_SCHEMA, lessonPrompt, validateLesson, getLesson };

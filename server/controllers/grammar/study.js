const { ObjectId } = require('mongodb');
const { getDb } = require('../../database');
const { getLesson } = require('../../grammar/lesson');
const { ensureBank, toClientItem, shuffle } = require('../../grammar/quiz');
const { allowanceFor } = require('../../grammar/limits');

const MAX_PRACTICE = 5;
const MAX_ANSWERS = 30;

const positiveInt = (v) => (Number.isInteger(Number(v)) && Number(v) > 0 ? Number(v) : null);

const loadSaved = async (db, userId, grammarId) => {
    const saved = await db.collection('saved_grammar').findOne({ userId, grammarId });
    if (!saved) return {};
    const entry = await db.collection('grammar_catalog').findOne({ grammarId });
    return { saved, entry };
};

const loadUser = (db, userId) => db.collection('users').findOne({ userId }, { projection: { userId: 1, tier: 1 } });

/**
 * GET /api/grammar/point/:grammarId/lesson
 * Horangi's lesson, plus two examples built from the learner's own words.
 * Opening a new lesson uses one of the week's lessons on the free plan;
 * opening it again is free.
 */
const getGrammarLesson = async (req, res) => {
    const userId = req.session.user.userId;
    const grammarId = positiveInt(req.params.grammarId);
    if (!grammarId) return res.status(400).json({ success: false, error: 'Invalid grammar point' });

    try {
        const db = getDb();
        const { saved, entry } = await loadSaved(db, userId, grammarId);
        if (!saved || !entry) return res.status(404).json({ success: false, error: 'Grammar point not saved' });

        const log = db.collection('grammar_practice_log');
        const opened = await log.findOne({ userId, grammarId, kind: 'lesson' });
        if (!opened) {
            const allowance = await allowanceFor(db, await loadUser(db, userId));
            if (allowance.lessonsLeftThisWeek === 0) {
                return res.status(403).json({ success: false, reachedLimit: true, allowance, error: 'You have used this week\'s free lessons.' });
            }
        }

        const [lesson] = await Promise.all([
            getLesson(db, entry, saved.uiLanguage || 'en'),
            ensureBank(db, saved, entry),
        ]);
        if (!opened) await log.insertOne({ userId, grammarId, kind: 'lesson', date: new Date() });

        const personal = await db.collection('grammar_quiz_items')
            .find({ userId, grammarId, type: { $in: ['fill_gap', 'build', 'meaning'] } }, { projection: { sentence: 1, translation: 1, words: 1 } })
            .limit(2)
            .toArray();

        res.json({
            success: true,
            point: { grammarId, form: entry.form, name: entry.name, language: entry.language, lessonDone: !!saved.lessonDone },
            lesson,
            yourExamples: personal.map((p) => ({ sentence: p.sentence, translation: p.translation, words: p.words || [] })),
        });
    } catch (error) {
        console.error('Error loading grammar lesson:', error);
        res.status(500).json({ success: false, error: 'Horangi could not write this lesson right now. Try again in a minute.' });
    }
};

/**
 * POST /api/grammar/point/:grammarId/lesson/complete
 */
const completeGrammarLesson = async (req, res) => {
    const userId = req.session.user.userId;
    const grammarId = positiveInt(req.params.grammarId);
    if (!grammarId) return res.status(400).json({ success: false, error: 'Invalid grammar point' });
    try {
        const db = getDb();
        const result = await db.collection('saved_grammar').updateOne(
            { userId, grammarId },
            { $set: { lessonDone: true, lessonDate: new Date() } }
        );
        if (!result.matchedCount) return res.status(404).json({ success: false, error: 'Grammar point not saved' });
        res.json({ success: true });
    } catch (error) {
        console.error('Error completing grammar lesson:', error);
        res.status(500).json({ success: false, error: 'Failed to save your lesson' });
    }
};

/**
 * POST /api/grammar/practice  { grammarId? }
 * Quiz questions from the path: one point's questions, or a mix of the
 * points that need it most. Free accounts get a few questions a day.
 */
const startPractice = async (req, res) => {
    const userId = req.session.user.userId;
    const grammarId = positiveInt(req.body?.grammarId);
    try {
        const db = getDb();
        const allowance = await allowanceFor(db, await loadUser(db, userId));
        const count = allowance.quizLeftToday === null ? MAX_PRACTICE : Math.min(MAX_PRACTICE, allowance.quizLeftToday);
        if (count === 0) {
            return res.json({ success: true, limited: true, allowance, questions: [] });
        }

        let points;
        if (grammarId) {
            const { saved, entry } = await loadSaved(db, userId, grammarId);
            if (!saved) return res.status(404).json({ success: false, error: 'Grammar point not saved' });
            points = [{ saved, entry }];
        } else {
            // Weakest first: fewest right answers relative to tries, then oldest.
            const saved = await db.collection('saved_grammar').find({ userId }).toArray();
            saved.sort((a, b) => ((a.correct || 0) - (a.answered || 0) / 2) - ((b.correct || 0) - (b.answered || 0) / 2)
                || new Date(a.dateSaved) - new Date(b.dateSaved));
            const chosen = saved.slice(0, 3);
            const entries = await db.collection('grammar_catalog').find({ grammarId: { $in: chosen.map((s) => s.grammarId) } }).toArray();
            points = chosen.map((s) => ({ saved: s, entry: entries.find((e) => e.grammarId === s.grammarId) })).filter((p) => p.entry);
        }
        if (!points.length) return res.json({ success: true, questions: [], allowance });

        await Promise.all(points.map((p) => ensureBank(db, p.saved, p.entry)));

        const perPoint = Math.ceil(count / points.length);
        const questions = [];
        for (const { saved, entry } of points) {
            // A random mix of question types from the unused ones.
            const unused = await db.collection('grammar_quiz_items')
                .find({ userId, grammarId: saved.grammarId, usedAt: null })
                .limit(30)
                .toArray();
            const items = shuffle(unused).slice(0, perPoint);
            items.forEach((item) => questions.push({
                grammarId: saved.grammarId,
                form: entry.form,
                name: entry.name,
                language: saved.language,
                item: toClientItem(item),
            }));
        }
        res.json({ success: true, questions: questions.slice(0, count), allowance });
    } catch (error) {
        console.error('Error starting grammar practice:', error);
        res.status(500).json({ success: false, error: 'Horangi could not make your questions right now. Try again in a minute.' });
    }
};

/**
 * POST /api/grammar/answers  { answers: [{ grammarId, itemId, correct }] }
 * Records answers from the path or from Review. Each quiz answer uses one of
 * the day's free questions; the question won't be asked again.
 */
const recordAnswers = async (req, res) => {
    const userId = req.session.user.userId;
    const answers = (Array.isArray(req.body?.answers) ? req.body.answers : []).slice(0, MAX_ANSWERS);
    if (!answers.length) return res.status(400).json({ success: false, error: 'No answers' });

    try {
        const db = getDb();
        const now = new Date();
        const rows = [];
        for (const answer of answers) {
            const grammarId = positiveInt(answer?.grammarId);
            if (!grammarId) continue;
            const correct = !!answer.correct;
            let quiz = false;
            if (typeof answer.itemId === 'string' && ObjectId.isValid(answer.itemId)) {
                const marked = await db.collection('grammar_quiz_items').updateOne(
                    { _id: new ObjectId(answer.itemId), userId, grammarId, usedAt: null },
                    { $set: { usedAt: now, correct } }
                );
                quiz = marked.modifiedCount > 0;
            }
            const updated = await db.collection('saved_grammar').updateOne(
                { userId, grammarId },
                { $inc: { answered: 1, correct: correct ? 1 : 0 }, $set: { lastPracticed: now } }
            );
            if (!updated.matchedCount) continue;
            // Review answers also count in study_progress through the deck, so
            // Home's activity charts only add the ones from the path.
            rows.push({ userId, grammarId, kind: 'question', quiz, correct, context: answer.context === 'review' ? 'review' : 'path', date: now });
        }
        if (rows.length) await db.collection('grammar_practice_log').insertMany(rows);

        // Top the banks back up in the background.
        const ids = [...new Set(rows.map((r) => r.grammarId))];
        if (ids.length) {
            const [saved, entries] = await Promise.all([
                db.collection('saved_grammar').find({ userId, grammarId: { $in: ids } }).toArray(),
                db.collection('grammar_catalog').find({ grammarId: { $in: ids } }).toArray(),
            ]);
            saved.forEach((s) => {
                const entry = entries.find((e) => e.grammarId === s.grammarId);
                if (entry) ensureBank(db, s, entry, { wait: false }).catch(() => {});
            });
        }

        res.json({ success: true, recorded: rows.length });
    } catch (error) {
        console.error('Error recording grammar answers:', error);
        res.status(500).json({ success: false, error: 'Failed to save your answers' });
    }
};

module.exports = { getGrammarLesson, completeGrammarLesson, startPractice, recordAnswers };

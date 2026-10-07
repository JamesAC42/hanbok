const { getDb } = require('../../database');
const SupportedLanguages = require('../../supported_languages');
const { findOrCreateLanguageDeck, nextId } = require('../../lib/languageDeck');
const { resolvePoint } = require('../../grammar/catalog');
const { ensureBank } = require('../../grammar/quiz');
const { getLesson } = require('../../grammar/lesson');
const { limitsFor } = require('../../grammar/limits');

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_EXAMPLES = 4;

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const positiveInt = (v) => (Number.isInteger(Number(v)) && Number(v) > 0 ? Number(v) : null);

const cleanExamples = (examples) => (Array.isArray(examples) ? examples : [])
    .filter((e) => e && typeof e.original === 'string' && e.original.trim() && e.original.length <= 200)
    .slice(0, MAX_EXAMPLES)
    .map((e) => ({
        original: e.original.trim(),
        translation: str(e.translation, 300),
        ...(e.reading ? { reading: str(e.reading, 300) } : {}),
    }));

// Where a save came from: one analyzed sentence, a whole passage (extended
// text), or both (a sentence inside a passage).
const resolveSource = async (db, userId, { sentenceId, textId }) => {
    const source = { dateAdded: new Date() };
    if (sentenceId) {
        const sentence = await db.collection('sentences').findOne(
            { sentenceId },
            { projection: { sentenceId: 1, text: 1, 'analysis.sentence.translation': 1, extendedTextId: 1 } }
        );
        if (!sentence) return { error: 'Sentence not found' };
        source.sentenceId = sentence.sentenceId;
        source.text = sentence.text.slice(0, 300);
        source.translation = sentence.analysis?.sentence?.translation || null;
        if (!textId && sentence.extendedTextId) source.textId = sentence.extendedTextId;
    }
    if (textId) {
        const text = await db.collection('extended_texts').findOne(
            { textId, userId },
            { projection: { textId: 1, title: 1 } }
        );
        if (!text) return { error: 'Passage not found' };
        source.textId = text.textId;
        if (text.title) source.title = text.title;
    }
    return { source };
};

// A grammar card waits in the learner's language deck and first comes up in
// Review tomorrow, as a quiz question or a flip card.
const createGrammarCard = async (db, userId, language, grammarId) => {
    const existing = await db.collection('flashcards').findOne({ userId, contentType: 'grammar', contentId: grammarId });
    if (existing) return existing.flashcardId;

    const deck = await findOrCreateLanguageDeck(db, userId, language);
    const flashcardId = await nextId(db, 'flashcardId');
    const now = new Date();
    await db.collection('flashcards').insertOne({
        flashcardId,
        userId,
        contentType: 'grammar',
        contentId: grammarId,
        dateCreated: now,
        nextReviewDate: new Date(now.getTime() + DAY_MS),
        interval: 1,
        intervalDays: 1,
        easeFactor: 2.5,
        reviewHistory: [],
        repetitionNumber: 0,
        lapses: 0,
        reviewState: 'review',
        createdBy: 'grammar_save',
        suspended: false,
        tags: [language, 'grammar'],
    });
    await db.collection('deck_cards').insertOne({ deckId: deck.deckId, flashcardId, dateAdded: now });
    return flashcardId;
};

/**
 * POST /api/grammar/save
 * Saves a grammar point from a sentence analysis or a passage. Body:
 *   originalLanguage, translationLanguage, pattern (the analysis's name for it),
 *   explanation, level, examples [{ original, translation, reading }],
 *   sentenceId and/or textId (where it was found)
 * Saving the same point again from another sentence adds that sentence as a
 * source and doesn't count as a new save.
 */
const saveGrammar = async (req, res) => {
    const userId = req.session.user.userId;
    const language = str(req.body.originalLanguage, 10);
    const uiLanguage = str(req.body.translationLanguage, 10) || 'en';
    const pattern = str(req.body.pattern, 200);
    const explanation = str(req.body.explanation, 1500);
    const sentenceId = positiveInt(req.body.sentenceId);
    const textId = positiveInt(req.body.textId);

    if (!pattern || !language) {
        return res.status(400).json({ success: false, error: 'A grammar pattern and its language are required' });
    }
    if (!SupportedLanguages[language] || !SupportedLanguages[uiLanguage]) {
        return res.status(400).json({ success: false, error: 'Unsupported language' });
    }

    try {
        const db = getDb();
        const { source, error } = await resolveSource(db, userId, { sentenceId, textId });
        if (error) return res.status(404).json({ success: false, error });

        const examples = cleanExamples(req.body.examples);
        const entry = await resolvePoint(db, {
            language,
            pattern,
            explanation,
            example: source.text || examples[0]?.original,
            level: req.body.level,
        });

        const saved = db.collection('saved_grammar');
        const existing = await saved.findOne({ userId, grammarId: entry.grammarId });
        if (existing) {
            const sameSource = (existing.sources || []).some((s) =>
                (source.sentenceId && s.sentenceId === source.sentenceId)
                || (!source.sentenceId && source.textId && s.textId === source.textId));
            if (!sameSource && (source.sentenceId || source.textId)) {
                await saved.updateOne(
                    { _id: existing._id },
                    { $push: { sources: { $each: [source], $slice: -20 } } }
                );
            }
            return res.json({ success: true, alreadySaved: true, grammarId: entry.grammarId, form: entry.form, name: entry.name });
        }

        const user = await db.collection('users').findOne({ userId }, { projection: { tier: 1 } });
        const limits = limitsFor(user?.tier || 0);
        const count = await saved.countDocuments({ userId });
        if (count >= limits.saves) {
            return res.status(403).json({
                success: false,
                reachedLimit: true,
                limit: limits.saves,
                error: `Free accounts can save ${limits.saves} grammar points. Upgrade to save more.`,
            });
        }

        const doc = {
            userId,
            grammarId: entry.grammarId,
            language,
            uiLanguage,
            pattern,
            explanation,
            level: Math.min(5, Math.max(1, parseInt(req.body.level, 10) || entry.level || 2)),
            examples,
            sources: source.sentenceId || source.textId ? [source] : [],
            lessonDone: false,
            correct: 0,
            answered: 0,
            dateSaved: new Date(),
        };
        try {
            await saved.insertOne(doc);
        } catch (insertError) {
            // Two taps at once: the other request saved it.
            if (insertError.code === 11000) {
                return res.json({ success: true, alreadySaved: true, grammarId: entry.grammarId, form: entry.form, name: entry.name });
            }
            throw insertError;
        }

        const flashcardId = await createGrammarCard(db, userId, language, entry.grammarId);
        await saved.updateOne({ userId, grammarId: entry.grammarId }, { $set: { flashcardId } });
        await db.collection('grammar_catalog').updateOne({ grammarId: entry.grammarId }, { $inc: { saves: 1 } });

        // Get questions and the lesson ready before the learner needs them.
        ensureBank(db, doc, entry, { wait: false }).catch(() => {});
        getLesson(db, entry, uiLanguage).catch((e) => console.error('[grammar] lesson prewarm failed:', e.message));

        res.json({ success: true, grammarId: entry.grammarId, form: entry.form, name: entry.name, savedCount: count + 1 });
    } catch (error) {
        console.error('Error saving grammar point:', error);
        res.status(500).json({ success: false, error: 'Failed to save grammar point' });
    }
};

/**
 * DELETE /api/grammar/:grammarId
 * Removes a saved point with its review card and questions.
 */
const removeGrammar = async (req, res) => {
    const userId = req.session.user.userId;
    const grammarId = positiveInt(req.params.grammarId);
    if (!grammarId) return res.status(400).json({ success: false, error: 'Invalid grammar point' });

    try {
        const db = getDb();
        const result = await db.collection('saved_grammar').deleteOne({ userId, grammarId });
        if (!result.deletedCount) return res.status(404).json({ success: false, error: 'Grammar point not saved' });

        const cards = await db.collection('flashcards')
            .find({ userId, contentType: 'grammar', contentId: grammarId }, { projection: { flashcardId: 1 } })
            .toArray();
        const ids = cards.map((c) => c.flashcardId);
        if (ids.length) {
            await db.collection('deck_cards').deleteMany({ flashcardId: { $in: ids } });
            await db.collection('flashcards').deleteMany({ userId, flashcardId: { $in: ids } });
        }
        await db.collection('grammar_quiz_items').deleteMany({ userId, grammarId });
        await db.collection('grammar_catalog').updateOne({ grammarId, saves: { $gt: 0 } }, { $inc: { saves: -1 } });
        res.json({ success: true });
    } catch (error) {
        console.error('Error removing grammar point:', error);
        res.status(500).json({ success: false, error: 'Failed to remove grammar point' });
    }
};

/**
 * GET /api/grammar/saved-in?sentenceId=..&textId=..
 * The patterns this learner saved from a sentence or passage, so the analysis
 * can show them as saved.
 */
const savedIn = async (req, res) => {
    const userId = req.session.user.userId;
    const sentenceId = positiveInt(req.query.sentenceId);
    const textId = positiveInt(req.query.textId);
    if (!sentenceId && !textId) return res.json({ success: true, saved: [] });

    try {
        const db = getDb();
        const query = { userId, $or: [] };
        if (sentenceId) query.$or.push({ 'sources.sentenceId': sentenceId });
        if (textId) query.$or.push({ 'sources.textId': textId });
        const points = await db.collection('saved_grammar')
            .find(query, { projection: { _id: 0, grammarId: 1, pattern: 1, sources: 1 } })
            .toArray();
        const catalog = await db.collection('grammar_catalog')
            .find({ grammarId: { $in: points.map((p) => p.grammarId) } }, { projection: { _id: 0, grammarId: 1, form: 1, aliases: 1 } })
            .toArray();
        res.json({
            success: true,
            saved: points.map((p) => {
                const entry = catalog.find((c) => c.grammarId === p.grammarId);
                return { grammarId: p.grammarId, pattern: p.pattern, form: entry?.form || null, aliases: entry?.aliases || [] };
            }),
        });
    } catch (error) {
        console.error('Error checking saved grammar:', error);
        res.status(500).json({ success: false, error: 'Failed to check saved grammar' });
    }
};

module.exports = { saveGrammar, removeGrammar, savedIn, createGrammarCard };

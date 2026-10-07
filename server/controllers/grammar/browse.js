const { getDb } = require('../../database');
const { allowanceFor, stageFor } = require('../../grammar/limits');
const { attachPublicIds } = require('../../lib/sentenceKeys');

const positiveInt = (v) => (Number.isInteger(Number(v)) && Number(v) > 0 ? Number(v) : null);

// Saved points joined with their catalog entry and review card.
const loadPoints = async (db, userId, query = {}) => {
    const saved = await db.collection('saved_grammar')
        .find({ userId, ...query })
        .sort({ dateSaved: 1 })
        .toArray();
    if (!saved.length) return [];
    const ids = saved.map((s) => s.grammarId);
    const [catalog, cards] = await Promise.all([
        db.collection('grammar_catalog').find({ grammarId: { $in: ids } }, { projection: { _id: 0, aliases: 0, formKeys: 0 } }).toArray(),
        db.collection('flashcards').find(
            { userId, contentType: 'grammar', contentId: { $in: ids } },
            { projection: { _id: 0, contentId: 1, flashcardId: 1, nextReviewDate: 1, intervalDays: 1, reviewState: 1 } }
        ).toArray(),
    ]);
    const now = new Date();
    return saved.map((s) => {
        const entry = catalog.find((c) => c.grammarId === s.grammarId) || {};
        const card = cards.find((c) => c.contentId === s.grammarId) || null;
        return {
            grammarId: s.grammarId,
            language: s.language,
            form: entry.form || s.pattern,
            name: entry.name || s.pattern,
            level: entry.level || s.level || 2,
            pattern: s.pattern,
            explanation: s.explanation,
            stage: stageFor(s, card),
            lessonDone: !!s.lessonDone,
            correct: s.correct || 0,
            answered: s.answered || 0,
            due: !!card && new Date(card.nextReviewDate) <= now,
            nextReviewDate: card?.nextReviewDate || null,
            sourceCount: (s.sources || []).length,
            dateSaved: s.dateSaved,
            _saved: s,
        };
    });
};

const publicPoint = ({ _saved, ...point }) => point;

/**
 * GET /api/grammar?language=ko
 * The learner's saved grammar for the path, easiest first, with their plan allowance.
 */
const listGrammar = async (req, res) => {
    const userId = req.session.user.userId;
    try {
        const db = getDb();
        const query = typeof req.query.language === 'string' && req.query.language ? { language: req.query.language } : {};
        const [points, user] = await Promise.all([
            loadPoints(db, userId, query),
            db.collection('users').findOne({ userId }, { projection: { userId: 1, tier: 1 } }),
        ]);
        // Path order: level first, then when it was saved.
        points.sort((a, b) => a.level - b.level || new Date(a.dateSaved) - new Date(b.dateSaved));
        const languages = await db.collection('saved_grammar').distinct('language', { userId });
        res.json({
            success: true,
            points: points.map(publicPoint),
            languages,
            allowance: await allowanceFor(db, user),
        });
    } catch (error) {
        console.error('Error listing grammar:', error);
        res.status(500).json({ success: false, error: 'Failed to load your grammar' });
    }
};

/**
 * GET /api/grammar/point/:grammarId
 * One saved point with the sentences it came from.
 */
const getGrammarPoint = async (req, res) => {
    const userId = req.session.user.userId;
    const grammarId = positiveInt(req.params.grammarId);
    if (!grammarId) return res.status(400).json({ success: false, error: 'Invalid grammar point' });
    try {
        const db = getDb();
        const [point] = await loadPoints(db, userId, { grammarId });
        if (!point) return res.status(404).json({ success: false, error: 'Grammar point not saved' });
        const [user, lessonReady] = await Promise.all([
            db.collection('users').findOne({ userId }, { projection: { userId: 1, tier: 1 } }),
            db.collection('grammar_lessons').countDocuments({ grammarId, uiLanguage: point._saved.uiLanguage || 'en' }),
        ]);
        const sources = await attachPublicIds(db, (point._saved.sources || []).slice(-10).reverse().map((src) => ({ ...src })));
        res.json({
            success: true,
            point: {
                ...publicPoint(point),
                examples: point._saved.examples || [],
                sources,
                lessonReady: lessonReady > 0,
            },
            allowance: await allowanceFor(db, user),
        });
    } catch (error) {
        console.error('Error loading grammar point:', error);
        res.status(500).json({ success: false, error: 'Failed to load grammar point' });
    }
};

/**
 * GET /api/grammar/summary
 * Counts for Home and the sidebar: saved, due in Review, not started yet.
 */
const grammarSummary = async (req, res) => {
    const userId = req.session.user.userId;
    try {
        const db = getDb();
        const points = await loadPoints(db, userId);
        res.json({
            success: true,
            total: points.length,
            due: points.filter((p) => p.due).length,
            notStarted: points.filter((p) => p.stage === 0).length,
            mastered: points.filter((p) => p.stage === 4).length,
        });
    } catch (error) {
        console.error('Error loading grammar summary:', error);
        res.status(500).json({ success: false, error: 'Failed to load grammar summary' });
    }
};

module.exports = { listGrammar, getGrammarPoint, grammarSummary, loadPoints };

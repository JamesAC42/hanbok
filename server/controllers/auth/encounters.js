const { getDb } = require('../../database');
const { computeEncounters } = require('../../lib/encounters');

const HISTORY_LIMIT = 1000;

// GET /api/analysis/encounters?sentenceId=123
// Words and grammar in this analysis that the learner has met before.
const getEncounters = async (req, res) => {
    const userId = req.session.user.userId;
    const sentenceId = parseInt(req.query.sentenceId, 10);
    if (!sentenceId || sentenceId < 1) return res.status(400).json({ success: false, error: 'sentenceId is required' });
    try {
        const db = getDb();
        const current = await db.collection('sentences').findOne(
            { sentenceId },
            { projection: { sentenceId: 1, text: 1, originalLanguage: 1, 'analysis.components': 1, 'analysis.grammar_points': 1 } },
        );
        if (!current?.analysis) return res.status(404).json({ success: false, error: 'Sentence not found' });
        const history = await db.collection('sentences')
            .find(
                { userId, hiddenAt: null, originalLanguage: current.originalLanguage },
                { projection: { sentenceId: 1, publicId: 1, text: 1, 'analysis.components.dictionary_form': 1, 'analysis.components.type': 1, 'analysis.grammar_points.pattern': 1 } },
            )
            .sort({ dateCreated: -1 })
            .limit(HISTORY_LIMIT)
            .toArray();
        res.set('Cache-Control', 'private, no-store');
        return res.json({ success: true, ...computeEncounters(current, history, current.originalLanguage) });
    } catch (error) {
        console.error('Encounters failed:', error);
        return res.status(500).json({ success: false, error: 'Failed to load encounters' });
    }
};

module.exports = { getEncounters };

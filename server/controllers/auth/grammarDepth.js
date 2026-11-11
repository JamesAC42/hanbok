const { getDb } = require('../../database');
const { findSentenceByKey } = require('../../lib/sentenceKeys');
const { isDepth, createGrammarDepth } = require('../../lib/grammarDepth');

let depth = null;
const service = () => {
    if (!depth) {
        const generateResponse = require('../../llm/generateResponse');
        depth = createGrammarDepth({
            getDb,
            generate: (prompt) => generateResponse(prompt, 'gemini', { deadlineMs: 20000, attemptMs: 8000 }),
        });
    }
    return depth;
};

// GET /api/analysis/grammar-depth?sentence=<publicId or id>&depth=simple|standard|detailed
// The sentence's grammar explanations rewritten at that depth. Free for anyone
// who can open the sentence; each depth is generated once and kept.
const getGrammarDepth = async (req, res) => {
    const level = String(req.query.depth || '');
    if (!isDepth(level)) return res.status(400).json({ success: false, error: 'depth must be simple, standard or detailed' });
    try {
        const db = getDb();
        const userId = req.session?.user?.userId ?? null;
        const sentence = await findSentenceByKey(db, req.query.sentence, { userId });
        if (!sentence?.analysis) return res.status(404).json({ success: false, error: 'Sentence not found' });
        const explanations = await service().explanationsFor(sentence, level);
        res.set('Cache-Control', 'private, max-age=86400');
        return res.json({ success: true, depth: level, explanations });
    } catch (error) {
        console.error('Grammar depth failed:', error.message);
        return res.status(502).json({ success: false, error: 'Could not rewrite the explanations' });
    }
};

module.exports = { getGrammarDepth };

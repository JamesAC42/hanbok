const { createKrdict } = require('../../lib/krdict');

let krdict = null;
// database is required lazily so the shaping helpers can be tested alone.
const getDb = () => require('../../database').getDb();
const client = () => (krdict ||= createKrdict({ getDb }));

// Free and Basic see the Hanja and one word from each family; Plus sees the
// whole family.
const shapeForTier = (entry, hasPlus) => {
    if (!entry) return null;
    return {
        ...entry,
        familyLocked: !hasPlus,
        families: entry.families.map(f => ({
            ...f,
            count: f.words.length,
            words: hasPlus ? f.words : f.words.slice(0, 1),
        })),
    };
};

// GET /api/dictionary/word?word=학교&type=noun&meaning=school&lang=en
const getDictionaryWord = async (req, res) => {
    const kd = client();
    if (!kd.enabled) return res.json({ success: true, available: false, entry: null });

    const word = String(req.query.word || '').trim().slice(0, 40);
    if (!word || !/[가-힣]/.test(word)) {
        return res.status(400).json({ success: false, message: 'A Korean word is required' });
    }

    try {
        let hasPlus = false;
        const userId = req.session?.user?.userId;
        if (userId) {
            const user = await getDb().collection('users').findOne({ userId }, { projection: { tier: 1 } });
            hasPlus = (user?.tier || 0) >= 2;
        }
        const entry = await kd.lookup(word, {
            type: String(req.query.type || '').slice(0, 40),
            meaning: String(req.query.meaning || '').slice(0, 200),
            lang: String(req.query.lang || 'en').slice(0, 5),
        });
        res.set('Cache-Control', 'private, max-age=3600');
        return res.json({ success: true, available: true, entry: shapeForTier(entry, hasPlus) });
    } catch (error) {
        console.error('krdict lookup failed:', error.message);
        return res.status(502).json({ success: false, message: 'Dictionary lookup failed' });
    }
};

module.exports = { getDictionaryWord, shapeForTier };

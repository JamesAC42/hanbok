const { getDb } = require('../../database');
const { sentenceMatch, describeMatch, ankiFile, normalizeQuery } = require('../../lib/librarySearch');

const ANKI_MAX = 2000;

const loadTier = async (db, userId) => {
    const user = await db.collection('users').findOne({ userId }, { projection: { tier: 1 } });
    return user?.tier || 0;
};

// GET /api/library/search?q=고 싶다&language=ko&page=1&limit=10 (Basic and Plus)
const searchLibrary = async (req, res) => {
    const userId = req.session.user.userId;
    const q = normalizeQuery(req.query.q);
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const language = req.query.language ? String(req.query.language).slice(0, 5) : '';
    try {
        const db = getDb();
        if (await loadTier(db, userId) < 1) {
            return res.status(403).json({ success: false, upgrade: true, error: 'Searching your whole library is part of Basic and Plus.' });
        }
        const match = sentenceMatch(userId, q, language);
        if (!match) return res.json({ success: true, items: [], totalCount: 0, totalPages: 0, page, limit });
        const col = db.collection('sentences');
        const [totalCount, docs] = await Promise.all([
            col.countDocuments(match),
            col.find(match, { projection: { sentenceId: 1, publicId: 1, text: 1, originalLanguage: 1, translationLanguage: 1, dateCreated: 1, analysis: 1 } })
                .sort({ dateCreated: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
        ]);
        const items = docs.map(d => ({
            type: 'sentence',
            sentenceId: d.sentenceId,
            publicId: d.publicId,
            text: d.text,
            translation: d.analysis?.sentence?.translation || '',
            originalLanguage: d.originalLanguage,
            translationLanguage: d.translationLanguage,
            dateCreated: d.dateCreated,
            match: describeMatch(d, q),
        }));
        return res.json({ success: true, items, totalCount, totalPages: Math.ceil(totalCount / limit), page, limit });
    } catch (error) {
        console.error('Library search failed:', error);
        return res.status(500).json({ success: false, error: 'Search failed' });
    }
};

// GET /api/library/anki?q=&language=ko (Plus): every analyzed sentence (or
// the search results) as an Anki import file.
const exportLibraryAnki = async (req, res) => {
    const userId = req.session.user.userId;
    const language = req.query.language ? String(req.query.language).slice(0, 5) : '';
    try {
        const db = getDb();
        if (await loadTier(db, userId) < 2) {
            return res.status(403).json({ success: false, upgrade: true, error: 'Anki export is part of Plus.' });
        }
        const q = normalizeQuery(req.query.q);
        const match = (q && sentenceMatch(userId, q, language)) || {
            userId, hiddenAt: null, ...(language ? { originalLanguage: language } : {}),
        };
        const docs = await db.collection('sentences')
            .find(match, { projection: { text: 1, originalLanguage: 1, analysis: 1 } })
            .sort({ dateCreated: -1 }).limit(ANKI_MAX).toArray();
        const name = ['hanbok', language || 'all', q ? 'search' : 'library'].join('-');
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${name}.txt"`);
        return res.send(ankiFile(docs));
    } catch (error) {
        console.error('Anki export failed:', error);
        return res.status(500).json({ success: false, error: 'Export failed' });
    }
};

module.exports = { searchLibrary, exportLibraryAnki, ANKI_MAX };

const { getDb } = require('../../database');

// Removing something from history never deletes it: the sentence or text keeps its
// data (saved copies, flashcards and grammar sources still point at it) and gets
// hiddenAt, which keeps it out of history and makes its link private to its owner.

const hideOne = (collection, idField) => async (req, res) => {
    const userId = req.session.user?.userId;
    const id = parseInt(req.params.id, 10);
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
    if (!Number.isInteger(id)) return res.status(400).json({ success: false, error: 'Invalid id' });

    try {
        const result = await getDb().collection(collection).updateOne(
            { [idField]: id, userId, hiddenAt: null },
            { $set: { hiddenAt: new Date() } }
        );
        if (result.matchedCount === 0) {
            return res.status(404).json({ success: false, error: 'Not found in your history' });
        }
        return res.json({ success: true });
    } catch (error) {
        console.error(`Error hiding ${collection} item from history:`, error);
        return res.status(500).json({ success: false, error: 'Failed to remove from history' });
    }
};

const hideHistorySentence = hideOne('sentences', 'sentenceId');
const hideHistoryExtendedText = hideOne('extended_texts', 'textId');

const clearHistory = async (req, res) => {
    const userId = req.session.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    try {
        const db = getDb();
        const now = new Date();
        const filter = { userId, hiddenAt: null };
        const [sentences, texts] = await Promise.all([
            db.collection('sentences').updateMany(filter, { $set: { hiddenAt: now } }),
            db.collection('extended_texts').updateMany(filter, { $set: { hiddenAt: now } }),
        ]);
        return res.json({ success: true, hidden: sentences.modifiedCount + texts.modifiedCount });
    } catch (error) {
        console.error('Error clearing history:', error);
        return res.status(500).json({ success: false, error: 'Failed to clear history' });
    }
};

module.exports = { hideHistorySentence, hideHistoryExtendedText, clearHistory };

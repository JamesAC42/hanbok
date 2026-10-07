const { getDb } = require('../../database');
const { resolveSentenceId } = require('../../lib/sentenceKeys');

const unsaveSentence = async (req, res) => {
    const { sentenceId } = req.params;
    const userId = req.session.user.userId;

    try {
        const db = getDb();
        const id = await resolveSentenceId(db, sentenceId);
        
        const result = await db.collection('savedSentences').deleteOne({
            userId,
            sentenceId: id
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Saved sentence not found'
            });
        }

        res.json({ success: true });

    } catch (error) {
        console.error('Error unsaving sentence:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to unsave sentence'
        });
    }
};

module.exports = unsaveSentence; 
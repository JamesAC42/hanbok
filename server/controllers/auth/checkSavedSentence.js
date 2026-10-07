const { getDb } = require('../../database');
const { resolveSentenceId } = require('../../lib/sentenceKeys');

const checkSavedSentence = async (req, res) => {
    const { sentenceId } = req.params;
    const userId = req.session.user.userId;

    try {
        const db = getDb();
        const id = await resolveSentenceId(db, sentenceId);
        
        const savedSentence = await db.collection('savedSentences').findOne({
            userId,
            sentenceId: id
        });

        res.json({
            success: true,
            isSaved: !!savedSentence
        });

    } catch (error) {
        console.error('Error checking saved sentence:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check saved status'
        });
    }
};

module.exports = checkSavedSentence; 
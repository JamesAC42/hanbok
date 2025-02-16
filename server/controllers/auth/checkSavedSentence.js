const { getDb } = require('../../database');

const checkSavedSentence = async (req, res) => {
    const { sentenceId } = req.params;
    const userId = req.session.user.userId;

    try {
        const db = getDb();
        
        const savedSentence = await db.collection('savedSentences').findOne({
            userId,
            sentenceId: parseInt(sentenceId)
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
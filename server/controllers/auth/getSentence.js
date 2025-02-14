const { getDb } = require('../../database');

const getSentence = async (req, res) => {
    const { sentenceId } = req.params;
    const userId = req.session.user.userId;

    try {
        const db = getDb();
        const sentence = await db.collection('sentences').findOne({ 
            sentenceId: parseInt(sentenceId),
            userId: userId
        });

        if (!sentence) {
            return res.status(404).json({ 
                success: false,
                error: 'Sentence not found or unauthorized'
            });
        }

        res.json({
            success: true,
            sentence: sentence
        });

    } catch (error) {
        console.error('Error fetching sentence:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch sentence'
        });
    }
};

module.exports = getSentence;

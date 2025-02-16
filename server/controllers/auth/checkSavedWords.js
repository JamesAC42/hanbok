const { getDb } = require('../../database');

const checkSavedWords = async (req, res) => {
    const { words } = req.body; // Expecting an array of Korean words
    const userId = req.session.user.userId;

    if (!Array.isArray(words)) {
        return res.status(400).json({
            success: false,
            error: 'Words must be provided as an array'
        });
    }

    try {
        const db = getDb();
        
        const savedWords = await db.collection('words')
            .find({
                userId,
                korean: { $in: words }
            })
            .project({ korean: 1, _id: 0 })
            .toArray();

        // Extract just the Korean words that are saved
        const savedKoreanWords = savedWords.map(word => word.korean);

        res.json({
            success: true,
            savedWords: savedKoreanWords
        });

    } catch (error) {
        console.error('Error checking saved words:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check saved words'
        });
    }
};

module.exports = checkSavedWords; 
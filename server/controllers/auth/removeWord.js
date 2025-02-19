const { getDb } = require('../../database');

const removeWord = async (req, res) => {
    const { word } = req.body;
    const userId = req.session.user.userId;
    if (!word?.korean) {
        return res.status(400).json({
            success: false,
            error: 'Korean word is required'
        });
    }

    try {
        const db = getDb();
        
        const result = await db.collection('words').deleteOne({
            userId,
            korean:word.korean
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Word not found'
            });
        }

        res.json({ success: true });

    } catch (error) {
        console.error('Error removing word:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to remove word'
        });
    }
};

module.exports = removeWord;

const { getDb } = require('../../database');
const SupportedLanguages = require('../../supported_languages');

const removeWord = async (req, res) => {
    const { originalWord, originalLanguage } = req.body;
    const userId = req.session.user.userId;

    if (!originalWord || !originalLanguage) {
        return res.status(400).json({
            success: false,
            error: 'Original word and language are required'
        });
    }

    if (!SupportedLanguages[originalLanguage]) {
        return res.status(400).json({
            success: false,
            error: 'Unsupported language'
        });
    }

    try {
        const db = getDb();
        
        const result = await db.collection('words').deleteOne({
            userId,
            originalLanguage,
            originalWord
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

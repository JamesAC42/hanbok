const { getDb } = require('../../database');
const SupportedLanguages = require('../../supported_languages');

const checkSavedWords = async (req, res) => {
    const { words, originalLanguage } = req.body; // Expecting an array of words and their language
    const userId = req.session.user.userId;

    if (!Array.isArray(words) || !originalLanguage) {
        return res.status(400).json({
            success: false,
            error: 'Words must be provided as an array and language must be specified'
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
        
        const savedWords = await db.collection('words')
            .find({
                userId,
                originalLanguage,
                originalWord: { $in: words }
            })
            .project({ originalWord: 1, _id: 0 })
            .toArray();

        // Extract just the original words that are saved
        const savedOriginalWords = savedWords.map(word => word.originalWord);

        res.json({
            success: true,
            savedWords: savedOriginalWords
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
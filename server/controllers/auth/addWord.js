const { getDb } = require('../../database');
const SupportedLanguages = require('../../supported_languages');

const addWord = async (req, res) => {
    const { originalWord, translatedWord, originalLanguage, translationLanguage } = req.body;
    const userId = req.session.user.userId;

    // Validate inputs
    if (!originalWord || !translatedWord || !originalLanguage || !translationLanguage) {
        return res.status(400).json({
            success: false,
            error: 'Original word, translated word, and both languages are required'
        });
    }

    // Validate languages
    if (!SupportedLanguages[originalLanguage] || !SupportedLanguages[translationLanguage]) {
        return res.status(400).json({
            success: false,
            error: 'Unsupported language combination'
        });
    }

    try {
        const db = getDb();

        // Get user info
        const user = await db.collection('users').findOne({ userId });
        
        // Check tier and limits
        if (user.tier === 0) {
            // Count current saved words
            const savedCount = await db.collection('words').countDocuments({ userId });
            
            if (savedCount >= user.maxSavedWords) {
                return res.status(403).json({
                    success: false,
                    reachedLimit: true,
                    error: 'You have reached your maximum saved words limit'
                });
            }
        }
        
        // Get next word ID
        const counterDoc = await db.collection('counters').findOneAndUpdate(
            { _id: 'wordId' },
            { $inc: { seq: 1 } },
            { upsert: true, returnDocument: 'after' }
        );

        // Save the word
        await db.collection('words').insertOne({
            wordId: counterDoc.seq,
            userId,
            originalLanguage,
            originalWord,
            translationLanguage,
            translatedWord,
            dateSaved: new Date()
        });

        res.json({ success: true });

    } catch (error) {
        // Handle duplicate word error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'Word already saved'
            });
        }

        console.error('Error saving word:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save word'
        });
    }
};

module.exports = addWord;

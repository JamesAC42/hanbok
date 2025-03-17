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
        
        // Find the word first to get its ID
        const word = await db.collection('words').findOne({
            userId,
            originalLanguage,
            originalWord
        });
        
        if (!word) {
            return res.status(404).json({
                success: false,
                error: 'Word not found'
            });
        }
        
        // Delete the word
        await db.collection('words').deleteOne({
            userId,
            originalLanguage,
            originalWord
        });
        
        // Find the flashcard associated with this word
        const flashcard = await db.collection('flashcards').findOne({
            userId,
            contentType: 'word',
            contentId: word.wordId
        });
        
        if (flashcard) {
            // Remove the flashcard from any decks
            await db.collection('deck_cards').deleteMany({
                flashcardId: flashcard.flashcardId
            });
            
            // Delete the flashcard
            await db.collection('flashcards').deleteOne({
                flashcardId: flashcard.flashcardId
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

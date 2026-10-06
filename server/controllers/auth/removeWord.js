const { getDb } = require('../../database');
const SupportedLanguages = require('../../supported_languages');

// Removes a saved word and every flashcard made from it (cards saved from an
// analysis and cards added by hand both point at the word by contentId), plus
// those cards' places in decks. Called with { wordId } from the Library, or
// { originalWord, originalLanguage } from the analysis page.
const removeWord = async (req, res) => {
    const { originalWord, originalLanguage } = req.body;
    const wordId = Number.isInteger(Number(req.body.wordId)) && Number(req.body.wordId) > 0
        ? Number(req.body.wordId)
        : null;
    const userId = req.session.user.userId;

    if (!wordId && (!originalWord || !originalLanguage)) {
        return res.status(400).json({
            success: false,
            error: 'A word id, or the original word and language, is required'
        });
    }

    if (!wordId && !SupportedLanguages[originalLanguage]) {
        return res.status(400).json({
            success: false,
            error: 'Unsupported language'
        });
    }

    try {
        const db = getDb();
        const wordQuery = wordId
            ? { userId, wordId }
            : { userId, originalLanguage, originalWord };

        const words = await db.collection('words')
            .find(wordQuery, { projection: { wordId: 1 } })
            .toArray();

        if (words.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Word not found'
            });
        }

        const wordIds = words.map(w => w.wordId);

        // Only word cards: other card types (grammar) share the collection.
        const flashcards = await db.collection('flashcards')
            .find({ userId, contentType: 'word', contentId: { $in: wordIds } }, { projection: { flashcardId: 1 } })
            .toArray();
        const flashcardIds = flashcards.map(f => f.flashcardId);

        if (flashcardIds.length > 0) {
            await db.collection('deck_cards').deleteMany({ flashcardId: { $in: flashcardIds } });
            await db.collection('flashcards').deleteMany({ userId, flashcardId: { $in: flashcardIds } });
        }

        await db.collection('words').deleteMany({ userId, wordId: { $in: wordIds } });

        res.json({ success: true, removedWords: wordIds.length, removedFlashcards: flashcardIds.length });

    } catch (error) {
        console.error('Error removing word:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to remove word'
        });
    }
};

module.exports = removeWord;

const { getDb } = require('../../database');
const SupportedLanguages = require('../../supported_languages');
const { getWordAudio } = require('../../utils/wordAudio');
const { findOrCreateLanguageDeck } = require('../../lib/languageDeck');

const addWord = async (req, res) => {
    const { originalWord, translatedWord, originalLanguage, translationLanguage, reading } = req.body;
    // Sentence the word was saved from, so flashcards can show it as context.
    const sentenceId = Number.isInteger(Number(req.body.sentenceId)) && Number(req.body.sentenceId) > 0
        ? Number(req.body.sentenceId)
        : null;
    const userId = req.session.user.userId;

    // Validate inputs
    if (!originalWord || !translatedWord || !originalLanguage || !translationLanguage) {
        return res.status(400).json({
            success: false,
            error: 'Original word, translated word, and both languages are required'
        });
    }

    if(originalLanguage === 'ja' && !reading) {
        
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
            
            if (!user.maxSavedWords || savedCount >= user.maxSavedWords) {
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

        const wordId = counterDoc.seq;

        // Save the word
        await db.collection('words').insertOne({
            wordId,
            userId,
            originalLanguage,
            originalWord,
            translationLanguage,
            translatedWord,
            ...(sentenceId ? { sentenceId } : {}),
            dateSaved: new Date()
        });

        // Generate audio for the word (non-blocking)
        // We don't await this to avoid delaying the response to the user
        getWordAudio(
            originalWord, 
            originalLanguage, 
            originalLanguage === 'ja' ? translatedWord : null
        )
            .then(audioUrl => {
                console.log(`Generated audio for ${originalWord} (${originalLanguage}): ${audioUrl}`);
            })
            .catch(error => {
                console.error(`Error generating audio for ${originalWord} (${originalLanguage}):`, error);
            });

        // Find or create a deck for this language
        const deck = await findOrCreateLanguageDeck(db, userId, originalLanguage);

        // Create a flashcard for the word
        const flashcardCounterDoc = await db.collection('counters').findOneAndUpdate(
            { _id: 'flashcardId' },
            { $inc: { seq: 1 } },
            { upsert: true, returnDocument: 'after' }
        );
        
        const flashcardId = flashcardCounterDoc.seq;
        
        const flashcard = {
            flashcardId,
            userId,
            contentType: 'word',
            contentId: wordId,
            dateCreated: new Date(),
            nextReviewDate: new Date(), // Due immediately
            interval: 0,
            intervalDays: 0,
            easeFactor: 2.5, // Default ease factor
            reviewHistory: [],
            repetitionNumber: 0,
            lapses: 0,
            reviewState: 'new',
            createdBy: 'word_save',
            suspended: false,
            tags: [originalLanguage]
        };
        
        await db.collection('flashcards').insertOne(flashcard);
        
        // Link the flashcard to the deck
        await db.collection('deck_cards').insertOne({
            deckId: deck.deckId,
            flashcardId,
            dateAdded: new Date()
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

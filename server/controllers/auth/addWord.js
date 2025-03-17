const { getDb } = require('../../database');
const SupportedLanguages = require('../../supported_languages');
const { getWordAudio } = require('../../utils/wordAudio');

const addWord = async (req, res) => {
    const { originalWord, translatedWord, originalLanguage, translationLanguage, reading } = req.body;
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
        let deck = await db.collection('flashcard_decks').findOne({
            userId,
            language: originalLanguage
        });

        if (!deck) {
            // Get language name
            const languageNames = {
                'ko': 'Korean',
                'en': 'English',
                'zh': 'Chinese',
                'ja': 'Japanese',
                'es': 'Spanish',
                'it': 'Italian',
                'fr': 'French',
                'de': 'German',
                'nl': 'Dutch',
                'ru': 'Russian',
                'tr': 'Turkish'
            };
            
            const languageName = languageNames[originalLanguage] || 
                originalLanguage.charAt(0).toUpperCase() + originalLanguage.slice(1);
            
            // Create a new deck
            const deckCounterDoc = await db.collection('counters').findOneAndUpdate(
                { _id: 'deckId' },
                { $inc: { seq: 1 } },
                { upsert: true, returnDocument: 'after' }
            );
            
            const deckId = deckCounterDoc.seq;
            
            deck = {
                deckId,
                userId,
                name: `${languageName} Words`,
                language: originalLanguage,
                description: `Flashcards for ${languageName} words`,
                dateCreated: new Date(),
                lastReviewed: null,
                settings: {
                    newCardsPerDay: 20,
                    reviewsPerDay: 100,
                    learningSteps: [1, 10, 60, 1440] // 1min, 10min, 1hr, 1day
                }
            };
            
            await db.collection('flashcard_decks').insertOne(deck);
        }

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

const { getDb } = require('../../database');

async function addDeckCard(req, res) {
  try {
    const db = getDb();
    const userId = req.session.user.userId;
    const { deckId } = req.params;
    const { front, back } = req.body;

    // Validate inputs
    if (!front || !back) {
      return res.status(400).json({
        success: false,
        error: 'Both front and back content are required'
      });
    }

    // Verify the deck belongs to the user
    const deck = await db.collection('flashcard_decks').findOne({
      deckId: parseInt(deckId),
      userId
    });

    if (!deck) {
      return res.status(404).json({
        success: false,
        error: 'Deck not found'
      });
    }

    // Get user info to check limits
    const user = await db.collection('users').findOne({ userId });
    
    // Check tier and limits for free users
    if (user.tier === 0) {
      const savedCount = await db.collection('words').countDocuments({ userId });
      
      if (!user.maxSavedWords || savedCount >= user.maxSavedWords) {
        return res.status(403).json({
          success: false,
          reachedLimit: true,
          error: 'You have reached your maximum saved words limit'
        });
      }
    }

    // Create a word entry first (since our flashcard system is based on words)
    const wordCounterDoc = await db.collection('counters').findOneAndUpdate(
      { _id: 'wordId' },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' }
    );

    const wordId = wordCounterDoc.seq;

    // Save the word with the custom content
    await db.collection('words').insertOne({
      wordId,
      userId,
      originalLanguage: deck.language,
      originalWord: front.trim().substring(0, 1000),
      translationLanguage: 'en', // Default to English for translation
      translatedWord: back.trim().substring(0, 1000),
      dateSaved: new Date()
    });

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
      createdBy: 'manual_add',
      suspended: false,
      tags: [deck.language],
      customFront: front.trim(),
      customBack: back.trim()
    };
    
    await db.collection('flashcards').insertOne(flashcard);
    
    // Link the flashcard to the deck
    await db.collection('deck_cards').insertOne({
      deckId: parseInt(deckId),
      flashcardId,
      dateAdded: new Date()
    });

    // Return the created card data for frontend update
    const newCard = {
      ...flashcard,
      content: {
        originalWord: front.trim(),
        translatedWord: back.trim(),
        wordId
      }
    };

    res.json({
      success: true,
      card: newCard
    });

  } catch (error) {
    console.error('Error adding deck card:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add card'
    });
  }
}

module.exports = addDeckCard; 
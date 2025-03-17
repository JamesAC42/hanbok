const { getDb } = require('../../database');

async function getDeckCards(req, res) {
  try {
    const db = getDb();
    const userId = req.session.user.userId;
    const deckId = parseInt(req.params.deckId);

    // Verify the deck belongs to the user
    const deck = await db.collection('flashcard_decks').findOne({
      deckId,
      userId
    });

    if (!deck) {
      return res.status(404).json({
        success: false,
        error: 'Deck not found'
      });
    }

    // Get all flashcard IDs in this deck
    const deckCards = await db.collection('deck_cards')
      .find({ deckId })
      .toArray();
    
    const flashcardIds = deckCards.map(card => card.flashcardId);
    
    if (flashcardIds.length === 0) {
      return res.json({
        success: true,
        cards: []
      });
    }

    // Get deck settings for stats calculation only
    const newCardsPerDay = deck.settings?.newCardsPerDay || 20;
    const reviewsPerDay = deck.settings?.reviewsPerDay || 100;

    // Get all flashcards
    const flashcards = await db.collection('flashcards')
      .find({ 
        flashcardId: { $in: flashcardIds },
        userId
      })
      .toArray();

    // Separate cards by state for stats
    const newCards = flashcards.filter(card => card.reviewState === 'new');
    const learningCards = flashcards.filter(card => 
      card.reviewState === 'learning' || card.reviewState === 'relearning'
    );
    const dueCards = flashcards.filter(card => card.reviewState === 'review');

    // Calculate limited cards for stats only
    const limitedNewCards = newCards.slice(0, newCardsPerDay);
    const limitedDueCards = dueCards.slice(0, reviewsPerDay);

    // For each flashcard, get the content (word, sentence, etc.)
    // Use all cards instead of limited cards
    const cardsWithContent = await Promise.all(flashcards.map(async (card) => {
      let content = null;

      if (card.contentType === 'word') {
        content = await db.collection('words').findOne({ wordId: card.contentId });
      } else if (card.contentType === 'sentence') {
        content = await db.collection('sentences').findOne({ sentenceId: card.contentId });
      }

      return {
        ...card,
        content
      };
    }));

    // Add stats to the response
    const stats = {
      total: flashcards.length,
      new: {
        available: newCards.length,
        limited: limitedNewCards.length,
        limit: newCardsPerDay
      },
      learning: learningCards.length,
      due: {
        available: dueCards.length,
        limited: limitedDueCards.length,
        limit: reviewsPerDay
      }
    };

    res.json({
      success: true,
      cards: cardsWithContent,
      stats
    });
  } catch (error) {
    console.error('Error fetching deck cards:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch deck cards'
    });
  }
}

module.exports = getDeckCards; 
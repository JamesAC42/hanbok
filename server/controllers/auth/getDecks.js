const { getDb } = require('../../database');

async function getDecks(req, res) {
  try {
    const db = getDb();
    const userId = req.session.user.userId;

    // Get all decks for the user
    const decks = await db.collection('flashcard_decks')
      .find({ userId })
      .toArray();

    // For each deck, get the card counts
    const decksWithStats = await Promise.all(decks.map(async (deck) => {
      // Get all flashcard IDs in this deck
      const deckCards = await db.collection('deck_cards')
        .find({ deckId: deck.deckId })
        .toArray();
      
      const flashcardIds = deckCards.map(card => card.flashcardId);
      
      // Get stats for cards in this deck
      const stats = {
        new: 0,
        learning: 0,
        due: 0
      };
      
      if (flashcardIds.length > 0) {
        // Count cards by review state
        const cardStats = await db.collection('flashcards')
          .aggregate([
            { 
              $match: { 
                flashcardId: { $in: flashcardIds },
                userId: userId
              } 
            },
            {
              $group: {
                _id: '$reviewState',
                count: { $sum: 1 }
              }
            }
          ])
          .toArray();
        
        // Map the stats
        cardStats.forEach(stat => {
          if (stat._id === 'new') {
            stats.new = stat.count;
          } else if (stat._id === 'learning' || stat._id === 'relearning') {
            stats.learning += stat.count;
          } else if (stat._id === 'review') {
            // Count cards due today
            stats.due = stat.count;
          }
        });
      }
      
      // Apply limits from deck settings
      const newCardsPerDay = deck.settings?.newCardsPerDay || 20;
      const reviewsPerDay = deck.settings?.reviewsPerDay || 100;
      
      // Limit new cards to the setting value
      stats.new = Math.min(stats.new, newCardsPerDay);
      
      // Limit due cards to the setting value
      stats.due = Math.min(stats.due, reviewsPerDay);
      
      return {
        ...deck,
        cardCount: flashcardIds.length,
        stats
      };
    }));

    res.json({
      success: true,
      decks: decksWithStats
    });
  } catch (error) {
    console.error('Error fetching decks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch decks'
    });
  }
}

module.exports = getDecks; 
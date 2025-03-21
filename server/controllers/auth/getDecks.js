const { getDb } = require('../../database');

async function getDecks(req, res) {
  try {
    const db = getDb();
    const userId = req.session.user.userId;

    // Get all decks for the user
    const decks = await db.collection('flashcard_decks')
      .find({ userId })
      .toArray();

    // Current date for calculations
    const now = new Date();
    
    // Get today's date (truncated to day) for checking study progress
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
        // Get all the cards for more detailed calculations
        const allCards = await db.collection('flashcards')
          .find({ 
            flashcardId: { $in: flashcardIds },
            userId: userId
          })
          .toArray();
        
        // Count cards by state
        const newCards = allCards.filter(card => card.reviewState === 'new');
        
        // Make sure to include all cards in learning state, regardless of their nextReviewDate
        const learningCards = allCards.filter(card => 
          card.reviewState === 'learning' || card.reviewState === 'relearning'
        );
        
        // Only count cards as "due" if they are in review state AND due
        const dueCards = allCards.filter(card => 
          card.reviewState === 'review' && new Date(card.nextReviewDate) <= now
        );
        
        // Check how many new cards were already studied today for this deck from study_progress
        const todayProgress = await db.collection('study_progress').findOne({
          userId,
          deckId: deck.deckId,
          date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
        });
        
        // Number of new cards already studied today
        const newCardsAlreadyStudiedToday = todayProgress ? todayProgress.newCardsStudied : 0;
        
        // Get deck settings
        const newCardsPerDay = deck.settings?.newCardsPerDay || 20;
        const reviewsPerDay = deck.settings?.reviewsPerDay || 100;
        
        // Calculate how many new cards we can still introduce today
        const remainingNewCardsToday = Math.max(0, newCardsPerDay - newCardsAlreadyStudiedToday);
        
        // Set the stats with corrected values
        stats.new = Math.min(newCards.length, remainingNewCardsToday);
        stats.learning = learningCards.length;
        stats.due = Math.min(dueCards.length, reviewsPerDay);
        
        // Add detailed stats information that can be shown on hover
        stats.detailedStats = {
          new: {
            available: newCards.length,
            limit: newCardsPerDay,
            studied: newCardsAlreadyStudiedToday,
            remaining: remainingNewCardsToday
          },
          due: {
            available: dueCards.length,
            limited: stats.due,
            limit: reviewsPerDay
          }
        };
      }
      
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

// Helper function to check if two dates are on the same day
function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

module.exports = getDecks; 
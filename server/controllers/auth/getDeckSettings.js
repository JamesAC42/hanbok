const { getDb } = require('../../database');

async function getDeckSettings(req, res) {
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

    // Return the settings
    res.json({
      success: true,
      settings: deck.settings || {
        // Default settings if none exist
        newCardsPerDay: 20,
        reviewsPerDay: 100,
        learningSteps: [1, 10, 60, 1440] // 1min, 10min, 1hr, 1day
      }
    });
  } catch (error) {
    console.error('Error fetching deck settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch deck settings'
    });
  }
}

module.exports = getDeckSettings; 
const { getDb } = require('../../database');

async function updateDeckSettings(req, res) {
  try {
    const db = getDb();
    const userId = req.session.user.userId;
    const deckId = parseInt(req.params.deckId);
    const { newCardsPerDay, reviewsPerDay, learningSteps } = req.body;

    // Validate inputs
    if (newCardsPerDay !== undefined && (typeof newCardsPerDay !== 'number' || newCardsPerDay < 0 || newCardsPerDay > 9999)) {
      return res.status(400).json({
        success: false,
        error: 'newCardsPerDay must be a number between 0 and 9999'
      });
    }

    if (reviewsPerDay !== undefined && (typeof reviewsPerDay !== 'number' || reviewsPerDay < 0 || reviewsPerDay > 9999)) {
      return res.status(400).json({
        success: false,
        error: 'reviewsPerDay must be a number between 0 and 9999'
      });
    }

    if (learningSteps !== undefined && (!Array.isArray(learningSteps) || !learningSteps.every(step => typeof step === 'number' && step > 0))) {
      return res.status(400).json({
        success: false,
        error: 'learningSteps must be an array of positive numbers'
      });
    }

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

    // Prepare update object
    const updateObj = { $set: {} };
    
    if (newCardsPerDay !== undefined) {
      updateObj.$set['settings.newCardsPerDay'] = newCardsPerDay;
    }
    
    if (reviewsPerDay !== undefined) {
      updateObj.$set['settings.reviewsPerDay'] = reviewsPerDay;
    }
    
    if (learningSteps !== undefined) {
      updateObj.$set['settings.learningSteps'] = learningSteps;
    }

    // If no settings were provided, return success without updating
    if (Object.keys(updateObj.$set).length === 0) {
      return res.json({
        success: true,
        message: 'No settings were updated'
      });
    }

    // Update the deck settings
    await db.collection('flashcard_decks').updateOne(
      { deckId, userId },
      updateObj
    );

    // Get the updated deck
    const updatedDeck = await db.collection('flashcard_decks').findOne({
      deckId,
      userId
    });

    res.json({
      success: true,
      settings: updatedDeck.settings
    });
  } catch (error) {
    console.error('Error updating deck settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update deck settings'
    });
  }
}

module.exports = updateDeckSettings; 
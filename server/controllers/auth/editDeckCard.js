const { getDb } = require('../../database');

async function editDeckCard(req, res) {
  try {
    const db = getDb();
    const userId = req.session.user.userId;
    const { deckId, cardId } = req.params;
    const { action, customFront, customBack } = req.body;

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

    // Verify the card exists and belongs to the user
    const card = await db.collection('flashcards').findOne({
      flashcardId: parseInt(cardId),
      userId
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        error: 'Card not found'
      });
    }

    // Verify the card is in this deck
    const deckCard = await db.collection('deck_cards').findOne({
      deckId: parseInt(deckId),
      flashcardId: parseInt(cardId)
    });

    if (!deckCard) {
      return res.status(404).json({
        success: false,
        error: 'Card not found in this deck'
      });
    }

    if (action === 'update') {
      // Update the card with custom front and back content
      const updateData = {};
      if (customFront !== undefined) {
        const trimmed = customFront.trim();
        updateData.customFront = trimmed.length > 1000 ? trimmed.slice(0, 1000) : trimmed || null;
      }
      
      if (customBack !== undefined) {
        const trimmed = customBack.trim();
        updateData.customBack = trimmed.length > 1000 ? trimmed.slice(0, 1000) : trimmed || null;
      }

      await db.collection('flashcards').updateOne(
        { flashcardId: parseInt(cardId) },
        { $set: updateData }
      );

      res.json({
        success: true,
        message: 'Card updated successfully'
      });

    } else if (action === 'delete') {
      // Remove the card from the deck
      await db.collection('deck_cards').deleteOne({
        deckId: parseInt(deckId),
        flashcardId: parseInt(cardId)
      });

      // Check if this card is in any other decks
      const otherDeckCards = await db.collection('deck_cards').findOne({
        flashcardId: parseInt(cardId)
      });

      // If the card is not in any other decks, delete it entirely
      if (!otherDeckCards) {
        await db.collection('flashcards').deleteOne({
          flashcardId: parseInt(cardId)
        });
      }

      res.json({
        success: true,
        message: 'Card deleted successfully'
      });

    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Must be "update" or "delete"'
      });
    }

  } catch (error) {
    console.error('Error editing deck card:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to edit card'
    });
  }
}

module.exports = editDeckCard; 
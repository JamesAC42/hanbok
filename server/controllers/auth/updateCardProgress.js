const { getDb } = require('../../database');

/**
 * Update the user's study progress for the current day
 * @param {Object} db - Database connection
 * @param {number} userId - User ID
 * @param {number} deckId - Deck ID
 * @param {Object} card - Card being studied
 * @returns {Promise} Promise resolving to the updated progress
 */
async function updateStudyProgress(db, userId, deckId, card) {
  try {
    // Get today's date (truncated to day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find existing progress for today
    const existingProgress = await db.collection('study_progress').findOne({
      userId,
      deckId,
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    });
    
    let newCardsIncrement = 0;
    let reviewsIncrement = 1; // Always increment reviews by 1
    
    // Check if this is a card that was just moved from "new" state
    if (card.reviewState !== 'new' && (!existingProgress || !existingProgress.studiedCardIds || !existingProgress.studiedCardIds.includes(card.flashcardId))) {
      // If the card is no longer new and hasn't been counted yet, it counts as a new card studied
      newCardsIncrement = 1;
      reviewsIncrement = 0;
    }
    
    if (existingProgress) {
      // Update existing progress
      const result = await db.collection('study_progress').updateOne(
        { _id: existingProgress._id },
        { 
          $inc: { 
            newCardsStudied: newCardsIncrement,
            reviewsCompleted: reviewsIncrement
          },
          $set: { lastUpdated: new Date() },
          $addToSet: { studiedCardIds: card.flashcardId }
        }
      );
      return result;
    } else {
      // Create new progress entry
      const result = await db.collection('study_progress').insertOne({
        userId,
        deckId,
        date: today,
        newCardsStudied: newCardsIncrement,
        reviewsCompleted: reviewsIncrement,
        lastUpdated: new Date(),
        studiedCardIds: [card.flashcardId]
      });
      return result;
    }
  } catch (error) {
    console.error('Error updating study progress:', error);
    // Don't throw the error, just log it so it doesn't break card updates
    return null;
  }
}

/**
 * Update the user's study streak for this deck
 * @param {Object} db - Database connection
 * @param {number} userId - User ID
 * @param {number} deckId - Deck ID
 * @returns {Promise} Promise resolving to the updated streak
 */
async function updateStudyStreak(db, userId, deckId) {
  try {
    // Get today's date (truncated to day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get yesterday's date
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Find existing streak for this user and deck
    const existingStreak = await db.collection('study_streaks').findOne({
      userId,
      deckId
    });
    
    if (existingStreak) {
      // Check if they already studied today
      const lastStudyDate = new Date(existingStreak.lastStudyDate);
      lastStudyDate.setHours(0, 0, 0, 0);
      
      if (lastStudyDate.getTime() === today.getTime()) {
        // Already studied today, no streak update needed
        return existingStreak;
      }
      
      // Check if they studied yesterday (continuing streak)
      // or if they missed days (streak broken)
      if (lastStudyDate.getTime() === yesterday.getTime()) {
        // Streak continues - increment streak
        const newStreak = existingStreak.currentStreak + 1;
        let maxStreak = existingStreak.maxStreak;
        let maxStreakStartDate = existingStreak.maxStreakStartDate;
        let maxStreakEndDate = existingStreak.maxStreakEndDate;
        
        // Check if we have a new max streak
        if (newStreak > maxStreak) {
          maxStreak = newStreak;
          // If this is a new max streak, the start date is the current streak start date
          maxStreakStartDate = existingStreak.currentStreakStartDate;
          // End date is not set yet because streak is ongoing
          maxStreakEndDate = null;
        }
        
        // Update streak with incremented value
        const result = await db.collection('study_streaks').updateOne(
          { _id: existingStreak._id },
          { 
            $set: { 
              currentStreak: newStreak,
              maxStreak: maxStreak,
              lastStudyDate: today,
              maxStreakStartDate: maxStreakStartDate,
              maxStreakEndDate: maxStreakEndDate
            },
            $addToSet: { studyDates: today }
          }
        );
        return result;
      } else {
        // Streak broken - was not continued from yesterday
        
        // If previous streak was a max streak, set its end date
        let updateObj = {
          currentStreak: 1,
          currentStreakStartDate: today,
          lastStudyDate: today,
        };
        
        // If the previous streak was a max streak and doesn't have an end date yet,
        // set the end date to the last study date
        if (existingStreak.currentStreak === existingStreak.maxStreak && !existingStreak.maxStreakEndDate) {
          updateObj.maxStreakEndDate = existingStreak.lastStudyDate;
        }
        
        // Update streak with reset value
        const result = await db.collection('study_streaks').updateOne(
          { _id: existingStreak._id },
          { 
            $set: updateObj,
            $addToSet: { studyDates: today }
          }
        );
        return result;
      }
    } else {
      // First time studying - create new streak with count of 1
      const result = await db.collection('study_streaks').insertOne({
        userId,
        deckId,
        currentStreak: 1,
        maxStreak: 1,
        currentStreakStartDate: today,
        maxStreakStartDate: today,
        maxStreakEndDate: null,
        lastStudyDate: today,
        studyDates: [today]
      });
      return result;
    }
  } catch (error) {
    console.error('Error updating study streak:', error);
    // Don't throw the error, just log it so it doesn't break card updates
    return null;
  }
}

/**
 * Simple controller to update a flashcard's state in the database
 * 
 * This controller receives the complete card state from the client
 * and simply updates it in the database. All spaced repetition logic
 * is handled client-side.
 */
async function updateCardProgress(req, res) {
  try {
    const db = getDb();
    const userId = req.session.user.userId;
    const deckId = parseInt(req.params.deckId);
    const { flashcardId, updatedCardState } = req.body;

    // Validate required parameters
    if (!flashcardId || !updatedCardState) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: flashcardId and updatedCardState are required'
      });
    }

    // Add detailed logging for debugging the card update
    console.log(`[updateCardProgress] Received update for card ${flashcardId}:`, {
      reviewState: updatedCardState.reviewState,
      intervalDays: updatedCardState.intervalDays,
      nextReviewDate: updatedCardState.nextReviewDate
    });

    // Check if card exists and belongs to the user
    const card = await db.collection('flashcards').findOne({
      flashcardId,
      userId
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        error: 'Card not found'
      });
    }

    console.log(`[updateCardProgress] Current card in database:`, {
      flashcardId: card.flashcardId,
      reviewState: card.reviewState,
      intervalDays: card.intervalDays,
      nextReviewDate: card.nextReviewDate
    });

    // Check if the card is actually in the specified deck
    const deckCard = await db.collection('deck_cards').findOne({
      deckId,
      flashcardId
    });

    if (!deckCard) {
      return res.status(404).json({
        success: false,
        error: 'Card not found in this deck'
      });
    }

    // Update the card in the database with the state from the client
    // We'll add timestamps server-side to ensure data integrity
    const now = new Date();
    
    // Remove MongoDB specific fields that shouldn't be updated
    const { _id, ...cardStateWithoutId } = updatedCardState;
    
    // Convert string date fields to proper Date objects for MongoDB
    const cardUpdate = {
      ...cardStateWithoutId,
      lastReviewed: now,
      lastModified: now
    };
    
    // Convert nextReviewDate to a Date object if it's a string
    if (cardUpdate.nextReviewDate && typeof cardUpdate.nextReviewDate === 'string') {
      cardUpdate.nextReviewDate = new Date(cardUpdate.nextReviewDate);
    }
    
    // Convert dateCreated to a Date object if it exists and is a string
    if (cardUpdate.dateCreated && typeof cardUpdate.dateCreated === 'string') {
      cardUpdate.dateCreated = new Date(cardUpdate.dateCreated);
    }
    
    // Convert any date fields in reviewHistory array if they exist
    if (cardUpdate.reviewHistory && Array.isArray(cardUpdate.reviewHistory)) {
      cardUpdate.reviewHistory = cardUpdate.reviewHistory.map(entry => {
        if (entry.date && typeof entry.date === 'string') {
          return { ...entry, date: new Date(entry.date) };
        }
        return entry;
      });
    }
    
    // Log the update for debugging
    console.log(`[updateCardProgress] Processed card state before database update:`, {
      flashcardId: cardUpdate.flashcardId,
      reviewState: cardUpdate.reviewState,
      intervalDays: cardUpdate.intervalDays,
      nextReviewDate: cardUpdate.nextReviewDate
    });

    // Check for potential issues with intervalDays
    if (cardUpdate.nextReviewDate && (!cardUpdate.intervalDays || cardUpdate.intervalDays === 0)) {
      console.warn(`[updateCardProgress] POTENTIAL ISSUE: intervalDays is ${cardUpdate.intervalDays} but nextReviewDate is set to ${cardUpdate.nextReviewDate}`);
    }
    
    // Update the card in the database
    const updateResult = await db.collection('flashcards').updateOne(
      { flashcardId, userId },
      { $set: cardUpdate }
    );

    console.log(`[updateCardProgress] Database update result:`, {
      acknowledged: updateResult.acknowledged,
      modifiedCount: updateResult.modifiedCount,
      matchedCount: updateResult.matchedCount
    });

    // Verify the update with a database query
    const updatedCardInDb = await db.collection('flashcards').findOne({
      flashcardId,
      userId
    });

    console.log(`[updateCardProgress] Card in database after update:`, {
      flashcardId: updatedCardInDb.flashcardId,
      reviewState: updatedCardInDb.reviewState,
      intervalDays: updatedCardInDb.intervalDays,
      nextReviewDate: updatedCardInDb.nextReviewDate
    });

    // Check if this is a transition from "new" to "learning" state
    // and update study progress & streak
    const wasCardNew = card.reviewState === 'new';
    const isCardNowLearning = cardUpdate.reviewState === 'learning' || cardUpdate.reviewState === 'review';
    
    // Update study progress & streak in parallel
    await Promise.all([
      updateStudyProgress(db, userId, deckId, {...card, ...cardUpdate}),
      updateStudyStreak(db, userId, deckId)
    ]);

    // Return success response
    return res.json({
      success: true,
      message: 'Card progress updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating card progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update card progress'
    });
  }
}

module.exports = updateCardProgress;
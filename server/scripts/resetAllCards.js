/**
 * Reset All Cards Script
 * 
 * This script resets all flashcards in the database to their initial state:
 * - Review state: "new"
 * - Interval: 0 days
 * - Next review date: Yesterday (to make them immediately due)
 * - Ease factor: 2.5 (default)
 * 
 * It also resets study_progress and study_streaks collections.
 * 
 * Usage: node resetAllCards.js [userId] [deckId]
 * - userId: Optional. If provided, only reset cards for this user
 * - deckId: Optional. If provided, only reset cards in this deck
 */

require('dotenv').config({ path: '../.env' });
const { MongoClient } = require('mongodb');
const { connectToDatabase, getDb } = require('../database');

async function resetAllCards() {
  try {
    console.log('Connecting to database...');
    await connectToDatabase();
    const db = getDb();
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const userId = args[0] ? parseInt(args[0]) : null;
    const deckId = args[1] ? parseInt(args[1]) : null;
    
    // Build query based on provided arguments
    const cardQuery = {};
    const progressQuery = {};
    const streakQuery = {};
    
    if (userId) {
      cardQuery.userId = userId;
      progressQuery.userId = userId;
      streakQuery.userId = userId;
      console.log(`Filtering to user ID: ${userId}`);
    }
    
    // If deckId is provided, we need to get flashcardIds from deck_cards
    let flashcardIds = null;
    if (deckId) {
      console.log(`Filtering to deck ID: ${deckId}`);
      progressQuery.deckId = deckId;
      streakQuery.deckId = deckId;
      
      const deckCards = await db.collection('deck_cards').find({ deckId }).toArray();
      if (deckCards.length === 0) {
        console.log(`No cards found in deck with ID ${deckId}`);
        process.exit(0);
      }
      flashcardIds = deckCards.map(card => card.flashcardId);
      cardQuery.flashcardId = { $in: flashcardIds };
    }
    
    // ===== RESET FLASHCARDS =====
    
    // Find cards to reset
    const cards = await db.collection('flashcards').find(cardQuery).toArray();
    console.log(`Found ${cards.length} cards to reset`);
    
    if (cards.length === 0) {
      console.log('No cards found matching criteria.');
    } else {
      // Calculate yesterday's date for next review date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Reset all matching cards
      const cardResult = await db.collection('flashcards').updateMany(
        cardQuery,
        {
          $set: {
            reviewState: 'new',
            intervalDays: 0,
            easeFactor: 2.5,
            nextReviewDate: yesterday,
            stepIndex: null,
            repetitionNumber: 0,
            lapses: 0,
            lastModified: new Date()
          }
        }
      );
      
      console.log(`Successfully reset ${cardResult.modifiedCount} cards to new state.`);
      console.log('The following attributes were reset:');
      console.log('- Review state: "new"');
      console.log('- Interval days: 0');
      console.log('- Ease factor: 2.5');
      console.log(`- Next review date: ${yesterday.toISOString()}`);
      console.log('- Step index: null');
      console.log('- Repetition number: 0');
      console.log('- Lapses: 0');
      
      console.log('\nCards are now ready to be studied as if they were new.');
      console.log('Note: Review history has been preserved for reference.');
    }
    
    // ===== RESET STUDY PROGRESS =====
    
    // Delete all matching study progress records
    const progressResult = await db.collection('study_progress').deleteMany(progressQuery);
    console.log(`\nDeleted ${progressResult.deletedCount} study progress records.`);
    
    // ===== RESET STUDY STREAKS =====
    
    // Reset all matching streak records
    // Use epoch date for dates that can be null in the schema
    const epoch = new Date(0); // Unix epoch for the oldest possible date
    const today = new Date();
    
    // Check if we need to create new records or update existing ones
    const existingStreaks = await db.collection('study_streaks').find(streakQuery).toArray();
    
    if (existingStreaks.length > 0) {
      // Update existing records
      const streakResult = await db.collection('study_streaks').updateMany(
        streakQuery,
        {
          $set: {
            currentStreak: 0,
            maxStreak: 0,
            currentStreakStartDate: today, // Required field, can't be null
            maxStreakStartDate: epoch, // Can be null in schema but we'll use epoch
            maxStreakEndDate: epoch, // Can be null in schema but we'll use epoch
            lastStudyDate: epoch, // Required field, can't be null
            studyDates: [] // Clear study dates array
          }
        }
      );
      
      console.log(`Reset ${streakResult.modifiedCount} streak records.`);
      console.log('The following attributes were reset:');
      console.log('- Current streak: 0');
      console.log('- Max streak: 0');
      console.log('- Current streak start date: today');
      console.log('- Max streak start/end dates: Unix epoch');
      console.log('- Last study date: Unix epoch');
      console.log('- Study dates: []');
    } else if (userId && deckId) {
      // Create a new record if we have both userId and deckId
      // Only create if we have both specific values to avoid creating too many records
      await db.collection('study_streaks').insertOne({
        userId,
        deckId,
        currentStreak: 0,
        maxStreak: 0,
        currentStreakStartDate: today,
        maxStreakStartDate: epoch,
        maxStreakEndDate: epoch,
        lastStudyDate: epoch,
        studyDates: []
      });
      
      console.log('Created new streak record with reset values.');
    } else {
      console.log('No existing streak records found to reset.');
      console.log('Specific userId and deckId required to create new streak records.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error resetting cards:', error);
    process.exit(1);
  }
}

// Run the script
resetAllCards(); 
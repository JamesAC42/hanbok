/**
 * Generate Study Test Data Script
 * 
 * This script populates the study_progress and study_streaks collections
 * with test data for an existing user and deck.
 * 
 * Usage: node generateStudyTestData.js <userId> <deckId> [daysOfHistory]
 * - userId: Required. The user ID to generate data for.
 * - deckId: Required. The deck ID to generate data for.
 * - daysOfHistory: Optional. Number of days of history to generate (default: 30)
 */

require('dotenv').config({ path: '../.env' });
const { connectToDatabase, getDb } = require('../database');

// Constants for generating realistic data
const MAX_NEW_CARDS_PER_DAY = 20;
const MAX_REVIEWS_PER_DAY = 100;
const MAX_TIME_SPENT_MINUTES = 30;
const STUDY_PROBABILITY = 0.75; // 75% chance of studying on any given day
const STREAK_BREAK_PROBABILITY = 0.15; // 15% chance of breaking a streak

async function generateTestData() {
  try {
    console.log('Connecting to database...');
    await connectToDatabase();
    const db = getDb();
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    if (args.length < 2) {
      console.error('Usage: node generateStudyTestData.js <userId> <deckId> [daysOfHistory]');
      process.exit(1);
    }
    
    const userId = parseInt(args[0]);
    const deckId = parseInt(args[1]);
    const daysOfHistory = args[2] ? parseInt(args[2]) : 30;
    
    // Verify user and deck exist
    const user = await db.collection('users').findOne({ userId });
    if (!user) {
      console.error(`User with ID ${userId} not found.`);
      process.exit(1);
    }
    
    const deck = await db.collection('flashcard_decks').findOne({ deckId });
    if (!deck) {
      console.error(`Deck with ID ${deckId} not found.`);
      process.exit(1);
    }
    
    console.log(`Generating ${daysOfHistory} days of study data for user ${userId} (${user.name}) and deck ${deckId} (${deck.name}).`);
    
    // Clear existing data for this user and deck
    await db.collection('study_progress').deleteMany({ userId, deckId });
    await db.collection('study_streaks').deleteMany({ userId, deckId });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Initialize variables for tracking streak data
    let currentStreak = 0;
    let maxStreak = 0;
    let maxStreakStartDate = null;
    let maxStreakEndDate = null;
    let currentStreakStartDate = null;
    let lastStudyDate = null;
    const studyDates = [];
    
    // Generate daily progress entries
    for (let i = 0; i < daysOfHistory; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (daysOfHistory - i - 1));
      
      // Decide if user studied on this day (with higher probability for recent days)
      const recencyBoost = i / daysOfHistory; // 0 to 1 factor increasing for more recent days
      const didStudy = Math.random() < (STUDY_PROBABILITY + (recencyBoost * 0.25));
      
      // Add a chance to break a streak for more realistic data
      const breakStreak = Math.random() < STREAK_BREAK_PROBABILITY;
      const effectiveDidStudy = didStudy && !breakStreak;
      
      if (effectiveDidStudy) {
        // Generate random study statistics for the day
        const newCardsStudied = Math.floor(Math.random() * MAX_NEW_CARDS_PER_DAY) + 1;
        const reviewsCompleted = Math.floor(Math.random() * MAX_REVIEWS_PER_DAY) + newCardsStudied;
        const timeSpentSeconds = Math.floor(Math.random() * (MAX_TIME_SPENT_MINUTES * 60)) + 60;
        
        // Create study progress entry
        await db.collection('study_progress').insertOne({
          userId,
          deckId,
          date: new Date(date),
          newCardsStudied,
          reviewsCompleted,
          timeSpent: timeSpentSeconds,
          lastUpdated: new Date()
        });
        
        // Update streak information
        if (lastStudyDate === null || 
            (date.getTime() - lastStudyDate.getTime()) <= (24 * 60 * 60 * 1000)) {
          // If first day or consecutive day, increment or start streak
          if (currentStreak === 0) {
            currentStreakStartDate = new Date(date);
          }
          currentStreak++;
        } else {
          // Streak broken, start a new one
          if (currentStreak > maxStreak) {
            maxStreak = currentStreak;
            maxStreakStartDate = new Date(currentStreakStartDate);
            maxStreakEndDate = new Date(lastStudyDate);
          }
          currentStreak = 1;
          currentStreakStartDate = new Date(date);
        }
        
        lastStudyDate = new Date(date);
        studyDates.push(new Date(date));
      }
    }
    
    // Final check if current streak is the max streak
    if (currentStreak > maxStreak) {
      maxStreak = currentStreak;
      maxStreakStartDate = new Date(currentStreakStartDate);
      maxStreakEndDate = new Date(lastStudyDate);
    }
    
    // Create or update the streak record
    const streakRecord = {
      userId,
      deckId,
      currentStreak,
      maxStreak,
      currentStreakStartDate: currentStreakStartDate || today,
      maxStreakStartDate,
      maxStreakEndDate,
      lastStudyDate: lastStudyDate || new Date(0),
      studyDates
    };
    
    await db.collection('study_streaks').insertOne(streakRecord);
    
    // Print summary
    console.log('\nTest data generation complete!');
    console.log(`Generated ${studyDates.length} days of study activity.`);
    console.log(`Current streak: ${currentStreak} days`);
    console.log(`Max streak: ${maxStreak} days`);
    
    if (studyDates.length > 0) {
      console.log(`First study date: ${studyDates[0].toDateString()}`);
      console.log(`Last study date: ${studyDates[studyDates.length - 1].toDateString()}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error generating test data:', error);
    process.exit(1);
  }
}

// Run the script
generateTestData(); 
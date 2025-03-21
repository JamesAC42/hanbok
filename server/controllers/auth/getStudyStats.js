const { getDb } = require('../../database');

/**
 * Get study statistics for a user including progress and streaks
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getStudyStats(req, res) {
  try {
    const db = getDb();
    const userId = req.session.user.userId;
    
    // Optional query parameters
    const deckId = req.query.deckId ? parseInt(req.query.deckId) : null;
    const daysBack = req.query.days ? parseInt(req.query.days) : 30; // Default to 30 days
    
    // Get date range
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    startDate.setHours(0, 0, 0, 0);
    
    // Build the query
    const query = { userId };
    if (deckId) {
      query.deckId = deckId;
    }
    
    // Get streak information
    let streakQuery = { userId };
    if (deckId) {
      streakQuery.deckId = deckId;
    }
    
    const streaks = await db.collection('study_streaks')
      .find(streakQuery)
      .toArray();
    
    // Get study progress
    const progressQuery = {
      ...query,
      date: { $gte: startDate, $lte: endDate }
    };
    
    const progressData = await db.collection('study_progress')
      .find(progressQuery)
      .sort({ date: 1 })
      .toArray();
    
    // Get today's progress
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayQuery = {
      ...query,
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    };
    
    const todayProgress = await db.collection('study_progress')
      .find(todayQuery)
      .toArray();
    
    // Process the data
    const dailyStats = [];
    
    // Create a date range map to ensure all days are represented
    const dateMap = {};
    for (let i = 0; i <= daysBack; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      dateMap[dateString] = {
        date: dateString,
        newCardsStudied: 0,
        reviewsCompleted: 0,
        hasActivity: false
      };
    }
    
    // Fill in actual data
    progressData.forEach(progress => {
      const dateString = new Date(progress.date).toISOString().split('T')[0];
      if (dateMap[dateString]) {
        dateMap[dateString].newCardsStudied += progress.newCardsStudied || 0;
        dateMap[dateString].reviewsCompleted += progress.reviewsCompleted || 0;
        dateMap[dateString].hasActivity = true;
      }
    });
    
    // Convert map to array
    Object.values(dateMap).forEach(stat => {
      dailyStats.push(stat);
    });
    
    // Calculate total stats
    const totalStats = {
      totalNewCardsStudied: dailyStats.reduce((sum, day) => sum + day.newCardsStudied, 0),
      totalReviewsCompleted: dailyStats.reduce((sum, day) => sum + day.reviewsCompleted, 0),
      totalDaysStudied: dailyStats.filter(day => day.hasActivity).length,
      daysWithActivity: dailyStats.filter(day => day.hasActivity).length / dailyStats.length
    };
    
    // Format streak data
    const streakData = streaks.map(streak => ({
      deckId: streak.deckId,
      currentStreak: streak.currentStreak,
      maxStreak: streak.maxStreak,
      lastStudyDate: streak.lastStudyDate,
      currentStreakStartDate: streak.currentStreakStartDate,
      maxStreakStartDate: streak.maxStreakStartDate,
      maxStreakEndDate: streak.maxStreakEndDate
    }));
    
    // Format today's progress
    const todayStats = todayProgress.reduce((stats, progress) => {
      stats.newCardsStudied += progress.newCardsStudied || 0;
      stats.reviewsCompleted += progress.reviewsCompleted || 0;
      
      // Add deck-specific stats
      if (!stats.decks[progress.deckId]) {
        stats.decks[progress.deckId] = {
          deckId: progress.deckId,
          newCardsStudied: 0,
          reviewsCompleted: 0
        };
      }
      
      stats.decks[progress.deckId].newCardsStudied += progress.newCardsStudied || 0;
      stats.decks[progress.deckId].reviewsCompleted += progress.reviewsCompleted || 0;
      
      return stats;
    }, { newCardsStudied: 0, reviewsCompleted: 0, decks: {} });
    
    // Convert decks object to array
    todayStats.deckProgress = Object.values(todayStats.decks);
    delete todayStats.decks;
    
    // Return the stats
    res.json({
      success: true,
      stats: {
        overall: totalStats,
        daily: dailyStats,
        streaks: streakData,
        today: todayStats
      }
    });
  } catch (error) {
    console.error('Error getting study stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve study statistics'
    });
  }
}

module.exports = getStudyStats; 
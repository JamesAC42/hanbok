const { getDb } = require('../../database');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

// Helper function to check if an audio URL needs refreshing (older than 6 days)
async function checkAndRefreshAudioUrl(audioRecord) {
  if (!audioRecord || !audioRecord.audioUrl || !audioRecord.dateGenerated) {
    return null;
  }
  
  const now = new Date();
  const generatedDate = new Date(audioRecord.dateGenerated);
  const daysDifference = (now - generatedDate) / (1000 * 60 * 60 * 24);
  
  // If URL is less than 6 days old, it's still valid
  if (daysDifference < 6) {
    return audioRecord.audioUrl;
  }
  
  // URL is expired, generate a new one
  console.log(`Audio URL for word ${audioRecord.word} has expired (${daysDifference.toFixed(1)} days old). Refreshing...`);
  
  try {
    // Extract key from URL if it's a full URL
    let key = audioRecord.audioUrl;
    
    if (key.startsWith('http')) {
      try {
        const url = new URL(key);
        const pathParts = url.pathname.split('/');
        // The key should be everything after the bucket name in the path
        if (pathParts.length >= 3) {
          key = pathParts.slice(1).join('/');
        }
      } catch (parseError) {
        console.error('Error parsing URL:', parseError);
        return audioRecord.audioUrl; // Return original URL if parsing fails
      }
    }
    
    // Generate a new presigned URL valid for 7 days
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });
    
    const newUrl = await getSignedUrl(s3Client, command, { expiresIn: 604800 });
    
    // Update the audio record with new URL and timestamp
    const db = getDb();
    await db.collection('word_audio').updateOne(
      { _id: audioRecord._id },
      { 
        $set: { 
          audioUrl: newUrl,
          dateGenerated: now
        }
      }
    );
    
    console.log(`Successfully refreshed audio URL for word ${audioRecord.word}`);
    return newUrl;
  } catch (error) {
    console.error(`Error refreshing audio URL for word ${audioRecord.word}:`, error);
    return audioRecord.audioUrl; // Return original URL if refresh fails
  }
}

/**
 * Initiates a study session for a flashcard deck
 * - Gets cards to study according to SM-2 algorithm
 * - Orders them by priority (learning > due review > new)
 * - Fetches content for each card
 */
async function initiateStudySession(req, res) {
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

    // Get deck settings
    const newCardsPerDay = deck.settings?.newCardsPerDay || 20;
    const reviewsPerDay = deck.settings?.reviewsPerDay || 100;

    // Get all flashcard IDs in this deck
    const deckCards = await db.collection('deck_cards')
      .find({ deckId })
      .toArray();
    
    const flashcardIds = deckCards.map(card => card.flashcardId);
    
    if (flashcardIds.length === 0) {
      return res.json({
        success: true,
        studySession: {
          cards: [],
          stats: {
            new: 0,
            learning: 0,
            due: 0,
            total: 0
          }
        }
      });
    }

    // Get all unsuspended flashcards for this deck
    const allCards = await db.collection('flashcards')
      .find({ 
        flashcardId: { $in: flashcardIds },
        userId,
        suspended: { $ne: true }
      })
      .toArray();

    // Get the current date for calculations
    const now = new Date();
    
    // Separate cards by state - learning, due, and new
    // Learning cards: cards in learning or relearning state
    const learningCards = allCards.filter(card => 
      (card.reviewState === 'learning' || card.reviewState === 'relearning')
    );
    
    // Sort learning cards by due date
    learningCards.sort((a, b) => {
      const aDate = new Date(a.nextReviewDate).getTime();
      const bDate = new Date(b.nextReviewDate).getTime();
      return aDate - bDate;
    });
    
    // Due cards: review cards that are due now or earlier
    const dueCards = allCards.filter(card => {
      return (card.reviewState === 'review' && 
              card.intervalDays > 0 && 
              new Date(card.nextReviewDate) <= now);
    });
    
    // Sort due cards by due date
    dueCards.sort((a, b) => {
      const aDate = new Date(a.nextReviewDate).getTime();
      const bDate = new Date(b.nextReviewDate).getTime();
      return aDate - bDate;
    });
    
    // New cards: cards that haven't been studied yet
    const newCards = allCards.filter(card => card.reviewState === 'new');
    
    // Get today's date (truncated to day) for checking study progress
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check how many new cards were already studied today for this deck
    const todayProgress = await db.collection('study_progress').findOne({
      userId,
      deckId,
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    });
    
    // Number of new cards already studied today
    const newCardsAlreadyStudiedToday = todayProgress ? todayProgress.newCardsStudied : 0;
    
    // Calculate how many new cards we can introduce today, considering already studied ones
    const remainingNewToday = Math.max(0, newCardsPerDay - newCardsAlreadyStudiedToday);
    
    console.log(`User ${userId} studying deck ${deckId}:`);
    console.log(`- New cards limit per day: ${newCardsPerDay}`);
    console.log(`- New cards already studied today: ${newCardsAlreadyStudiedToday}`);
    console.log(`- Remaining new cards to study today: ${remainingNewToday}`);
    
    // Apply limits based on deck settings
    const limitedNewCards = newCards.slice(0, remainingNewToday);
    const limitedDueCards = dueCards.slice(0, reviewsPerDay);

    // Build the study queue with proper priority
    // 1. Learning cards (highest priority)
    // 2. Due review cards
    // 3. New cards up to the limit
    const studyQueue = [
      ...learningCards,
      ...limitedDueCards,
      ...limitedNewCards
    ];

    // For each card in the study session, get the content (word, sentence, etc.)
    const cardsWithContent = await Promise.all(studyQueue.map(async (card) => {
      let content = null;
      let audioUrl = null;
      let audioId = null;

      if (card.contentType === 'word') {
        // Fetch word content
        content = await db.collection('words').findOne({ wordId: card.contentId });
        
        // If the content exists, fetch the audio URL
        if (content) {
          // Find audio for the original word
          const audioQuery = {
            word: content.originalWord,
            language: content.originalLanguage
          };
          
          // For Japanese words, include hiragana reading in the search
          if (content.originalLanguage === 'ja') {
            // Check for reading in different possible fields
            const reading = content.reading || content.hiraganaReading;
            if (reading) {
              audioQuery.hiraganaReading = reading;
            }
          }
          
          // Attempt to find audio for the original word
          const audioRecord = await db.collection('word_audio').findOne(audioQuery);
          
          if (audioRecord) {
            // Check if the audio URL needs to be refreshed
            audioUrl = await checkAndRefreshAudioUrl(audioRecord);
            audioId = audioRecord._id.toString();
          }
        }
      } else if (card.contentType === 'sentence') {
        content = await db.collection('sentences').findOne({ sentenceId: card.contentId });
      }

      return {
        ...card,
        content,
        audioUrl,
        audioId
      };
    }));

    // Update the deck's lastReviewed timestamp
    await db.collection('flashcard_decks').updateOne(
      { deckId, userId },
      { $set: { lastReviewed: now } }
    );

    // Create a study session object
    const studySession = {
      deckId,
      cards: cardsWithContent,
      stats: {
        new: limitedNewCards.length,
        learning: learningCards.length,
        due: limitedDueCards.length,
        total: cardsWithContent.length,
        // Add information about daily progress
        dailyProgress: {
          newCardsLimit: newCardsPerDay,
          newCardsStudied: newCardsAlreadyStudiedToday,
          remainingNewCards: remainingNewToday,
          reviewsLimit: reviewsPerDay,
          reviewsCompleted: todayProgress ? todayProgress.reviewsCompleted : 0
        }
      },
      startedAt: now
    };

    // Also check and include streak information if available
    const streakInfo = await db.collection('study_streaks').findOne({
      userId,
      deckId
    });
    
    if (streakInfo) {
      studySession.stats.streak = {
        current: streakInfo.currentStreak,
        max: streakInfo.maxStreak,
        lastStudyDate: streakInfo.lastStudyDate
      };
    }

    res.json({
      success: true,
      studySession
    });
  } catch (error) {
    console.error('Error initiating study session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate study session'
    });
  }
}

// Helper function to check if two dates are on the same day
function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

module.exports = initiateStudySession; 
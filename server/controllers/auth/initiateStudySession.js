const { getDb } = require('../../database');
const { findSourceSentence } = require('../../lib/sourceSentence');
const { attachGrammarContent } = require('../../grammar/reviewCards');
const { getWordAudio, regenerateWordAudioRecord } = require('../../utils/wordAudio');
const { CHINESE_MODEL_ID, getPresignedUrl } = require('../../elevenlabs/generateSpeech');
const { isChinese } = require('../../llm/chineseScript');
const { isLegacyAwsUrl } = require('../../lib/storage');

// Chinese word audio made before Chinese moved to a Mandarin-pinned TTS model
// often has wrong tones. Regenerate it in the background, one word at a time,
// so this session stays fast and the next one gets the new audio.
function regenerateStaleChineseAudio(records) {
  if (records.length === 0) return;
  (async () => {
    for (const record of records) {
      try {
        await getWordAudio(record.word, record.language, null, true);
      } catch (error) {
        console.error(`Error regenerating Chinese audio for ${record.word}:`, error);
      }
    }
  })();
}

// Word audio whose file is gone (it lived in the old AWS bucket) is remade in
// the background, a few words at a time, so the session opens fast and the
// next one has audio.
function regenerateMissingWordAudio(records) {
  if (records.length === 0) return;
  (async () => {
    for (const record of records) {
      try {
        await regenerateWordAudioRecord(record);
      } catch (error) {
        console.error(`Error regenerating missing audio for ${record.word}:`, error.message);
      }
    }
  })();
}

// A playable URL for the word's audio, refreshed when older than 6 days.
// Returns null (and queues the record in `missing`) when the file is gone.
async function checkAndRefreshAudioUrl(audioRecord, missing) {
  if (!audioRecord || !audioRecord.audioUrl || !audioRecord.dateGenerated) {
    return null;
  }

  const now = new Date();
  const generatedDate = new Date(audioRecord.dateGenerated);
  const daysDifference = (now - generatedDate) / (1000 * 60 * 60 * 24);

  if (daysDifference < 6 && !isLegacyAwsUrl(audioRecord.audioUrl)) {
    return audioRecord.audioUrl;
  }

  try {
    const newUrl = await getPresignedUrl(audioRecord.audioUrl);
    const db = getDb();
    await db.collection('word_audio').updateOne(
      { _id: audioRecord._id },
      { $set: { audioUrl: newUrl, dateGenerated: now } }
    );
    return newUrl;
  } catch (error) {
    if (error.code !== 'AUDIO_NOT_FOUND') {
      console.error(`Error refreshing audio URL for word ${audioRecord.word}:`, error.message);
    }
    missing.push(audioRecord);
    return null;
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

    const staleChineseAudio = [];
    const missingAudio = [];

    // For each card in the study session, get the content (word, sentence, etc.)
    const cardsWithContent = await Promise.all(studyQueue.map(async (card) => {
      let content = null;
      let audioUrl = null;
      let audioId = null;
      let source = null;

      if (card.contentType === 'word') {
        // Fetch word content
        content = await db.collection('words').findOne({ wordId: card.contentId });

        // The sentence the word was saved from, shown on the answer side
        if (content) {
          try {
            source = await findSourceSentence(db, userId, content);
          } catch (error) {
            console.error('Error finding source sentence:', error);
          }
        }
        
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
            audioUrl = await checkAndRefreshAudioUrl(audioRecord, missingAudio);
            audioId = audioRecord._id.toString();
            if (audioUrl && isChinese(audioRecord.language) && audioRecord.ttsModel !== CHINESE_MODEL_ID) {
              staleChineseAudio.push(audioRecord);
            }
          }
        }
      } else if (card.contentType === 'sentence') {
        content = await db.collection('sentences').findOne({ sentenceId: card.contentId });
      }

      return {
        ...card,
        content,
        source,
        audioUrl,
        audioId
      };
    }));

    // Grammar cards come up as a quiz question or a flip card
    try {
      await attachGrammarContent(db, userId, cardsWithContent);
    } catch (error) {
      console.error('Error loading grammar review cards:', error);
    }

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

    regenerateStaleChineseAudio(staleChineseAudio);
    regenerateMissingWordAudio(missingAudio);
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
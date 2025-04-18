const { getDb } = require('../database');
const { ObjectId } = require('mongodb');
const generateResponse = require('../llm/generateResponse');
const { SEGMENT_LYRICS_PROMPT } = require('../llm/prompt_segmentLyrics');
const SupportedLanguages = require('../supported_languages');
const { getLyricsAnalysisPrompt } = require('../llm/lyrics_prompts');
const { createClient } = require('redis');
const { generateSpeech } = require('../elevenlabs/generateSpeech');

// Redis connection options
const redisOptions = {
  password: process.env.REDIS_PW || undefined,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) return false;
      return Math.min(retries * 100, 3000);
    }
  }
};

// Create a Redis client to be reused
let redisClient = null;

// Initialize Redis client
async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient(redisOptions);
    redisClient.on('error', (err) => console.error('Redis client error:', err));
    await redisClient.connect();
  }
  return redisClient;
}

/**
 * Process a lyric analysis job
 * @param {Object} job - The Bull job object
 * @param {Object} job.data - Job data containing lyricId, userId, and sse client ID
 * @param {Function} done - Callback to mark the job as completed
 */
async function processLyricAnalysis(job) {
  const { lyricId, userId, clientId } = job.data;
  console.log(`Starting background analysis for lyric ${lyricId}, client ${clientId}`);
  
  // Update job progress to 0% started
  await job.progress(0);
  
  try {
    const db = getDb();
    
    // Get the user from the database
    const user = await db.collection('users').findOne({ userId });
    if (!user) {
      throw new Error('User not found');
    }
    
    // Get the lyric
    const lyric = await db.collection('lyrics').findOne({ _id: new ObjectId(lyricId) });
    if (!lyric) {
      throw new Error('Lyric not found');
    }
    
    // Store job progress in Redis for SSE access
    await storeProgress(clientId, {
      type: 'status',
      message: 'Starting lyric analysis. Segmenting lyrics...'
    });

    let lyricsInputLines = lyric.lyricsText.split("\n");
    console.log("Lyrics input lines:", lyricsInputLines);
    lyricsInputLines = lyricsInputLines.filter(line => line.length > 0);
    console.log("Lyrics input lines:", lyricsInputLines);

    let lyricsInputForPrompt = "";
    let lyricsLines = {};
    let l = 1;
    for(let line of lyricsInputLines) {
      lyricsInputForPrompt += `${l}. ${line}\n`;
      lyricsLines[l] = line;
      l++;
    }

    console.log("Lyrics input for prompt:", lyricsInputForPrompt);

    let segments = await generateResponse(
      SEGMENT_LYRICS_PROMPT(SupportedLanguages[lyric.language]) + '\n' + lyricsInputForPrompt,
      'geminiThinking'
    );
    
    if (!segments || !segments.groups) {
      throw new Error('No segments found in the response');
    }
    
    const prompt = getLyricsAnalysisPrompt(lyric.language, 'en', lyric.lyricsText);
    const groups = segments.groups;
    const totalGroups = groups.length;
    let processedGroups = 0;
    
    // Array to store group-to-sentenceId mappings
    const analysisMapping = [];

    console.log("Lyrics lines:", lyricsLines);
    
    // Process each group
    for (let group of groups) {
      console.log("Processing group:", group);
      let sentence = "";
      for (let line of group) {
        sentence += " " + lyricsLines[line];
      }
      
      // Update progress
      await storeProgress(clientId, {
        type: 'status',
        message: `Analyzing segment ${processedGroups + 1}/${totalGroups} (${sentence})...`
      });
      
      // First try to find a sentence with voice keys
      let existingSentence = await db.collection('sentences').findOne({
        text: sentence,
        originalLanguage: lyric.language,
        translationLanguage: 'en',
        isLyric: true,
        $or: [
            { voice1Key: { $ne: null } },
            { voice2Key: { $ne: null } }
        ]
      });

      let sentenceObject = null;

      if(!existingSentence) {
        console.log("Analyzing sentence:", sentence);
        const parsedResponse = await generateResponse(
          prompt + sentence, 
          'gemini'
        );
        
        if(!parsedResponse || !parsedResponse.isValid) {
          console.log(parsedResponse);
          throw new Error('Invalid response from Gemini.');
        }
        
        if(!parsedResponse.analysis) {
          throw new Error('No analysis found in the response');
        }
        
        const analysis = parsedResponse.analysis;
        
        try {
          // Get next sentence ID
          const counterDoc = await db.collection('counters').findOneAndUpdate(
            { _id: 'sentenceId' },
            { $inc: { seq: 1 } },
            { upsert: true, returnDocument: 'after' }
          );
  
          let textToRead;
          if(lyric.language === 'ja') {
              textToRead = analysis.sentence.reading ?? sentence;
          } else {
              textToRead = sentence;
          }
  
          console.log('textToRead', textToRead);
  
          // Update progress
          await storeProgress(clientId, {
            type: 'status',
            message: `Analysis generated. Generating audio...`
          });
          const { voice1, voice2 } = await generateSpeech(textToRead);
          console.log('voice1', voice1);
          console.log('voice2', voice2);
        
          // Create sentence document
          const sentenceDoc = {
            sentenceId: counterDoc.seq,
            userId: user.userId,
            text: sentence,
            analysis: analysis,
            voice1Key: voice1,
            voice2Key: voice2,
            dateAudioGenerated: new Date(),
            originalLanguage: lyric.language,
            translationLanguage: 'en',
            dateCreated: new Date(),
            fromImage: false,
            isLyric: true
          };
          
          // Store in database
          await db.collection('sentences').insertOne(sentenceDoc);
          sentenceObject = sentenceDoc;

        } catch (dbError) {
          throw new Error('Failed to save analysis to database: ' + dbError.message);
        }
      } else {
        console.log('Existing sentence found. Continuing...');
        sentenceObject = existingSentence;
      }
      
      // Add mapping of group lines to sentenceId
      analysisMapping.push({
        lines: group,
        sentenceId: sentenceObject.sentenceId,
        text: sentenceObject.text
      });
      
      await storeProgress(clientId, {
        type: 'status',
        message: `Saved analysis to database. ID: ${sentenceObject.sentenceId}`
      });
      
      processedGroups++;
      
      // Update job progress as percentage
      const progressPercent = Math.round((processedGroups / totalGroups) * 100);
      await job.progress(progressPercent);
      
      // Update progress in Redis for SSE to read
      await storeProgress(clientId, {
        type: 'progress',
        processed: processedGroups,
        total: totalGroups,
        progress: progressPercent
      });
    }
    
    // Create lyrics_analysis entry
    await storeProgress(clientId, {
      type: 'status',
      message: 'Creating lyrics analysis record...'
    });
    
    // Check if analysis already exists
    const existingAnalysis = await db.collection('lyrics_analysis').findOne({
      lyricId: lyric._id.toString()
    });
    
    if (existingAnalysis) {
      console.log(`Analysis already exists for lyric ${lyricId}, skipping creation`);
      await storeProgress(clientId, {
        type: 'complete',
        message: 'Analysis already exists',
        progress: 100
      });
      return { success: true, lyricId, completed: true, alreadyExists: true };
    }
    
    // Create a new entry in the lyrics_analysis collection
    const analysisEntry = {
      lyricId: lyric._id.toString(), // Store as string to match the ObjectId
      language: 'en', // Analysis is in English
      dateCreated: new Date(),
      analysisData: JSON.stringify(analysisMapping),
      analysisId: new ObjectId().toString() // Add unique analysisId to prevent duplicate key error
    };
    
    // Insert the lyrics analysis document
    await db.collection('lyrics_analysis').insertOne(analysisEntry);
    
    // Mark job as complete in Redis
    await storeProgress(clientId, {
      type: 'complete',
      message: 'Analysis completed successfully',
      progress: 100
    });
    
    console.log(`Completed analysis for lyric ${lyricId}, client ${clientId}`);
    return { success: true, lyricId, completed: true };
    
  } catch (error) {
    console.error(`Error processing lyric analysis for ${lyricId}:`, error);
    
    // Store error in Redis for SSE access
    await storeProgress(clientId, {
      type: 'error',
      message: error.message || 'An unexpected error occurred'
    });
    
    throw error;
  }
}

/**
 * Store progress updates in Redis for SSE to access
 * @param {string} clientId - The client ID for this SSE connection
 * @param {Object} data - The progress data to store
 */
async function storeProgress(clientId, data) {
  try {
    // Get the shared Redis client
    const client = await getRedisClient();
    
    // Store progress keyed by client ID
    const key = `lyrics:analysis:progress:${clientId}`;
    await client.set(key, JSON.stringify({
      ...data,
      timestamp: Date.now()
    }));
    
    // Set expiration to clean up old progress data (1 hour)
    await client.expire(key, 60 * 60);
  } catch (error) {
    console.error('Error storing progress in Redis:', error);
    // Don't rethrow - we want to continue processing even if progress updates fail
  }
}

// Graceful shutdown function to close Redis connection
async function shutdown() {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('Redis client closed');
    } catch (err) {
      console.error('Error closing Redis client:', err);
    }
  }
}

// Export the processor function and shutdown handler
module.exports = {
  processLyricAnalysis,
  shutdown
};
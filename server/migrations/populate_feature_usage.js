require('dotenv').config();
const { MongoClient } = require('mongodb');

const mongoUrl = `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${process.env.MONGODB_DB}?authSource=admin`;

async function populateFeatureUsage() {
  let client;
  
  try {
    client = await MongoClient.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    const db = client.db(process.env.MONGODB_DB);
    const sentencesCollection = db.collection('sentences');
    const featureUsageCollection = db.collection('feature_usage');
    
    console.log('Starting feature usage data population...');
    
    // Get all sentences with userId (for sentence_submission)
    const sentencesWithUser = await sentencesCollection.find({
      userId: { $ne: null }
    }).toArray();
    
    console.log(`Found ${sentencesWithUser.length} sentences with user IDs for sentence_submission tracking`);
    
    // Get all sentences with voice1Key (for audio_generation)
    const sentencesWithAudio = await sentencesCollection.find({
      userId: { $ne: null },
      $or: [
        { voice1Key: { $ne: null } },
        { voice2Key: { $ne: null } }
      ]
    }).toArray();
    
    console.log(`Found ${sentencesWithAudio.length} sentences with audio for audio_generation tracking`);
    
    // Get all sentences with fromImage flag (for image_extraction)
    const sentencesFromImage = await sentencesCollection.find({
      userId: { $ne: null },
      fromImage: true
    }).toArray();
    
    console.log(`Found ${sentencesFromImage.length} sentences from images for image_extraction tracking`);
    
    // Process sentence submissions
    const userSentenceCounts = {};
    const userSentenceDates = {};
    
    for (const sentence of sentencesWithUser) {
      const userId = sentence.userId;
      if (!userSentenceCounts[userId]) {
        userSentenceCounts[userId] = 0;
        userSentenceDates[userId] = {
          first: sentence.dateCreated,
          last: sentence.dateCreated
        };
      }
      
      userSentenceCounts[userId]++;
      
      // Update first and last dates
      if (sentence.dateCreated < userSentenceDates[userId].first) {
        userSentenceDates[userId].first = sentence.dateCreated;
      }
      if (sentence.dateCreated > userSentenceDates[userId].last) {
        userSentenceDates[userId].last = sentence.dateCreated;
      }
    }
    
    // Process audio generations
    const userAudioCounts = {};
    const userAudioDates = {};
    
    for (const sentence of sentencesWithAudio) {
      const userId = sentence.userId;
      if (!userAudioCounts[userId]) {
        userAudioCounts[userId] = 0;
        userAudioDates[userId] = {
          first: sentence.dateAudioGenerated || sentence.dateCreated,
          last: sentence.dateAudioGenerated || sentence.dateCreated
        };
      }
      
      userAudioCounts[userId]++;
      
      // Use dateAudioGenerated if available, otherwise fall back to dateCreated
      const audioDate = sentence.dateAudioGenerated || sentence.dateCreated;
      
      // Update first and last dates
      if (audioDate < userAudioDates[userId].first) {
        userAudioDates[userId].first = audioDate;
      }
      if (audioDate > userAudioDates[userId].last) {
        userAudioDates[userId].last = audioDate;
      }
    }
    
    // Process image extractions
    const userImageCounts = {};
    const userImageDates = {};
    
    for (const sentence of sentencesFromImage) {
      const userId = sentence.userId;
      if (!userImageCounts[userId]) {
        userImageCounts[userId] = 0;
        userImageDates[userId] = {
          first: sentence.dateCreated,
          last: sentence.dateCreated
        };
      }
      
      userImageCounts[userId]++;
      
      // Update first and last dates
      if (sentence.dateCreated < userImageDates[userId].first) {
        userImageDates[userId].first = sentence.dateCreated;
      }
      if (sentence.dateCreated > userImageDates[userId].last) {
        userImageDates[userId].last = sentence.dateCreated;
      }
    }
    
    // Create operations for sentence_submission
    const sentenceOperations = Object.keys(userSentenceCounts).map(userId => ({
      updateOne: {
        filter: { userId: parseInt(userId), feature: 'sentence_submission' },
        update: {
          $set: {
            count: userSentenceCounts[userId],
            lastUsed: userSentenceDates[userId].last
          },
          $setOnInsert: {
            firstUsed: userSentenceDates[userId].first
          }
        },
        upsert: true
      }
    }));
    
    // Create operations for audio_generation
    const audioOperations = Object.keys(userAudioCounts).map(userId => ({
      updateOne: {
        filter: { userId: parseInt(userId), feature: 'audio_generation' },
        update: {
          $set: {
            count: userAudioCounts[userId],
            lastUsed: userAudioDates[userId].last
          },
          $setOnInsert: {
            firstUsed: userAudioDates[userId].first
          }
        },
        upsert: true
      }
    }));
    
    // Create operations for image_extraction
    const imageOperations = Object.keys(userImageCounts).map(userId => ({
      updateOne: {
        filter: { userId: parseInt(userId), feature: 'image_extraction' },
        update: {
          $set: {
            count: userImageCounts[userId],
            lastUsed: userImageDates[userId].last
          },
          $setOnInsert: {
            firstUsed: userImageDates[userId].first
          }
        },
        upsert: true
      }
    }));
    
    // Combine all operations
    const allOperations = [...sentenceOperations, ...audioOperations, ...imageOperations];
    
    // Execute operations in batches
    const batchSize = 100;
    for (let i = 0; i < allOperations.length; i += batchSize) {
      const batch = allOperations.slice(i, i + batchSize);
      await featureUsageCollection.bulkWrite(batch);
      console.log(`Processed ${Math.min(i + batchSize, allOperations.length)} / ${allOperations.length} operations`);
    }
    
    console.log('Feature usage data population completed successfully');
    console.log(`Added sentence_submission data for ${Object.keys(userSentenceCounts).length} users`);
    console.log(`Added audio_generation data for ${Object.keys(userAudioCounts).length} users`);
    console.log(`Added image_extraction data for ${Object.keys(userImageCounts).length} users`);
    
  } catch (error) {
    console.error('Feature usage data population failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run the population script
populateFeatureUsage().catch(console.error); 
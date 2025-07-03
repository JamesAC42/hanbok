require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const { setupCollections } = require('./models/schemas');

const mongoUrl = `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${process.env.MONGODB_DB.split('?')[0]}?authSource=admin`;

let db;

async function connectToDatabase() {
  try {
    console.log(mongoUrl);
    const client = await MongoClient.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      authSource: 'admin',
      auth: {
        username: process.env.MONGODB_USER,
        password: process.env.MONGODB_PASSWORD
      }
    });
    
    console.log('Connected to MongoDB');
    db = client.db(process.env.MONGODB_DB);
    
    // Setup collections with schema validation
    await setupCollections(db);
    
    // Create indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    
    // Create googleId index with safety check for existing conflicting indexes
    try {
      await db.collection('users').createIndex({ googleId: 1 }, { 
        unique: true, 
        partialFilterExpression: { googleId: { $type: "string" } } 
      });
    } catch (error) {
      if (error.code === 85) { // Index already exists with different options
        console.log('Recreating googleId index with new configuration...');
        await db.collection('users').dropIndex({ googleId: 1 });
        await db.collection('users').createIndex({ googleId: 1 }, { 
          unique: true, 
          partialFilterExpression: { googleId: { $type: "string" } } 
        });
        console.log('Successfully recreated googleId index');
      } else {
        throw error;
      }
    }
    await db.collection('sentences').createIndex({ userId: 1 });
    await db.collection('sentences').createIndex({ sentenceId: 1 }, { unique: true });
    await db.collection('savedSentences').createIndex(
      { userId: 1, sentenceId: 1 }, 
      { unique: true }
    );
    await db.collection('savedSentences').createIndex({ dateSaved: -1 });

    // Add indexes for feedback collection
    await db.collection('feedback').createIndex({ dateCreated: -1 });
    await db.collection('feedback').createIndex({ parentId: 1 });
    await db.collection('feedback').createIndex({ feedbackId: 1 }, { unique: true });
    await db.collection('feedback').createIndex({ userId: 1 });

    // Add index for feature_usage collection
    await db.collection('feature_usage').createIndex(
      { userId: 1, feature: 1 }, 
      { unique: true }
    );

    // Add index for word_audio collection
    await db.collection('word_audio').createIndex(
      { language: 1, word: 1, hiraganaReading: 1 }, 
      { unique: true }
    );

    // Add indexes for lyrics collections
    try {
      await db.collection('lyrics').createIndex({ lyricId: 1 }, { unique: true });
      await db.collection('lyrics').createIndex({ published: 1 });
      await db.collection('lyrics').createIndex({ language: 1 });
      
      await db.collection('lyrics_analysis').createIndex({ analysisId: 1 }, { unique: true });
      await db.collection('lyrics_analysis').createIndex({ lyricId: 1, language: 1 }, { unique: true });
      
      await db.collection('lyric_suggestions').createIndex({ suggestionId: 1 }, { unique: true });
      await db.collection('lyric_suggestions').createIndex({ upvotes: -1 });
      await db.collection('lyric_suggestions').createIndex({ userId: 1 });
      await db.collection('lyric_suggestions').createIndex({ status: 1 });
      
      // Add indexes for lyric suggestion upvotes
      await db.collection('lyric_suggestion_upvotes').createIndex(
        { userId: 1, suggestionId: 1 }, 
        { unique: true }
      );
      await db.collection('lyric_suggestion_upvotes').createIndex({ suggestionId: 1 });
    } catch (error) {
      // Ignore errors for indexes that already exist with different names
      if (error.code !== 85 && error.code !== 11000) {
        console.error('Error creating lyrics indexes:', error);
      } else {
        console.log('Lyrics indexes already exist with different names, continuing...');
      }
    }

    // Add index for rate_limits collection
    try {
      await db.collection('rate_limits').createIndex(
        { identifier: 1 }, 
        { unique: true }
      );
      await db.collection('rate_limits').createIndex(
        { weekStartDate: 1 }
      );
    } catch (error) {
      // Ignore errors for indexes that already exist with different names
      if (error.code !== 85 && error.code !== 11000) {
        console.error('Error creating rate_limits indexes:', error);
      } else {
        console.log('Rate limits indexes already exist with different names, continuing...');
      }
    }

    // Initialize counters - use upsert to avoid duplicate key errors
    const counters = [
      'userId', 'sentenceId', 'feedbackId', 'lyricId', 
      'analysisId', 'suggestionId', 'conversationId', 'messageId', 'commentId'
    ];
    
    for (const counterId of counters) {
      try {
        await db.collection('counters').updateOne(
          { _id: counterId },
          { $setOnInsert: { _id: counterId, seq: 0 } },
          { upsert: true }
        );
      } catch (error) {
        console.error(`Error initializing counter ${counterId}:`, error);
      }
    }
    
    return db;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

// Helper function to manually initialize missing counters
async function initializeCounters() {
  const database = getDb();
  const counters = [
    'userId', 'sentenceId', 'feedbackId', 'lyricId', 
    'analysisId', 'suggestionId', 'conversationId', 'messageId', 'commentId'
  ];
  
  for (const counterId of counters) {
    try {
      const existing = await database.collection('counters').findOne({ _id: counterId });
      if (!existing) {
        await database.collection('counters').insertOne({ _id: counterId, seq: 0 });
        console.log(`Initialized counter: ${counterId}`);
      } else {
        console.log(`Counter already exists: ${counterId} (seq: ${existing.seq})`);
      }
    } catch (error) {
      console.error(`Error checking/initializing counter ${counterId}:`, error);
    }
  }
}

module.exports = {
  connectToDatabase,
  getDb,
  initializeCounters,
};
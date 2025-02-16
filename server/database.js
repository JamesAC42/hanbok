require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const { setupCollections } = require('./models/schemas');

const mongoUrl = `mongodb://${process.env.MONGODB_USER}:${encodeURIComponent(process.env.MONGODB_PASSWORD)}@${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${process.env.MONGODB_DB.split('?')[0]}?authSource=admin`;

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
    await db.collection('users').createIndex({ googleId: 1 }, { unique: true });
    await db.collection('sentences').createIndex({ userId: 1 });
    await db.collection('sentences').createIndex({ sentenceId: 1 }, { unique: true });
    await db.collection('savedSentences').createIndex(
      { userId: 1, sentenceId: 1 }, 
      { unique: true }
    );
    await db.collection('savedSentences').createIndex({ dateSaved: -1 });

    // Initialize counters
    try {
      await db.collection('counters').insertOne({ _id: 'userId', seq: 0 });
      await db.collection('counters').insertOne({ _id: 'sentenceId', seq: 0 });
    } catch (error) {
      // Ignore duplicate key error as counters might already exist
      if (error.code !== 11000) {
        throw error;
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

module.exports = {
  connectToDatabase,
  getDb,
};
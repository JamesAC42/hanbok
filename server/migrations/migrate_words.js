require('dotenv').config();
const { MongoClient } = require('mongodb');

const mongoUrl = `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${process.env.MONGODB_DB}?authSource=admin`;

async function migrateWords() {
  let client;
  
  try {
    client = await MongoClient.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    const db = client.db(process.env.MONGODB_DB);
    const wordsCollection = db.collection('words');
    
    // First, temporarily remove schema validation
    console.log('Removing schema validation...');
    await db.command({
      collMod: "words",
      validator: {}
    });

    // Clean up null entries first
    console.log('Cleaning up null entries...');
    await wordsCollection.deleteMany({
      $or: [
        { korean: null },
        { english: null },
        { korean: '' },
        { english: '' }
      ]
    });

    // Drop the problematic index before migration
    console.log('Dropping old index...');
    try {
      await wordsCollection.dropIndex("userId_1_korean_1");
    } catch (error) {
      console.log('Old index not found or already dropped');
    }

    // Get all existing valid words
    const words = await wordsCollection.find({
      korean: { $exists: true, $ne: null },
      english: { $exists: true, $ne: null }
    }).toArray();
    
    console.log(`Found ${words.length} valid words to migrate`);
    
    // Perform migration in batches
    const batchSize = 100;
    for (let i = 0; i < words.length; i += batchSize) {
      const batch = words.slice(i, i + batchSize);
      const operations = batch.map(word => ({
        updateOne: {
          filter: { _id: word._id },
          update: {
            $set: {
              originalLanguage: 'ko',
              originalWord: word.korean,
              translationLanguage: 'en',
              translatedWord: word.english
            },
            $unset: {
              korean: "",
              english: ""
            }
          }
        }
      }));
      
      await wordsCollection.bulkWrite(operations);
      console.log(`Migrated ${Math.min(i + batchSize, words.length)} / ${words.length} words`);
    }
    
    // Now add back the schema validation with new schema
    console.log('Adding new schema validation...');
    await db.command({
      collMod: "words",
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["wordId", "userId", "originalLanguage", "originalWord", "translationLanguage", "translatedWord", "dateSaved"],
          properties: {
            wordId: { bsonType: "int" },
            userId: { bsonType: "int" },
            originalLanguage: { bsonType: "string" },
            originalWord: { bsonType: "string" },
            translationLanguage: { bsonType: "string" },
            translatedWord: { bsonType: "string" },
            dateSaved: { bsonType: "date" }
          }
        }
      }
    });
    
    // Create new index
    console.log('Creating new index...');
    await wordsCollection.createIndex(
      { userId: 1, originalLanguage: 1, originalWord: 1 },
      { unique: true }
    );
    
    console.log('Migration completed successfully');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run migration
migrateWords().catch(console.error); 
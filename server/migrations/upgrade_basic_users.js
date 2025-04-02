/**
 * Upgrade Basic Users Migration
 * 
 * This script upgrades all users who have tier = 1 (basic) to tier = 2 (plus).
 * This is a one-time migration to update user tiers in the database.
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function run() {
  let client;

  try {
    // Connect to MongoDB using the same connection string format as database.js
    const mongoUrl = `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${process.env.MONGODB_DB.split('?')[0]}?authSource=admin`;
    
    client = new MongoClient(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      authSource: 'admin',
      auth: {
        username: process.env.MONGODB_USER,
        password: process.env.MONGODB_PASSWORD
      }
    });
    
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(process.env.MONGODB_DB);
    
    // Find all users with tier = 1
    const users = await db.collection('users').find({
      tier: 1
    }).toArray();

    console.log(`Found ${users.length} users with tier = 1 that need to be upgraded`);

    if (users.length > 0) {
      // Process users in batches to avoid overwhelming the database
      const batchSize = 100;
      const batches = Math.ceil(users.length / batchSize);

      for (let i = 0; i < batches; i++) {
        const batchUsers = users.slice(i * batchSize, (i + 1) * batchSize);
        console.log(`Processing batch ${i + 1} of ${batches} (${batchUsers.length} users)...`);

        // Process each user in the current batch
        for (const user of batchUsers) {
          await db.collection('users').updateOne(
            { _id: user._id },
            { 
              $set: { tier: 2 }
            }
          );
        }
      }
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('Disconnected from MongoDB');
    }
  }
}

// Run the migration
run(); 
/**
 * Fix Flashcard Interval Migration
 * 
 * This script fixes the inconsistency between 'interval' and 'intervalDays' fields in the flashcards collection.
 * Some flashcards may have been created with 'interval' while the schema requires 'intervalDays'.
 * This migration ensures all flashcards have the correct field name to prevent document validation errors.
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function run() {
  let client;

  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI;
    client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    
    // Find all flashcards with 'interval' property but missing 'intervalDays'
    const cards = await db.collection('flashcards').find({
      interval: { $exists: true },
      intervalDays: { $exists: false }
    }).toArray();

    console.log(`Found ${cards.length} flashcards that need migration`);

    if (cards.length > 0) {
      // Process cards in batches to avoid overwhelming the database
      const batchSize = 100;
      const batches = Math.ceil(cards.length / batchSize);

      for (let i = 0; i < batches; i++) {
        const batchCards = cards.slice(i * batchSize, (i + 1) * batchSize);
        console.log(`Processing batch ${i + 1} of ${batches} (${batchCards.length} cards)...`);

        // Process each card in the current batch
        for (const card of batchCards) {
          await db.collection('flashcards').updateOne(
            { _id: card._id },
            { 
              $set: { intervalDays: card.interval },
              // Optionally leave the original field for backwards compatibility:
              // (if removing or renaming fields in MongoDB schema validation) 
              // $unset: { interval: "" }
            }
          );
        }
      }
    }

    // Also update reviewHistory entries
    const cardsWithWrongHistoryFormat = await db.collection('flashcards').find({
      "reviewHistory.interval": { $exists: true },
      "reviewHistory.intervalDays": { $exists: false }
    }).toArray();

    console.log(`Found ${cardsWithWrongHistoryFormat.length} flashcards with review history needing migration`);

    if (cardsWithWrongHistoryFormat.length > 0) {
      // Process cards in batches
      const batchSize = 100;
      const batches = Math.ceil(cardsWithWrongHistoryFormat.length / batchSize);

      for (let i = 0; i < batches; i++) {
        const batchCards = cardsWithWrongHistoryFormat.slice(i * batchSize, (i + 1) * batchSize);
        console.log(`Processing review history batch ${i + 1} of ${batches} (${batchCards.length} cards)...`);

        // Process each card in the current batch
        for (const card of batchCards) {
          if (card.reviewHistory && Array.isArray(card.reviewHistory)) {
            // Update the review history entries to include intervalDays based on interval
            const updatedHistory = card.reviewHistory.map(entry => {
              if (entry.interval !== undefined && entry.intervalDays === undefined) {
                return {
                  ...entry,
                  intervalDays: entry.interval
                };
              }
              return entry;
            });

            await db.collection('flashcards').updateOne(
              { _id: card._id },
              { $set: { reviewHistory: updatedHistory } }
            );
          }
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
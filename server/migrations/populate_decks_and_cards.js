const { MongoClient } = require('mongodb');
require('dotenv').config();

// Language names mapping
const languageNames = {
  'ko': 'Korean',
  'en': 'English',
  'zh': 'Chinese',
  'ja': 'Japanese',
  'es': 'Spanish',
  'it': 'Italian',
  'fr': 'French',
  'de': 'German',
  'nl': 'Dutch',
  'ru': 'Russian',
  'tr': 'Turkish'
};

// Connect to MongoDB
async function connectToMongo() {
  const mongoUrl = `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${process.env.MONGODB_DB.split('?')[0]}?authSource=admin`;
  
  console.log('Connecting to MongoDB...');
  const client = new MongoClient(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    authSource: 'admin',
    auth: {
      username: process.env.MONGODB_USER,
      password: process.env.MONGODB_PASSWORD
    }
  });
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    return client;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

// Generate a unique ID for a new document
async function getNextSequence(db, sequenceName) {
  // First, check if the counter exists
  const counter = await db.collection('counters').findOne({ _id: sequenceName });
  
  if (!counter) {
    // If counter doesn't exist, create it
    await db.collection('counters').insertOne({ _id: sequenceName, seq: 0 });
  }
  
  const result = await db.collection('counters').findOneAndUpdate(
    { _id: sequenceName },
    { $inc: { seq: 1 } },
    { returnDocument: 'after' }
  );
  
  return result.seq;
}

// Main migration function
async function migrateWordsToDecksAndCards() {
  let client;
  
  try {
    client = await connectToMongo();
    const db = client.db(process.env.MONGODB_DB);
    
    // Get all users
    const users = await db.collection('users').find({}).toArray();
    console.log(`Found ${users.length} users to process`);
    
    for (const user of users) {
      console.log(`Processing user: ${user.name} (ID: ${user.userId})`);
      
      // Get all words for this user
      const words = await db.collection('words').find({ userId: user.userId }).toArray();
      
      if (words.length === 0) {
        console.log(`No words found for user ${user.userId}, skipping`);
        continue;
      }
      
      console.log(`Found ${words.length} words for user ${user.userId}`);
      
      // Group words by language
      const wordsByLanguage = {};
      
      words.forEach(word => {
        if (!wordsByLanguage[word.originalLanguage]) {
          wordsByLanguage[word.originalLanguage] = [];
        }
        wordsByLanguage[word.originalLanguage].push(word);
      });
      
      // Process each language group
      for (const [language, languageWords] of Object.entries(wordsByLanguage)) {
        console.log(`Creating deck for language: ${language} with ${languageWords.length} words`);
        
        // Create a deck for this language
        const deckId = await getNextSequence(db, 'deckId');
        
        const languageName = languageNames[language] || language.charAt(0).toUpperCase() + language.slice(1);
        
        const deck = {
          deckId,
          userId: user.userId,
          name: `${languageName} Words`,
          language,
          description: `Flashcards for ${languageName} words`,
          dateCreated: new Date(),
          lastReviewed: null,
          settings: {
            newCardsPerDay: 20,
            reviewsPerDay: 100,
            learningSteps: [1, 10, 60, 1440] // 1min, 10min, 1hr, 1day
          }
        };
        
        await db.collection('flashcard_decks').insertOne(deck);
        console.log(`Created deck with ID: ${deckId}`);
        
        // Create flashcards for each word
        for (const word of languageWords) {
          const flashcardId = await getNextSequence(db, 'flashcardId');
          
          const flashcard = {
            flashcardId,
            userId: user.userId,
            contentType: 'word',
            contentId: word.wordId,
            dateCreated: new Date(),
            nextReviewDate: new Date(), // Due immediately
            interval: 0,
            intervalDays: 0,
            easeFactor: 2.5, // Default ease factor
            reviewHistory: [],
            repetitionNumber: 0,
            lapses: 0,
            reviewState: 'new',
            createdBy: 'migration',
            suspended: false,
            tags: [language]
          };
          
          await db.collection('flashcards').insertOne(flashcard);
          
          // Link the flashcard to the deck
          await db.collection('deck_cards').insertOne({
            deckId,
            flashcardId,
            dateAdded: new Date()
          });
        }
        
        console.log(`Created ${languageWords.length} flashcards for deck ${deckId}`);
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
migrateWordsToDecksAndCards().catch(console.error); 
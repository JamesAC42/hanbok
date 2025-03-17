require('dotenv').config();
const { MongoClient } = require('mongodb');
const { generateSpeech } = require('../elevenlabs/generateSpeech');
const { getJapaneseReading } = require('../llm/prompt_japanese_reading');

const mongoUrl = `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${process.env.MONGODB_DB}?authSource=admin`;

// Helper function to delay between API calls to avoid rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function populateWordAudio() {
  let client;
  
  try {
    client = await MongoClient.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    const db = client.db(process.env.MONGODB_DB);
    const wordsCollection = db.collection('words');
    const wordAudioCollection = db.collection('word_audio');
    
    // First, update the index to support multiple readings for Japanese words
    console.log('Updating word_audio collection index...');
    try {
      // Drop the old index
      await wordAudioCollection.dropIndex('language_1_word_1');
      console.log('Dropped old index: language_1_word_1');
    } catch (error) {
      console.log('Old index not found or already dropped:', error.message);
    }
    
    // Create the new index
    await wordAudioCollection.createIndex(
      { language: 1, word: 1, hiraganaReading: 1 },
      { unique: true }
    );
    console.log('Created new index: language_1_word_1_hiraganaReading_1');
    
    // Get all unique words from the words collection
    const uniqueWords = await wordsCollection.aggregate([
      {
        $group: {
          _id: {
            originalLanguage: "$originalLanguage",
            originalWord: "$originalWord"
          },
          // For Japanese words, we need the translation
          translations: {
            $push: {
              translationLanguage: "$translationLanguage",
              translatedWord: "$translatedWord"
            }
          }
        }
      }
    ]).toArray();
    
    console.log(`Found ${uniqueWords.length} unique words to process`);
    
    // Process words in batches to avoid overwhelming the ElevenLabs API
    const batchSize = 10;
    let processedCount = 0;
    
    for (let i = 0; i < uniqueWords.length; i += batchSize) {
      const batch = uniqueWords.slice(i, i + batchSize);
      
      // Process each word in the batch
      for (const wordDoc of batch) {
        const { originalLanguage, originalWord } = wordDoc._id;
        
        // For Japanese words, we need to get the hiragana reading first
        let hiraganaReading = null;
        if (originalLanguage === 'ja' && wordDoc.translations.length > 0) {
          // Find an English translation if available
          const englishTranslation = wordDoc.translations.find(t => t.translationLanguage === 'en');
          const translation = englishTranslation ? englishTranslation.translatedWord : wordDoc.translations[0].translatedWord;
          
          // Get the hiragana reading using the LLM
          hiraganaReading = await getJapaneseReading(originalWord, translation);
          console.log(`Generated hiragana reading for "${originalWord}": "${hiraganaReading}"`);
        }
        
        // Check if we already have audio for this word (and reading for Japanese)
        const query = {
          language: originalLanguage,
          word: originalWord
        };
        
        // For Japanese words, also match on the hiragana reading if available
        if (originalLanguage === 'ja' && hiraganaReading) {
          query.hiraganaReading = hiraganaReading;
        }
        
        const existingAudio = await wordAudioCollection.findOne(query);
        
        if (existingAudio) {
          console.log(`Audio already exists for ${originalWord} (${originalLanguage})${hiraganaReading ? ` with reading ${hiraganaReading}` : ''}, skipping...`);
          processedCount++;
          continue;
        }
        
        try {
          console.log(`Generating audio for ${originalWord} (${originalLanguage})${hiraganaReading ? ` with reading ${hiraganaReading}` : ''}...`);
          
          // Determine the text to speak
          let textToSpeak = originalWord;
          if (originalLanguage === 'ja' && hiraganaReading) {
            textToSpeak = hiraganaReading;
          }
          
          // Generate audio using ElevenLabs
          const audioResult = await generateSpeech(textToSpeak);
          
          // Extract the S3 key from the URL
          // The URL format is like: https://bucket.s3.region.amazonaws.com/key?params
          const url = new URL(audioResult.voice1);
          
          // Store the audio URL in the word_audio collection
          await wordAudioCollection.insertOne({
            word: originalWord,
            language: originalLanguage,
            audioUrl: audioResult.voice1,
            ...(hiraganaReading ? { hiraganaReading } : {}),
            dateGenerated: new Date()
          });
          
          console.log(`Successfully generated audio for ${originalWord} (${originalLanguage})${hiraganaReading ? ` with reading ${hiraganaReading}` : ''}`);
        } catch (error) {
          console.error(`Error generating audio for ${originalWord} (${originalLanguage}):`, error);
        }
        
        processedCount++;
        console.log(`Processed ${processedCount}/${uniqueWords.length} words`);
        
        // Add a delay between API calls to avoid rate limiting
        await delay(1000);
      }
      
      // Add a longer delay between batches
      console.log(`Completed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(uniqueWords.length / batchSize)}, waiting before next batch...`);
      await delay(5000);
    }
    
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
populateWordAudio().catch(console.error); 
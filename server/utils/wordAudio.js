const { getDb } = require('../database');
const { generateSpeech, getPresignedUrl } = require('../elevenlabs/generateSpeech');
const { getJapaneseReading } = require('../llm/prompt_japanese_reading');

/**
 * Get or generate audio for a word
 * @param {string} word - The word to get audio for
 * @param {string} language - The language of the word
 * @param {string} translation - The translation of the word (required for Japanese)
 * @param {boolean} forceRefresh - Whether to force regeneration of the audio
 * @returns {Promise<string>} - The audio URL
 */
async function getWordAudio(word, language, translation = null, forceRefresh = false) {
  const db = getDb();
  const wordAudioCollection = db.collection('word_audio');
  
  // For Japanese words, first get the hiragana reading
  let hiraganaReading = null;
  if (language === 'ja' && translation) {
    hiraganaReading = await getJapaneseReading(word, translation);
    console.log(`Generated hiragana reading for "${word}": "${hiraganaReading}"`);
  }
  
  // Check if we already have audio for this word (and reading for Japanese)
  const query = {
    language,
    word
  };
  
  // For Japanese words, also match on the hiragana reading if available
  if (language === 'ja' && hiraganaReading) {
    query.hiraganaReading = hiraganaReading;
  }
  
  const existingAudio = await wordAudioCollection.findOne(query);
  
  // If we have audio and we're not forcing a refresh
  if (existingAudio && !forceRefresh) {
    // Check if the audio URL is older than 7 days (604800000 ms)
    const audioAge = Date.now() - existingAudio.dateGenerated.getTime();
    
    if (audioAge < 604800000) {
      // URL is still valid, return it
      return existingAudio.audioUrl;
    } else if (existingAudio.audioUrl) {
      // URL is expired but we have the S3 key, so just refresh the URL
      try {
        const newUrl = await getPresignedUrl(existingAudio.audioUrl);
        
        // Update the URL and dateGenerated in the database
        await wordAudioCollection.updateOne(
          { _id: existingAudio._id },
          { 
            $set: {
              audioUrl: newUrl,
              dateGenerated: new Date()
            }
          }
        );
        
        return newUrl;
      } catch (error) {
        console.error(`Error refreshing URL for ${word} (${language}):`, error);
        // If refreshing fails, we'll fall through to generating new audio
      }
    }
    // If we don't have an S3 key or refreshing failed, we'll generate new audio
  }
  
  try {
    // Determine the text to speak
    let textToSpeak = word;
    if (language === 'ja' && hiraganaReading) {
      textToSpeak = hiraganaReading;
    }
    
    // Generate new audio
    const audioResult = await generateSpeech(textToSpeak);
    
    // Extract the S3 key from the URL
    // The URL format is like: https://bucket.s3.region.amazonaws.com/key?params
    
    // For Japanese words, we need to create a unique document for each reading
    // For other languages, we can update the existing document
    if (language === 'ja' && hiraganaReading) {
      // Insert a new document for this specific reading
      await wordAudioCollection.insertOne({
        word,
        language,
        hiraganaReading,
        audioUrl: audioResult.voice1,
        dateGenerated: new Date()
      });
    } else {
      // Update or insert the audio URL and S3 key in the word_audio collection
      await wordAudioCollection.updateOne(
        { language, word },
        { 
          $set: {
            audioUrl: audioResult.voice1,
            dateGenerated: new Date()
          }
        },
        { upsert: true }
      );
    }
    
    return audioResult.voice1;
  } catch (error) {
    console.error(`Error generating audio for ${word} (${language}):`, error);
    
    // If we have existing audio, return it even if it's expired
    if (existingAudio) {
      return existingAudio.audioUrl;
    }
    
    throw error;
  }
}

module.exports = {
  getWordAudio
}; 
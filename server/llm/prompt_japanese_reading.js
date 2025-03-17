const SupportedLanguages = require('../supported_languages');
const { prompt_openai } = require('./openai');
const { prompt_anthropic } = require('./anthropic');
const { prompt_gemini } = require('./gemini');

// Function to generate text responses (not JSON)
const generateTextResponse = async (text, model = 'openai') => {
  const models = {
    anthropic: prompt_anthropic,
    gemini: prompt_gemini,
    openai: prompt_openai
  };

  if (!models[model]) {
    throw new Error(`Model ${model} not supported`);
  }

  try {
    const response = await models[model](text);
    
    // Clean up the response - remove any markdown code blocks if present
    let cleanedResponse = response;
    if (response.includes('```')) {
      cleanedResponse = response.replace(/```[a-z]*\n/g, '').replace(/```/g, '');
    }
    
    return cleanedResponse.trim();
  } catch (error) {
    console.error('Error generating text response:', error);
    throw error;
  }
};

const JAPANESE_READING_PROMPT = (word, translation) => `You are a Japanese language expert. Given a Japanese word and its English translation, provide the correct hiragana reading for the word to ensure proper text-to-speech pronunciation.

Japanese Word: ${word}
English Translation: ${translation}

Rules:
1. Return ONLY the hiragana reading of the word, with no additional text or explanation.
2. For kanji compounds, provide the correct reading based on context.
3. If the word is already in hiragana or katakana, simply return it converted to hiragana.
4. If the word has multiple possible readings, use the translation to determine the most likely correct reading.
5. Do not include any particles or grammatical markers that aren't part of the word itself.
6. Return ONLY hiragana characters, no kanji, no katakana, no romaji, no explanations.

Example responses:
- For "食べる" → "たべる"
- For "学校" → "がっこう"
- For "美しい" → "うつくしい"
- For "東京" → "とうきょう"

Your response:`;

const getJapaneseReading = async (word, translation) => {
  try {
    // Use OpenAI as the default model for consistency
    const prompt = JAPANESE_READING_PROMPT(word, translation);
    const reading = await generateTextResponse(prompt, 'openai');
    
    return reading;
  } catch (error) {
    console.error('Error generating Japanese reading:', error);
    // If we can't get a reading, return the original word
    return word;
  }
};

module.exports = {
  getJapaneseReading,
  generateTextResponse
}; 
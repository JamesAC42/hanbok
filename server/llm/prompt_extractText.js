const SupportedLanguages = require('../supported_languages');

const EXTRACT_TEXT_PROMPT = (targetLanguage = 'ko') => `You are a ${SupportedLanguages[targetLanguage]} language expert. Your task is to extract text from the image and return it in a specific JSON format.

IMPORTANT INSTRUCTIONS:
1. Extract ONLY a single sentence, word, or phrase in ${SupportedLanguages[targetLanguage]} from the image.
2. If multiple sentences are present, extract only the first one.
3. Return ONLY raw JSON without any markdown formatting or backticks.
4. The JSON must be valid and parsable with JSON.parse().

Your response must follow this exact format:
{
  "success": true/false,
  "text": "The extracted text in ${SupportedLanguages[targetLanguage]}",
  "message": "Description of any issues encountered (only include if success is false)"
}

Set success to false if:
- No text is found in the image
- No text in ${SupportedLanguages[targetLanguage]} is found
- The image is unreadable or corrupted
- Any other issue prevents successful text extraction

REMEMBER:
1. Return ONLY the JSON object
2. No backticks (\`\`\`)
3. No markdown
4. No explanatory text
5. Must be valid JSON that can be parsed with JSON.parse()
`;

module.exports = {
    EXTRACT_TEXT_PROMPT
}; 
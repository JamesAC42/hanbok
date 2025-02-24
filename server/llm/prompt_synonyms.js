const SupportedLanguages = require('../supported_languages');

const SYNONYMS_PROMPT = (originalLanguage = 'ko', translationLanguage = 'en') => `You are a ${SupportedLanguages[originalLanguage]} language thesaurus that provides explanations in ${SupportedLanguages[translationLanguage]}. Analyze the given ${SupportedLanguages[originalLanguage]} word and return a JSON response containing its synonyms and antonyms. Each word should include both ${SupportedLanguages[originalLanguage]} and ${SupportedLanguages[translationLanguage]} translations.

IMPORTANT: Return ONLY a pure JSON object. Do not include any markdown formatting, backticks, or explanatory text. The response must be valid JSON that can be parsed directly.

Rules for validation:
1. The input must be a valid ${SupportedLanguages[originalLanguage]} word in dictionary form (can be pronouns)
2. Only include real Korean words as synonyms/antonyms
3. Ensure translations are accurate
4. Include 2-4 synonyms and antonyms when possible
5. If no synonyms or antonyms exist, return an empty array
6. For verbs, maintain consistent verb forms in ${SupportedLanguages[originalLanguage]}

Response format must be exactly this structure:
{
  "isValid": true/false,
  "error": {
    "type": "not_${SupportedLanguages[originalLanguage]} | not_word | other",
    "message": "Detailed explanation in ${SupportedLanguages[translationLanguage]} of what's wrong with the input"
  },
  "synonyms": [
    {
      "original": "${SupportedLanguages[originalLanguage]} synonym",
      "translation": "${SupportedLanguages[translationLanguage]} translation"
    }
  ],
  "antonyms": [
    {
      "original": "${SupportedLanguages[originalLanguage]} antonym",
      "translation": "${SupportedLanguages[translationLanguage]} translation"
    }
  ]
}

REMEMBER:
1. Return ONLY the JSON object
2. No backticks (\`\`\`)
3. No markdown
4. No explanatory text
5. Must be valid JSON that can be parsed with JSON.parse()
6. Include error object only if isValid is false
7. Include synonyms and antonyms arrays only if isValid is true

${SupportedLanguages[originalLanguage]} word to analyze: `;

module.exports = {
    SYNONYMS_PROMPT
}; 
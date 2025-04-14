const { LYRICS_ANALYSIS_PROMPT } = require('./prompt_lyrics');
const { JAPANESE_LYRICS_ANALYSIS_PROMPT } = require('./prompt_japanese_lyrics');

/**
 * Gets the appropriate lyrics analysis prompt based on the original language
 * @param {string} originalLanguage - The language code of the original text (e.g., 'ko', 'ja')
 * @param {string} translationLanguage - The language code for translations (e.g., 'en')
 * @param {string} fullLyrics - The complete lyrics of the song for context
 * @returns {string} - The formatted prompt template with the full lyrics inserted
 */
const getLyricsAnalysisPrompt = (originalLanguage, translationLanguage, fullLyrics) => {
    let promptTemplate;
    
    if (originalLanguage === 'ja') {
        promptTemplate = JAPANESE_LYRICS_ANALYSIS_PROMPT(originalLanguage, translationLanguage);
    } else {
        promptTemplate = LYRICS_ANALYSIS_PROMPT(originalLanguage, translationLanguage);
    }
    
    // Insert the full lyrics into the template
    return promptTemplate.replace('[FULL_LYRICS]', fullLyrics);
};

module.exports = {
    LYRICS_ANALYSIS_PROMPT,
    JAPANESE_LYRICS_ANALYSIS_PROMPT,
    getLyricsAnalysisPrompt
}; 
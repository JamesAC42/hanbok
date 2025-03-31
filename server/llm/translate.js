const { TRANSLATE_TEXT_PROMPT } = require('./prompt_translateText');
const generateResponse = require('./generateResponse');

const translateText = async (text, originalLanguage, targetLanguage, context, provider = 'gemini') => {
    try {
        // Get the prompt with the original and target languages
        const prompt = TRANSLATE_TEXT_PROMPT(originalLanguage, targetLanguage);
        
        // Append the text to translate and context information
        const fullPrompt = `${prompt}${text}

Translation context: ${context || 'None provided. Translate with neutral formality.'}`;

        // Generate the response using the specified provider
        const response = await generateResponse(fullPrompt, provider);
        return response;
        
    } catch (error) {
        console.error('Error translating text:', error);
        return {
            isValid: false,
            error: {
                type: 'processing_error',
                message: `Error processing translation: ${error.message}`
            }
        };
    }
};

module.exports = {
    translateText
};

const {prompt_anthropic} = require('./anthropic');
const {prompt_gemini} = require('./gemini');
const {prompt_openai} = require('./openai');
const {prompt_geminiThinking} = require('./geminiThinking');
const { TUTOR_PROMPT } = require('./prompt_tutor');

const models = {
    anthropic: prompt_anthropic,
    gemini: prompt_gemini,
    openai: prompt_openai,
    geminiThinking: prompt_geminiThinking
}

/**
 * Generate a tutor response for language learning conversations
 * @param {string} userMessage - The user's question or message
 * @param {string} targetLanguage - Language being learned (ko, ja, zh, etc.)
 * @param {string} responseLanguage - Language for the response (en, etc.)
 * @param {Object} context - Optional conversation context
 * @param {string} model - AI model to use (anthropic, gemini, openai, geminiThinking)
 * @param {Array} conversationHistory - Previous messages for context (optional)
 * @returns {Promise<string>} - Generated response in markdown format
 */
const generateTutorResponse = async (
    userMessage, 
    targetLanguage = 'ko', 
    responseLanguage = 'en', 
    context = null,
    model = 'openai',
    conversationHistory = []
) => {
    try {
        console.log("Generating tutor response...");
        console.log(`Target Language: ${targetLanguage}, Response Language: ${responseLanguage}`);
        console.log(`Model: ${model}`);
        
        // Build the prompt with context
        let fullPrompt = TUTOR_PROMPT(targetLanguage, responseLanguage, context);
        
        // Add conversation history if provided (last 6 messages for context)
        if (conversationHistory && conversationHistory.length > 0) {
            const recentHistory = conversationHistory.slice(-6);
            let historyText = '\n\nCONVERSATION HISTORY:\n';
            recentHistory.forEach(msg => {
                if (msg.role === 'user') {
                    historyText += `Student: ${msg.content}\n`;
                } else if (msg.role === 'assistant') {
                    historyText += `Tutor: ${msg.content.substring(0, 200)}...\n`;
                }
            });
            historyText += '\nCURRENT QUESTION:\n';
            fullPrompt = fullPrompt.replace('User\'s question or message: ', historyText + 'User\'s question or message: ');
        }
        
        // Add the user's message
        fullPrompt += userMessage;
        
        // Generate response with retries
        let attempts = 0;
        const maxAttempts = 3;
        let response = null;
        
        while (!response && attempts < maxAttempts) {
            try {
                console.log(`Attempt ${attempts + 1} of ${maxAttempts}`);
                response = await models[model](fullPrompt);
                
                // Validate response contains required example tags if examples are present
                if (response.includes('example') && !response.includes('<example>')) {
                    console.log("Response may be missing proper example tags, retrying...");
                    response = null;
                    throw new Error("Invalid example format");
                }
                
            } catch (error) {
                console.log("Error generating tutor response:", error.message);
                attempts++;
                
                if (attempts >= maxAttempts) {
                    throw new Error(`Failed to generate response after ${maxAttempts} attempts: ${error.message}`);
                }
            }
        }
        
        // Clean up response
        response = response.trim();
        
        // Ensure proper markdown formatting
        if (!response.startsWith('#') && !response.startsWith('##')) {
            // Add a default heading if none exists
            response = `## Language Learning Help\n\n${response}`;
        }
        
        console.log("Tutor response generated successfully");
        return response;
        
    } catch (error) {
        console.error('Error in generateTutorResponse:', error);
        
        // Return a helpful fallback response
        return `## I'm here to help!

I apologize, but I'm experiencing some technical difficulties right now. However, I'm still here to help you learn ${targetLanguage === 'ko' ? 'Korean' : targetLanguage === 'ja' ? 'Japanese' : targetLanguage === 'zh' ? 'Chinese' : 'this language'}!

Could you please try rephrasing your question? I'm ready to help with:

- **Grammar explanations** - Ask about sentence structures, particles, verb forms
- **Vocabulary help** - Word meanings, usage, and examples  
- **Cultural context** - When and how to use certain expressions
- **Pronunciation guidance** - How to say words correctly

<example>
Just ask something like: "How do I use the particle 이/가?" or "What does [word] mean?"
</example>

What would you like to learn about today?`;
    }
};

module.exports = {
    generateTutorResponse
}; 
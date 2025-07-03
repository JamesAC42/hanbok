const { streamOpenAI } = require('./openaiStream');
const {prompt_anthropic} = require('./anthropic');
const {prompt_gemini} = require('./gemini');
const {prompt_openai} = require('./openai');
const {prompt_geminiThinking} = require('./geminiThinking');
const { TUTOR_PROMPT } = require('./prompt_tutor');

const models = {
    anthropic: prompt_anthropic, // Fallback to non-streaming for non-OpenAI models
    gemini: prompt_gemini,
    openai: prompt_openai, // Fallback
    geminiThinking: prompt_geminiThinking
}

/**
 * Generate a streaming tutor response for language learning conversations
 * @param {string} userMessage - The user's question or message
 * @param {string} targetLanguage - Language being learned (ko, ja, zh, etc.)
 * @param {string} responseLanguage - Language for the response (en, etc.)
 * @param {Object} context - Optional conversation context
 * @param {string} model - AI model to use (anthropic, gemini, openai, geminiThinking)
 * @param {Array} conversationHistory - Previous messages for context (optional)
 * @param {Function} onChunk - Callback for streaming chunks
 * @param {Function} onComplete - Callback when streaming is complete
 * @param {Function} onError - Callback for errors
 * @returns {Promise<string>} - Generated response in markdown format
 */
const generateTutorResponseStream = async (
    userMessage, 
    targetLanguage = 'ko', 
    responseLanguage = 'en', 
    context = null,
    model = 'openai',
    conversationHistory = [],
    onChunk = null,
    onComplete = null,
    onError = null
) => {
    try {
        // console.log("Generating streaming tutor response...");
        // console.log(`Target Language: ${targetLanguage}, Response Language: ${responseLanguage}`);
        // console.log(`Model: ${model}`);
        // console.log(`Conversation History Length: ${conversationHistory ? conversationHistory.length : 0}`);
        
        // Build the prompt with context
        let fullPrompt = TUTOR_PROMPT(targetLanguage, responseLanguage, context);
        
        // Add conversation history if provided (last 6 messages for context)
        if (conversationHistory && conversationHistory.length > 0) {
            // console.log("Adding conversation history to prompt...");
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
            // console.log("History text being added:", historyText);
            fullPrompt = fullPrompt.replace('User\'s question or message: ', historyText + 'User\'s question or message: ');
        } else {
            // console.log("No conversation history provided or empty history");
        }
        
        // Add the user's message
        fullPrompt += userMessage;
        
        // console.log("Final prompt length:", fullPrompt.length, "characters");
        
        // Handle streaming for OpenAI model
        if (model === 'openai') {
            // Build OpenAI messages format
            const messages = [
                { role: "system", content: TUTOR_PROMPT(targetLanguage, responseLanguage, context) }
            ];
            
            // Add conversation history if provided
            if (conversationHistory && conversationHistory.length > 0) {
                // console.log("Adding conversation history to OpenAI messages...");
                const recentHistory = conversationHistory.slice(-10); // More history for better context
                recentHistory.forEach(msg => {
                    if (msg.role === 'user' || msg.role === 'assistant') {
                        messages.push({
                            role: msg.role,
                            content: msg.content
                        });
                    }
                });
            }
            
            // Add current user message
            messages.push({
                role: "user",
                content: userMessage
            });
            
            // console.log("OpenAI messages structure:", messages.map(m => ({ role: m.role, contentLength: m.content.length })));
            
            return await streamOpenAI(
                messages, // Pass messages array instead of single prompt
                onChunk,
                (fullResponse) => {
                    // Clean up response
                    let response = fullResponse.trim();
                    
                    // Ensure proper markdown formatting
                    if (!response.startsWith('#') && !response.startsWith('##')) {
                        response = `## Language Learning Help\n\n${response}`;
                    }
                    
                    // console.log("Streaming tutor response completed");
                    if (onComplete) {
                        onComplete(response);
                    }
                },
                onError
            );
        } else {
            // Fallback to non-streaming for other models
            // console.log("Using non-streaming fallback for model:", model);
            
            let attempts = 0;
            const maxAttempts = 3;
            let response = null;
            
            while (!response && attempts < maxAttempts) {
                try {
                    // console.log(`Attempt ${attempts + 1} of ${maxAttempts}`);
                    response = await models[model](fullPrompt);
                    
                    // Validate response contains required example tags if examples are present
                    if (response.includes('example') && !response.includes('<example>')) {
                        // console.log("Response may be missing proper example tags, retrying...");
                        response = null;
                        throw new Error("Invalid example format");
                    }
                    
                } catch (error) {
                    // console.log("Error generating tutor response:", error.message);
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
                response = `## Language Learning Help\n\n${response}`;
            }
            
            // For non-streaming models, send the complete response at once
            if (onChunk) {
                onChunk(response);
            }
            if (onComplete) {
                onComplete(response);
            }
            
            // console.log("Non-streaming tutor response generated successfully");
            return response;
        }
        
    } catch (error) {
        // console.error('Error in generateTutorResponseStream:', error);
        
        if (onError) {
            onError(error);
        }
        
        // Return a helpful fallback response
        const fallbackResponse = `## I'm here to help!

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

        if (onChunk) {
            onChunk(fallbackResponse);
        }
        if (onComplete) {
            onComplete(fallbackResponse);
        }
        
        return fallbackResponse;
    }
};

module.exports = {
    generateTutorResponseStream
}; 
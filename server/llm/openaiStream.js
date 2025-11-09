const OpenAI = require("openai");
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Stream response from OpenAI GPT model
 * @param {string|Array} text - The prompt text or messages array
 * @param {Function} onChunk - Callback function for each chunk of data
 * @param {Function} onComplete - Callback function when streaming is complete
 * @param {Function} onError - Callback function for errors
 * @returns {Promise<string>} - Complete response text
 */
const streamOpenAI = async (text, onChunk, onComplete, onError) => {
    try {
        // Handle both string prompts and message arrays
        let messages;
        if (Array.isArray(text)) {
            messages = text;
        } else {
            messages = [{ role: "user", content: text }];
        }
        
        
        const stream = await openai.chat.completions.create({
            model: "gpt-4.1",
            messages: messages,
            stream: true,
        });

        let fullResponse = '';

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
                fullResponse += content;
                // Call the chunk callback with the new content
                if (onChunk) {
                    onChunk(content);
                }
            }
        }

        // Call the completion callback
        if (onComplete) {
            onComplete(fullResponse);
        }

        return fullResponse;

    } catch (error) {
        console.error('OpenAI streaming error:', error);
        if (onError) {
            onError(error);
        }
        throw error;
    }
};

module.exports = { streamOpenAI }; 
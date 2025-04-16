const {prompt_anthropic} = require('./anthropic');
const {prompt_gemini} = require('./gemini');
const {prompt_openai} = require('./openai');
const {prompt_geminiThinking} = require('./geminiThinking');

const models = {
    anthropic: prompt_anthropic,
    gemini: prompt_gemini,
    openai: prompt_openai,
    geminiThinking: prompt_geminiThinking
}

const generateResponse = async (text, model) => {
    let attempts = 0;
    let maxAttempts = 5;
    let parsedResponse = null;
    while(!parsedResponse && attempts < maxAttempts) {
        try {
            console.log("Generating response...");
            console.log(`Attempt ${attempts + 1} of ${maxAttempts}`);
            let response = await models[model](text);

            // Strip away ```json and ``` if present
            if (response.startsWith('```json') && response.endsWith('```')) {
                response = response.slice(7, -3).trim();
            }

            parsedResponse = JSON.parse(response);
        } catch (error) {
            console.log("Error parsing response", error);
            console.log("Trying again...");
            console.log(error);
            attempts++;
        }
    }

    if(!parsedResponse) {
        throw new Error("Could not generate valid response.");
    }

    return parsedResponse;
}

module.exports = generateResponse;
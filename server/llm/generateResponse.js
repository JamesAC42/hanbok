const {prompt_anthropic} = require('./anthropic');
const {prompt_gemini} = require('./gemini');
const {prompt_openai} = require('./openai');

const models = {
    anthropic: prompt_anthropic,
    gemini: prompt_gemini,
    openai: prompt_openai
}

const generateResponse = async (text, model) => {
    let attempts = 0;
    let maxAttempts = 1;
    let parsedResponse = null;
    while(!parsedResponse && attempts < maxAttempts) {
        console.log("generating...");
        try {
            let response = await models[model](text);
            //console.log(response);

            // Strip away ```json and ``` if present
            if (response.startsWith('```json') && response.endsWith('```')) {
                response = response.slice(7, -3).trim();
            }

            parsedResponse = JSON.parse(response);
        } catch (error) {
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
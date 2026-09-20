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

const modelLabels = {
    anthropic: 'anthropic/claude-sonnet-4-5',
    gemini: 'gemini/gemini-flash-lite-latest',
    openai: 'openai/gpt-4.1',
    geminiThinking: 'gemini/gemini-3.1-flash-lite-preview'
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const extractJsonText = (raw) => {
    if (typeof raw !== 'string') {
        throw new Error('Model response was not a string');
    }

    let text = raw.trim();

    // Strip common markdown fences (```json ... ``` or ``` ... ```)
    const fenceMatch = text.match(/^```(?:json|JSON)?\s*([\s\S]*?)\s*```\s*$/);
    if (fenceMatch) {
        text = fenceMatch[1].trim();
    }

    // If there is leading/trailing prose, take the outermost JSON object/array
    if (!(text.startsWith('{') || text.startsWith('['))) {
        const firstObj = text.indexOf('{');
        const firstArr = text.indexOf('[');
        let start = -1;
        if (firstObj === -1) start = firstArr;
        else if (firstArr === -1) start = firstObj;
        else start = Math.min(firstObj, firstArr);

        if (start !== -1) {
            const open = text[start];
            const close = open === '{' ? '}' : ']';
            const end = text.lastIndexOf(close);
            if (end > start) {
                text = text.slice(start, end + 1);
            }
        }
    }

    return text;
};

const isRetryableApiError = (error) => {
    const status = error?.status ?? error?.statusCode;
    const message = String(error?.message || error || '');
    if (status === 429 || status === 500 || status === 503) return true;
    if (/\[429 |\[500 |\[503 |overloaded|high demand|timed out|Resource has been exhausted/i.test(message)) {
        return true;
    }
    return false;
};

const generateResponse = async (text, model) => {
    let attempts = 0;
    let maxAttempts = 5;
    let parsedResponse = null;
    let lastError = null;

    while(!parsedResponse && attempts < maxAttempts) {
        try {
            console.log(`Generating response with ${modelLabels[model] || model}...`);
            console.log(`Attempt ${attempts + 1} of ${maxAttempts}`);
            let response = await models[model](text);

            const jsonText = extractJsonText(response);
            parsedResponse = JSON.parse(jsonText);
        } catch (error) {
            lastError = error;
            const snippet = typeof error?.message === 'string'
                ? error.message.slice(0, 300)
                : String(error).slice(0, 300);
            console.log("Error generating/parsing response:", snippet);
            console.log("Trying again...");
            attempts++;

            if (isRetryableApiError(error) && attempts < maxAttempts) {
                // Back off on transient Gemini/OpenAI rate-limit / overload errors
                const delayMs = Math.min(8000, 500 * Math.pow(2, attempts - 1));
                await sleep(delayMs);
            }
        }
    }

    if(!parsedResponse) {
        const detail = lastError?.message ? String(lastError.message).slice(0, 200) : 'unknown error';
        throw new Error(`Could not generate valid response. Last error: ${detail}`);
    }

    return parsedResponse;
}

module.exports = generateResponse;

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Grammar practice runs on the same Flash-Lite model as sentence analysis:
// fast and cheap, and every response is checked in code before it's stored.
const GRAMMAR_MODEL = process.env.GEMINI_GRAMMAR_MODEL || process.env.GEMINI_ANALYSIS_MODEL || 'gemini-3.5-flash-lite';
const TIMEOUT_MS = 45000;
const MAX_OUTPUT_TOKENS = 6000;

// Lessons are written once per grammar point and shared, so they use the
// stronger model; the wait only happens for the first learner.
const LESSON_MODEL = process.env.GEMINI_LESSON_MODEL || 'gemini-3.8-flash';

const models = {};
const getModel = (name) => {
    if (!models[name]) {
        models[name] = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '').getGenerativeModel({ model: name });
    }
    return models[name];
};

// One JSON call with a response schema. Retries once on a bad response.
const callJson = async (prompt, schema, { attempts = 2, timeoutMs = TIMEOUT_MS, model = GRAMMAR_MODEL } = {}) => {
    let lastError = null;
    for (let i = 0; i < attempts; i++) {
        try {
            const result = await getModel(model).generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: 'application/json',
                    responseJsonSchema: schema,
                    maxOutputTokens: MAX_OUTPUT_TOKENS,
                },
            }, { timeout: timeoutMs });
            return JSON.parse(result.response.text());
        } catch (error) {
            lastError = error;
            console.error(`[grammar] model call failed (attempt ${i + 1}):`, String(error?.message || error).slice(0, 200));
        }
    }
    throw lastError || new Error('Grammar model call failed');
};

// Tests swap the model call out.
const setCaller = (fn) => { module.exports.callJson = fn; };

module.exports = { callJson, setCaller, GRAMMAR_MODEL, LESSON_MODEL };

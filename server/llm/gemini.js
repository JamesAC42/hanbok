require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getAnalysisSchema, restoreMaps } = require('./analysisSchema');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const gemini = genAI.getGenerativeModel({
    model: "gemini-flash-lite-latest",
    generationConfig: {
        // Force JSON candidates so sentence analysis does not return
        // markdown / unquoted strings that fail JSON.parse.
        responseMimeType: "application/json",
    },
});

const prompt_gemini = async (text) => {
    const result = await gemini.generateContent(text);
    return result.response.text();
}

// Sentence analysis: a pinned model and a response schema built from the
// prompt's own JSON template (see the "Model test results" section of the LLM
// pipeline review). gemini-3.8-flash scored higher in that comparison but in
// production it generates at ~100-130 tokens/s, so a long sentence takes 30-60 s
// and the analysis page times out. Flash-Lite with the schema is ~3x faster.
// Set GEMINI_ANALYSIS_MODEL=gemini-3.8-flash to switch back.
const ANALYSIS_MODEL = process.env.GEMINI_ANALYSIS_MODEL || "gemini-3.5-flash-lite";
// Flash-Lite runs without thinking by default; 3.8 Flash was tested at "low".
const ANALYSIS_THINKING = process.env.GEMINI_ANALYSIS_THINKING
    || (ANALYSIS_MODEL.includes("lite") ? "default" : "low");
const ANALYSIS_TIMEOUT_MS = 40000;

const analysisModel = genAI.getGenerativeModel({ model: ANALYSIS_MODEL });

const buildAnalysisRequest = (text) => {
    const schemaInfo = getAnalysisSchema(text);
    const generationConfig = { responseMimeType: "application/json" };
    if (schemaInfo) {
        generationConfig.responseJsonSchema = schemaInfo.schema;
    }
    if (ANALYSIS_THINKING && ANALYSIS_THINKING !== "default") {
        generationConfig.thinkingConfig = { thinkingLevel: ANALYSIS_THINKING };
    }
    return {
        request: {
            contents: [{ role: "user", parts: [{ text }] }],
            generationConfig
        },
        mapPaths: schemaInfo ? schemaInfo.mapPaths : []
    };
};

const prompt_gemini_analysis = async (text) => {
    const { request, mapPaths } = buildAnalysisRequest(text);
    const result = await analysisModel.generateContent(request, { timeout: ANALYSIS_TIMEOUT_MS });
    const raw = result.response.text();
    if (mapPaths.length === 0) return raw;

    try {
        return JSON.stringify(restoreMaps(JSON.parse(raw), mapPaths));
    } catch (error) {
        // Let generateResponse's parser and retry loop handle bad output.
        return raw;
    }
}

module.exports = {gemini, prompt_gemini, prompt_gemini_analysis, buildAnalysisRequest, ANALYSIS_MODEL, ANALYSIS_TIMEOUT_MS}

require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

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


module.exports = {gemini, prompt_gemini}

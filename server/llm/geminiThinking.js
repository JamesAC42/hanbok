require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const gemini = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

const prompt_geminiThinking = async (text) => {
    console.log("Thinking with Gemini Flash Latest");
    const result = await gemini.generateContent(text);
    return result.response.text();
}


module.exports = {gemini, prompt_geminiThinking}
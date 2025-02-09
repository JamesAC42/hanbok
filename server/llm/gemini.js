require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const gemini = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const prompt_gemini = async (text) => {

    const result = await gemini.generateContent(text);
    return result.response.text();
}


module.exports = {gemini, prompt_gemini}
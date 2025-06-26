const OpenAI = require("openai");
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const prompt_openai = async (text) => {
    const response = await openai.chat.completions.create({
        model: "gpt-4-turbo-2024-04-09", // Using GPT-4 Turbo latest version
        messages: [
            {role: "user", content: text}
        ]
    });

    return response.choices[0].message.content;
}
module.exports = {openai, prompt_openai};
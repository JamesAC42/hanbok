const OpenAI = require("openai");
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const createChatCompletionPrompt = (model) => async (text) => {
    const response = await openai.chat.completions.create({
        model,
        messages: [
            {role: "user", content: text}
        ]
    });

    return response.choices[0].message.content;
}

const prompt_openai = createChatCompletionPrompt("gpt-4.1");
const prompt_openaiNano = createChatCompletionPrompt("gpt-5.4-nano");

module.exports = {openai, prompt_openai, prompt_openaiNano};

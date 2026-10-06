require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const prompt_anthropic = async (text) => {
    const msg = await anthropic.messages.create({
        model: "claude-sonnet-5-5",

        max_tokens: 4096,
        messages: [{ 
            role: "user", 
            content: text
        }],
    });
    return msg.content.find((block) => block.type === "text")?.text;
}

module.exports = {anthropic, prompt_anthropic};
require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const prompt_anthropic = async (text) => {
    const msg = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",

        max_tokens: 4096,
        messages: [{ 
            role: "user", 
            content: text
        }],
    });
    return msg.content[0].text;
}

module.exports = {anthropic, prompt_anthropic};
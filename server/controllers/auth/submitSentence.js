
const Anthropic = require('@anthropic-ai/sdk');

const generateSpeech = require('../../elevenlabs/generateSpeech');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const submitSentence = async (req, res) => {
    
  const { text } = req.body;
  
  let attempts = 0;
  let maxAttempts = 3;
  let generateSuccess = false;
  try {
    
    let parsedResponse = null
    while(!generateSuccess && attempts < maxAttempts) {

        console.log("generating...");
        const msg = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",

        max_tokens: 4096,
        messages: [{ 
            role: "user", 
            content: ANALYSIS_PROMPT + text
        }],
        });
        try {
            console.log(msg.content[0].text);
            parsedResponse = JSON.parse(msg.content[0].text);
            generateSuccess = true;
        } catch (error) {
            console.error('Error parsing response:', error);
            attempts++;
        }
    }

    if(!generateSuccess) {
        throw new Error("Could not generate valid analysis.");
    }

    if(!parsedResponse.isValid) {
        return res.json({ message: parsedResponse });
    }
    
    // Generate speech audio file right after analysis using the text received
    let voice1_filename = null;
    let voice2_filename = null;

    try {
      const { voice1, voice2 } = await generateSpeech(text);
      voice1_filename = voice1;
      voice2_filename = voice2;


    } catch (speechError) {
      console.error("Speech generation failed:", speechError);
    }

    res.json({ message: parsedResponse, voice1: voice1_filename, voice2: voice2_filename });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      message: {
        isValid: false,
        error: {
          type: "other",
          message: "Failed to analyze the sentence. Please try again."
        }
      }
    });
  }
}

module.exports = submitSentence;
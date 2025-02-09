const generateResponse = require('../../llm/generateResponse');
const generateSpeech = require('../../elevenlabs/generateSpeech');
const {ANALYSIS_PROMPT} = require('../../llm/prompt');

const submitSentence = async (req, res) => {
    
  const { text } = req.body;
  
  try {
    
    let parsedResponse = await generateResponse(ANALYSIS_PROMPT + text, 'gemini');

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
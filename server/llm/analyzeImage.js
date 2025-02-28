require('dotenv').config();
const { EXTRACT_TEXT_PROMPT } = require('./prompt_extractText');
const {openai} = require("./openai");

const analyzeImage = async (imageData, targetLanguage = 'ko') => {

    const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
        throw new Error('Invalid image data format. Expected data URL format: data:image/xxx;base64,...');
    }
    
    //const mimeType = matches[1];
    
    try {
        
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('API call timed out after 6 seconds')), 6000)
        );
        
        const result = await Promise.race([
            openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: EXTRACT_TEXT_PROMPT(targetLanguage)
                            },
                            {
                                type: "image_url",
                                image_url: {url: imageData}
                            }
                        ]
                    }
                ]
            }),
            timeoutPromise
        ]);
        
        return result.choices[0].message.content;
    } catch (error) {
        console.error("Error in API call:", error.message);
        if (error.response) {
            console.error("API Response error:", error.response.data);
            console.error("Status:", error.response.status);
        }
        
        throw error;
    }
}

const extractTextFromImage = async (imageData, targetLanguage = 'ko') => {
    let attempts = 0;
    let maxAttempts = 2;
    let parsedResponse = null;
    while(!parsedResponse && attempts < maxAttempts) {
        try {
            let response = await analyzeImage(imageData, targetLanguage);
            if (response.startsWith('```json') && response.endsWith('```')) {
                response = response.slice(7, -3).trim();
            }

            parsedResponse = JSON.parse(response);
        } catch (error) {
            console.log(error);
            attempts++;
        }
    }

    if(!parsedResponse) {
        throw new Error("Could not generate valid response.");
    }

    return parsedResponse;
}

module.exports = {extractTextFromImage}
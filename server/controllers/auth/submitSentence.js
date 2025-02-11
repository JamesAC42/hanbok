const generateResponse = require('../../llm/generateResponse');
const { generateSpeech, getPresignedUrl } = require('../../elevenlabs/generateSpeech');
const {ANALYSIS_PROMPT} = require('../../llm/prompt');
const { getDb } = require('../../database');

const submitSentence = async (req, res) => {
    const { text } = req.body;
    const userId = req.session.user.userId;
    
    try {
        const db = getDb();
        let parsedResponse = await generateResponse(ANALYSIS_PROMPT + text, 'openai');

        if(!parsedResponse.isValid) {
            return res.json({ message: parsedResponse });
        }

        if(!parsedResponse.analysis) {
            return res.json({ message: {
                isValid: false,
                error: { type: "other", message: "Failed to analyze the sentence. Please try again." }
            } });
        }
        
        // Generate speech audio and get S3 URLs
        let voice1_url = null;
        let voice2_url = null;

        try {
            const { voice1, voice2 } = await generateSpeech(text);
            voice1_url = voice1;
            voice2_url = voice2;
        } catch (speechError) {
            console.error("Speech generation failed:", speechError);
        }

        // Get next sentence ID
        const counterDoc = await db.collection('counters').findOneAndUpdate(
            { _id: 'sentenceId' },
            { $inc: { seq: 1 } },
            { upsert: true, returnDocument: 'after' }
        );

        // Create sentence document
        const sentenceDoc = {
            sentenceId: counterDoc.seq,
            userId: userId,
            text: text,
            analysis: parsedResponse.analysis,
            voice1Key: voice1_url,
            voice2Key: voice2_url,
            dateCreated: new Date()
        };

        // Store in database
        await db.collection('sentences').insertOne(sentenceDoc);

        res.json({ 
            message: parsedResponse, 
            voice1: voice1_url, 
            voice2: voice2_url,
            sentenceId: sentenceDoc.sentenceId
        });
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
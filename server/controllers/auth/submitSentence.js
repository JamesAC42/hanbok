const generateResponse = require('../../llm/generateResponse');
const {ANALYSIS_PROMPT} = require('../../llm/prompt');
const { getDb } = require('../../database');

const submitSentence = async (req, res) => {
    const { text } = req.body;

    if (!text || text.length > 80) {
        return res.json({
            message: {
                isValid: false,
                error: {
                    type: "validation",
                    message: "Text must be between 1 and 80 characters"
                }
            }
        });
    }
    
    try {
        const db = getDb();
        let parsedResponse = await generateResponse(ANALYSIS_PROMPT + text, 'gemini');

        if(!parsedResponse.isValid) {
            return res.json({ message: parsedResponse });
        }

        if(!parsedResponse.analysis) {
            return res.json({ message: {
                isValid: false,
                error: { type: "other", message: "Failed to analyze the sentence. Please try again." }
            } });
        }

        const userId = req.session.user ? req.session.user.userId : null;

        // Get next sentence ID
        const counterDoc = await db.collection('counters').findOneAndUpdate(
            { _id: 'sentenceId' },
            { $inc: { seq: 1 } },
            { upsert: true, returnDocument: 'after' }
        );

        // Create sentence document
        const sentenceDoc = {
            sentenceId: counterDoc.seq,
            userId: userId ? userId : null,
            text: text,
            analysis: parsedResponse.analysis,
            voice1Key: null,
            voice2Key: null,
            dateCreated: new Date()
        };

        // Store in database
        await db.collection('sentences').insertOne(sentenceDoc);

        res.json({ 
            message: parsedResponse,
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
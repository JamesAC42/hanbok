const generateResponse = require('../../llm/generateResponse');
const { SYNONYMS_PROMPT } = require('../../llm/prompt_synonyms');
const { getDb } = require('../../database');

const getWordRelations = async (req, res) => {
    const { word } = req.query;
    const userId = req.session.user.userId;

    if (!word) {
        return res.status(400).json({
            success: false,
            error: {
                type: "validation",
                message: "Word parameter is required"
            }
        });
    }

    try {
        const db = getDb();
        
        // Check user's tier
        const user = await db.collection('users').findOne({ userId });
        
        if (!user || user.tier !== 1) {
            return res.status(403).json({
                success: false,
                error: {
                    type: "subscription",
                    message: "This feature requires a Plus subscription"
                }
            });
        }

        let parsedResponse = await generateResponse(SYNONYMS_PROMPT + word, 'gemini');

        if (!parsedResponse.isValid) {
            return res.json({ 
                success: false,
                error: parsedResponse.error
            });
        }

        res.json({
            success: true,
            synonyms: parsedResponse.synonyms,
            antonyms: parsedResponse.antonyms
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: {
                type: "other",
                message: "Failed to analyze the word. Please try again."
            }
        });
    }
};

module.exports = getWordRelations; 
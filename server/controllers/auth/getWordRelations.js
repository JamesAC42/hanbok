const generateResponse = require('../../llm/generateResponse');
const { SYNONYMS_PROMPT } = require('../../llm/prompt_synonyms');
const { getDb } = require('../../database');

const getWordRelations = async (req, res) => {
    const { word, originalLanguage = 'ko', translationLanguage = 'en' } = req.query;
    const userId = req.session.user.userId;


    console.log(word, originalLanguage, translationLanguage);
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

        let parsedResponse = await generateResponse(
            SYNONYMS_PROMPT(originalLanguage, translationLanguage) + word,
            'gemini'
        );

        if (!parsedResponse.isValid) {
            return res.json({ 
                success: false,
                error: parsedResponse.error
            });
        }

        // Transform the response to use the new schema
        const transformedSynonyms = parsedResponse.synonyms.map(syn => ({
            originalWord: syn.original,
            translatedWord: syn.translation,
            originalLanguage,
            translationLanguage
        }));

        const transformedAntonyms = parsedResponse.antonyms.map(ant => ({
            originalWord: ant.original,
            translatedWord: ant.translation,
            originalLanguage,
            translationLanguage
        }));

        res.json({
            success: true,
            synonyms: transformedSynonyms,
            antonyms: transformedAntonyms
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
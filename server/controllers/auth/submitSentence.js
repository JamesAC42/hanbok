const generateResponse = require('../../llm/generateResponse');
const {ANALYSIS_PROMPT} = require('../../llm/prompt');
const { getDb } = require('../../database');
const SupportedLanguages = require('../../supported_languages');

const submitSentence = async (req, res) => {
    const { text, originalLanguage = 'ko', translationLanguage = 'en' } = req.body;

    //Validate languages are supported
    if (!SupportedLanguages[originalLanguage] || !SupportedLanguages[translationLanguage]) {
        return res.json({
            message: {
                isValid: false,
                error: {
                    type: "validation",
                    message: "Unsupported language combination"
                }
            }
        });
    }

    if (!text || text.length > 120) {
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
        
        // First try to find a sentence with voice keys
        let existingSentence = await db.collection('sentences').findOne({
            text: text,
            originalLanguage: originalLanguage,
            translationLanguage: translationLanguage,
            $or: [
                { voice1Key: { $ne: null } },
                { voice2Key: { $ne: null } }
            ]
        });

        // If no sentence with voice keys found, look for any matching sentence
        if (!existingSentence) {
            existingSentence = await db.collection('sentences').findOne({
                text: text,
                originalLanguage: originalLanguage,
                translationLanguage: translationLanguage
            });
        }

        let analysis;
        let parsedResponse;
        let voice1Key = null;
        let voice2Key = null;

        if (existingSentence) {
            // Reuse existing analysis and voice keys (if they exist)
            analysis = existingSentence.analysis;
            voice1Key = existingSentence.voice1Key || null;
            voice2Key = existingSentence.voice2Key || null;
            if (voice1Key || voice2Key) {
            }
            parsedResponse = {
                isValid: true,
                analysis: analysis
            };
        } else {
            // Generate new analysis
            parsedResponse = await generateResponse(
                ANALYSIS_PROMPT(originalLanguage, translationLanguage) + text, 
                'gemini'
            );

            if(!parsedResponse.isValid) {
                return res.json({ message: parsedResponse });
            }

            if(!parsedResponse.analysis) {
                return res.json({ message: {
                    isValid: false,
                    error: { type: "other", message: "Failed to analyze the sentence. Please try again." }
                } });
            }
            
            analysis = parsedResponse.analysis;
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
            analysis: analysis,
            voice1Key,
            voice2Key,
            originalLanguage,
            translationLanguage,
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
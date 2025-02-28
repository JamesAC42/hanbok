const generateResponse = require('../../llm/generateResponse');
const {ANALYSIS_PROMPT} = require('../../llm/prompt');
const { getDb } = require('../../database');
const SupportedLanguages = require('../../supported_languages');

const { extractTextFromImage } = require('../../llm/analyzeImage');

const isBase64Image = (str) => {
    if (!str || typeof str !== 'string') return false;
    
    const imgRegex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
    return imgRegex.test(str);
};

const submitSentence = async (req, res) => {

    let { text, originalLanguage = 'ko', translationLanguage = 'en' } = req.body;

    const userId = req.session.user ? req.session.user.userId : null;
    const db = getDb();

    // Validate languages are supported
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

    let isImageSubmission = false;
    let user = null;
    console.log(userId);
    if(userId !== null) {
        user = await db.collection('users').findOne({ userId: userId });
    }
    console.log(user);

    const MAX_BASE64_SIZE = 2.7 * 1024 * 1024; // ~2MB after base64 encoding

    // Check if the input is an image in base64 format
    if (isBase64Image(text)) {

        if(!user) {
            return res.json({
                message: {
                    isValid: false,
                    error: { type: "other", message: "Please log in to submit a sentence." }
                }
            });
        }
        
        // Initialize remainingImageExtracts if it doesn't exist
        if (user.remainingImageExtracts === undefined) {
            await db.collection('users').updateOne(
                { userId: userId },
                { $set: { remainingImageExtracts: 20 } }
            );
            user.remainingImageExtracts = 20;
        }

        if(user.tier === 0 && user.remainingImageExtracts <= 0) {
            return res.json({
                message: {
                    isValid: false,
                    error: { type: "other", message: "You have no remaining image extracts. Please upgrade to Plus to continue." }
                }
            });
        }
        isImageSubmission = true;
        
        // Check size of base64 string
        if (text.length > MAX_BASE64_SIZE) {
            return res.json({
                message: {
                    isValid: false,
                    error: {
                        type: "file_too_large",
                        message: "Image file is too large. Maximum size is 2MB."
                    }
                }
            });
        }
        
        try {
            // Extract text from image using LLM or OCR service
            const extractionResult = await extractTextFromImage(text, originalLanguage);
            
            if (!extractionResult.success) {
                console.log(extractionResult.message);
                return res.json({
                    message: {
                        isValid: false,
                        error: {
                            type: "image_processing",
                            message: "Failed to extract text from image"
                        }
                    }
                });
            }
            
            // Replace the base64 image with the extracted text
            text = extractionResult.text;
            
            // Track image extraction usage
            if (userId) {
                await db.collection('feature_usage').updateOne(
                    { userId: userId, feature: 'image_extraction' },
                    { 
                        $inc: { count: 1 },
                        $set: { lastUsed: new Date() },
                        $setOnInsert: { firstUsed: new Date() }
                    },
                    { upsert: true }
                );
            }
            
        } catch (error) {
            console.error('Error extracting text from image:', error);
            return res.json({
                message: {
                    isValid: false,
                    error: {
                        type: "image_processing",
                        message: "Error processing image"
                    }
                }
            });
        }

        if(user.tier === 0) {
            // Decrement the user's remainingImageExtracts after successful extraction
            await db.collection('users').updateOne(
                { userId: userId },
                { $inc: { remainingImageExtracts: -1 } }
            );
        }

    } else {

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
    }

    
    try {
        
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
            dateCreated: new Date(),
            fromImage: isImageSubmission
        };

        // Store in database
        await db.collection('sentences').insertOne(sentenceDoc);

        // Track sentence submission if user is logged in
        if (userId) {
            await db.collection('feature_usage').updateOne(
                { userId: userId, feature: 'sentence_submission' },
                { 
                    $inc: { count: 1 },
                    $set: { lastUsed: new Date() },
                    $setOnInsert: { firstUsed: new Date() }
                },
                { upsert: true }
            );
        }

        res.json({ 
            message: parsedResponse,
            originalLanguage: originalLanguage,
            translationLanguage: translationLanguage,
            sentenceId: sentenceDoc.sentenceId,
            extractedFromImage: isImageSubmission
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
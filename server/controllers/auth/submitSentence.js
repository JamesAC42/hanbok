const generateResponse = require('../../llm/generateResponse');
const basicPrompt = require('../../llm/prompt');
const chinesePrompt = require('../../llm/prompt_chinese');
const japanesePrompt = require('../../llm/prompt_japanese');
const russianPrompt = require('../../llm/prompt_russian');
const { translateText } = require('../../llm/translate');
const { getDb } = require('../../database');
const SupportedLanguages = require('../../supported_languages');
const getPreviousSunday = require('../../utils/getPreviousSunday');

const { extractTextFromImage } = require('../../llm/analyzeImage');

const isBase64Image = (str) => {
    if (!str || typeof str !== 'string') return false;
    
    const imgRegex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
    return imgRegex.test(str);
};

// Check if user has exceeded their rate limit quota
const checkRateLimits = async (req, db) => {
    const userId = req.session.user ? req.session.user.userId : null;
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const weekStartDate = getPreviousSunday();
    
    // Skip rate limiting for paid users
    if (userId !== null) {
        const user = await db.collection('users').findOne({ userId });
        
        // Skip rate limiting for paid users (tier > 0)
        if (user && user.tier > 0) {
            return { 
                hasQuota: true,
                message: null
            };
        }
        
        // Check if free tier user has purchased additional sentence analyses
        if (user) {
            // If remainingSentenceAnalyses is undefined, set it to 0
            if (user.remainingSentenceAnalyses === undefined) {
                await db.collection('users').updateOne(
                    { userId },
                    { $set: { remainingSentenceAnalyses: 0 } }
                );
                user.remainingSentenceAnalyses = 0;
            }
            
            // If user has purchased analyses remaining, use one of those instead of rate limiting
            if (user.remainingSentenceAnalyses > 0) {
                // Decrement the remaining analyses count
                await db.collection('users').updateOne(
                    { userId },
                    { $inc: { remainingSentenceAnalyses: -1 } }
                );
                
                return {
                    hasQuota: true,
                    message: null,
                    usedPurchasedAnalysis: true
                };
            }
        }
    }
    
    // Determine identifier for rate limiting
    const identifier = userId !== null ? userId.toString() : ipAddress;
    const identifierType = userId !== null ? 'userId' : 'ipAddress';
    
    // Get or create rate limit record
    let rateLimitRecord = await db.collection('rate_limits').findOne({ 
        identifier,
        identifierType 
    });
    
    // For logged-in users with no record, check their IP record in case it has usage data
    if (userId !== null && !rateLimitRecord) {
        // New user account with no rate limit record yet
        // Check if we have an IP-based record for this user
        const ipRecord = await db.collection('rate_limits').findOne({ 
            identifier: ipAddress,
            identifierType: 'ipAddress'
        });
        
        if (ipRecord) {
            // Create a new user-based rate limit record using the IP data
            rateLimitRecord = {
                identifier,
                identifierType,
                totalSentences: ipRecord.totalSentences,
                weekSentences: ipRecord.weekSentences,
                weekStartDate: ipRecord.weekStartDate,
                lastUpdated: new Date()
            };
            
            await db.collection('rate_limits').insertOne(rateLimitRecord);
        }
    }
    
    if (!rateLimitRecord) {
        // Create new record if we don't have one yet
        rateLimitRecord = {
            identifier,
            identifierType,
            totalSentences: 0,
            weekSentences: 0,
            weekStartDate,
            lastUpdated: new Date()
        };
        await db.collection('rate_limits').insertOne(rateLimitRecord);
    } else if (rateLimitRecord.weekStartDate < weekStartDate) {
        // Reset weekly counter if we're in a new week
        await db.collection('rate_limits').updateOne(
            { identifier, identifierType },
            { 
                $set: { 
                    weekSentences: 0, 
                    weekStartDate, 
                    lastUpdated: new Date()
                }
            }
        );
        rateLimitRecord.weekSentences = 0;
        rateLimitRecord.weekStartDate = weekStartDate;
    }
    
    // Check if user has exceeded the weekly quota
    const WEEKLY_QUOTA = 30;
    const hasQuota = rateLimitRecord.weekSentences < WEEKLY_QUOTA;
    
    // Create appropriate message for quota exceeded
    const message = hasQuota ? null : {
        type: 'rate_limit_exceeded',
        message: 'You have used all 30 of your free weekly sentence analyses. Upgrade to Premium for unlimited analyses or purchase 100 additional analyses for $1.',
        remaining: 0
    };
    
    return {
        hasQuota,
        message,
        rateLimitRecord
    };
};

// Update rate limits after successful sentence generation and check for new notifications
const incrementRateLimitsAndCheckNotifications = async (identifier, identifierType, db, usedPurchasedAnalysis = false) => {
    // If the user used a purchased analysis, don't increment rate limits
    if (usedPurchasedAnalysis) {
        return null;
    }
    
    // First increment the counters
    await db.collection('rate_limits').updateOne(
        { identifier, identifierType },
        { 
            $inc: { 
                totalSentences: 1,
                weekSentences: 1
            },
            $set: { lastUpdated: new Date() }
        }
    );
    
    // Then get the updated record to check thresholds
    const updatedRecord = await db.collection('rate_limits').findOne({ identifier, identifierType });
    if (!updatedRecord) return null;
    
    // Check if we've hit any notification thresholds
    const WEEKLY_QUOTA = 30;
    const remaining = WEEKLY_QUOTA - updatedRecord.weekSentences;
    let notification = null;
    
    // Simply check the current values against our thresholds
    if (updatedRecord.weekSentences === 5) {
        notification = {
            type: 'firstFiveUsed',
            message: 'You have used 5 out of your 30 free weekly sentence analyses. Consider upgrading to Premium for unlimited analyses.',
            remaining: remaining,
            weekSentencesUsed: updatedRecord.weekSentences,
            weekSentencesTotal: WEEKLY_QUOTA,
            weekSentencesRemaining: remaining
        };
    } else if (remaining === 15) {
        notification = {
            type: 'fifteenRemaining',
            message: 'You have 15 sentence analyses remaining for this week. Upgrade to Premium for unlimited analyses.',
            remaining: remaining,
            weekSentencesUsed: updatedRecord.weekSentences,
            weekSentencesTotal: WEEKLY_QUOTA,
            weekSentencesRemaining: remaining
        };
    } else if (remaining === 5) {
        notification = {
            type: 'fiveRemaining',
            message: 'You only have 5 sentence analyses remaining for this week. Upgrade to Premium or purchase additional analyses.',
            remaining: remaining,
            weekSentencesUsed: updatedRecord.weekSentences,
            weekSentencesTotal: WEEKLY_QUOTA,
            weekSentencesRemaining: remaining
        };
    }
    
    return notification;
};

const submitSentence = async (req, res) => {

    let { text, originalLanguage = 'ko', translationLanguage = 'en', translate = false, translationContext = '' } = req.body;

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

    // Handle translation mode
    if (translate === true && !text) {
        return res.json({   
            message: {
                isValid: false,
                error: {
                    type: "validation",
                    message: "Text is required for translation"
                }
            }
        });
    }

    if (translate === true) {
        // Validate translation context
        if (typeof translationContext !== 'string') {
            return res.json({
                message: {
                    isValid: false,
                    error: {
                        type: "validation",
                        message: "Translation context must be a string"
                    }
                }
            });
        }

        if (translationContext.length > 100) {
            return res.json({
                message: {
                    isValid: false,
                    error: {
                        type: "validation",
                        message: "Translation context must be 100 characters or less"
                    }
                }
            });
        }

        try {
            // Translate text from translationLanguage to originalLanguage
            const translationResult = await translateText(
                text, 
                translationLanguage, // Original language is actually the translation language
                originalLanguage,    // Target language is the original language we want to analyze
                translationContext
            );

            if (!translationResult.isValid) {
                return res.json({
                    message: {
                        isValid: false,
                        error: {
                            type: "translation_error",
                            message: translationResult.error?.message || "Failed to translate the text"
                        }
                    }
                });
            }

            // Use the translated text for further processing
            text = translationResult.translation;
        } catch (error) {
            console.error('Error translating text:', error);
            return res.json({
                message: {
                    isValid: false,
                    error: {
                        type: "translation_error",
                        message: "Failed to translate the text"
                    }
                }
            });
        }
    }

    let isImageSubmission = false;
    let user = null;
    
    if(userId !== null) {
        user = await db.collection('users').findOne({ userId: userId });
    }
    
    // Initialize rate limit check with defaults for paid users
    let rateLimitCheck = {
        hasQuota: true,
        notification: null
    };
    
    // Check rate limits for free users and non-logged in users
    if(!user || user.tier === 0) {
        rateLimitCheck = await checkRateLimits(req, db);
        if (!rateLimitCheck.hasQuota) {
            return res.json({
                message: {
                    isValid: false,
                    error: rateLimitCheck.message
                }
            });
        }
    }

    const MAX_BASE64_SIZE = 2.7 * 1024 * 1024; // ~2MB after base64 encoding

    // Check if the input is an image in base64 format
    if (!translate && isBase64Image(text)) {

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

        if((user.tier === 0 || user.tier === 1) && user.remainingImageExtracts <= 0) {
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

        if(user.tier === 0 || user.tier === 1) {
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

            let prompt = basicPrompt.ANALYSIS_PROMPT;
            if(originalLanguage === 'zh') {
                prompt = chinesePrompt.ANALYSIS_PROMPT;
            } else if(originalLanguage === 'ja') {
                prompt = japanesePrompt.ANALYSIS_PROMPT;
            } else if(originalLanguage === 'ru') {
                prompt = russianPrompt.ANALYSIS_PROMPT;
            }

            // Generate new analysis
            parsedResponse = await generateResponse(
                prompt(originalLanguage, translationLanguage) + text, 
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

        // Initialize notification variable
        let notification = null;
        
        // Increment rate limit counter for non-premium users only
        if (!user || user.tier === 0) {
            const identifier = userId !== null ? userId.toString() : (req.headers['x-forwarded-for'] || req.socket.remoteAddress);
            const identifierType = userId !== null ? 'userId' : 'ipAddress';
            // Increment counters and check for new notifications
            notification = await incrementRateLimitsAndCheckNotifications(identifier, identifierType, db, rateLimitCheck.usedPurchasedAnalysis);
        }

        // Include rate limit notification if applicable
        const rateLimit = notification ? {
            notification: notification
        } : {};

        // Include if this request used a purchased analysis
        const analysisUsage = rateLimitCheck.usedPurchasedAnalysis ? {
            usedPurchasedAnalysis: true
        } : {};

        // For non-premium users, get the current rate limit information to return
        let weeklyQuotaInfo = {};
        if (!user || user.tier === 0) {
            const identifier = userId !== null ? userId.toString() : (req.headers['x-forwarded-for'] || req.socket.remoteAddress);
            const identifierType = userId !== null ? 'userId' : 'ipAddress';
            const currentRecord = await db.collection('rate_limits').findOne({ identifier, identifierType });
            
            if (currentRecord) {
                const WEEKLY_QUOTA = 30;
                const remaining = WEEKLY_QUOTA - currentRecord.weekSentences;
                
                weeklyQuotaInfo = {
                    weeklyQuota: {
                        weekSentencesUsed: currentRecord.weekSentences,
                        weekSentencesTotal: WEEKLY_QUOTA,
                        weekSentencesRemaining: remaining
                    }
                };
            }
        }

        // Include translation information if translation was used
        const translationInfo = translate ? {
            wasTranslated: true,
            originalText: req.body.text, // The text before translation
        } : {};

        res.json({ 
            message: parsedResponse,
            originalLanguage: originalLanguage,
            translationLanguage: translationLanguage,
            sentenceId: sentenceDoc.sentenceId,
            extractedFromImage: isImageSubmission,
            ...rateLimit,
            ...analysisUsage,
            ...weeklyQuotaInfo,
            ...translationInfo
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
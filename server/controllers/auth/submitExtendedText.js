const { getDb } = require('../../database');
const SupportedLanguages = require('../../supported_languages');
const { checkExtendedTextRateLimits } = require('./extendedTextRateLimits');

// Split text into sentences (simple approach - can be improved)
const splitIntoSentences = (text) => {
    // Simple sentence splitting by common delimiters
    // This handles periods, question marks, exclamation marks
    // Can be made more sophisticated if needed
    const sentences = text
        .split(/([.!?。！？]+[\s\n]+)/)
        .reduce((acc, part, idx, arr) => {
            if (idx % 2 === 0 && part.trim()) {
                const delimiter = arr[idx + 1] || '';
                acc.push((part + delimiter).trim());
            }
            return acc;
        }, [])
        .filter((s) => s.length > 0);

    return sentences;
};

const submitExtendedText = async (req, res) => {
    let { text, originalLanguage = 'ko', translationLanguage = 'en', title = null } = req.body;

    const userId = req.session.user ? req.session.user.userId : null;

    // Require login for extended text analysis
    if (!userId) {
        return res.json({
            message: {
                isValid: false,
                error: {
                    type: 'authentication',
                    message: 'Please log in to use extended text analysis'
                }
            }
        });
    }

    const db = getDb();

    // Validate languages are supported
    if (!SupportedLanguages[originalLanguage] || !SupportedLanguages[translationLanguage]) {
        return res.json({
            message: {
                isValid: false,
                error: {
                    type: 'validation',
                    message: 'Unsupported language combination'
                }
            }
        });
    }

    // Validate text
    if (!text || typeof text !== 'string') {
        return res.json({
            message: {
                isValid: false,
                error: {
                    type: 'validation',
                    message: 'Text is required'
                }
            }
        });
    }

    text = text.trim();

    // Ensure title is stored as null or trimmed string
    if (title && typeof title === 'string') {
        title = title.trim();
        if (title.length === 0) {
            title = null;
        }
    } else {
        title = null;
    }

    // Split text into sentences
    const sentences = splitIntoSentences(text);

    if (sentences.length === 0) {
        return res.json({
            message: {
                isValid: false,
                error: {
                    type: 'validation',
                    message: 'No valid sentences found in text'
                }
            }
        });
    }

    if (sentences.length === 1) {
        return res.json({
            message: {
                isValid: false,
                error: {
                    type: 'validation',
                    message: 'Text must contain at least 2 sentences. For single sentences, use the regular sentence analyzer.'
                }
            }
        });
    }

    try {
        const user = await db.collection('users').findOne({ userId });

        if (!user) {
            return res.json({
                message: {
                    isValid: false,
                    error: {
                        type: 'authentication',
                        message: 'Please log in to use extended text analysis'
                    }
                }
            });
        }

        const tierCharacterLimits = {
            0: 500,
            1: 2000,
            2: 5000
        };

        const maxCharacters = tierCharacterLimits[user.tier] ?? tierCharacterLimits[0];
        if (text.length > maxCharacters) {
            return res.json({
                message: {
                    isValid: false,
                    error: {
                        type: 'validation',
                        message: `Text must be ${maxCharacters} characters or less for your current plan`
                    }
                }
            });
        }

        // Check rate limits for free users
        const rateLimitCheck = await checkExtendedTextRateLimits(req, db, { user });
        if (!rateLimitCheck.hasQuota) {
            return res.json({
                message: {
                    isValid: false,
                    error: rateLimitCheck.message
                }
            });
        }

        const createdAt = new Date();

        // Create job ID
        const jobCounterDoc = await db.collection('counters').findOneAndUpdate(
            { _id: 'extendedTextJobId' },
            { $inc: { seq: 1 } },
            { upsert: true, returnDocument: 'after' }
        );
        const jobId = jobCounterDoc.seq;

        // Reserve extended text ID up front so we can reference it in progress updates
        const textCounterDoc = await db.collection('counters').findOneAndUpdate(
            { _id: 'textId' },
            { $inc: { seq: 1 } },
            { upsert: true, returnDocument: 'after' }
        );
        const textId = textCounterDoc.seq;

        const jobDoc = {
            jobId,
            textId,
            userId,
            text,
            sentences,
            sentenceCount: sentences.length,
            originalLanguage,
            translationLanguage,
            title,
            status: 'pending',
            processedSentences: 0,
            error: null,
            createdAt,
            updatedAt: createdAt,
            requiresRateLimitUpdate: user && user.tier === 0,
            weeklyQuota: null
        };

        await db.collection('extended_text_jobs').insertOne(jobDoc);

        return res.json({
            message: {
                isValid: true,
                status: 'queued'
            },
            jobId,
            textId,
            sentenceCount: sentences.length
        });
    } catch (error) {
        console.error('Error creating extended text job:', error);
        return res.status(500).json({
            message: {
                isValid: false,
                error: {
                    type: 'other',
                    message: 'Failed to start the extended text analysis. Please try again.'
                }
            }
        });
    }
};

module.exports = submitExtendedText;

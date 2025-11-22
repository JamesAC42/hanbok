const bcrypt = require('bcrypt');
const { getDb } = require('../../database');
const polyfillData = require('../../migrations/user_polyfill');
const getPreviousSunday = require('../../utils/getPreviousSunday');
const { FREE_TIER_WEEKLY_ANALYSIS_LIMIT } = require('./extendedTextRateLimits');

const loginEmail = async (req, res, redisClient) => {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email and password are required'
        });
    }

    try {
        const db = getDb();
        const usersCollection = db.collection('users');

        // Find user by email
        let user = await usersCollection.findOne({ 
            email: email.toLowerCase() 
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if this is an email/password user (not OAuth)
        if (!user.password) {
            return res.status(401).json({
                success: false,
                message: 'This account was created with Google. Please sign in with Google.'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if user is verified
        if (!user.verified) {
            return res.status(403).json({
                success: false,
                message: 'Please verify your email address before signing in. Check your inbox for the verification email.',
                requiresVerification: true
            });
        }

        // Apply polyfill data
        try {
            user = await polyfillData(user, db);
        } catch (polyfillError) {
            console.error('Error during user data polyfill:', polyfillError);
            // Continue with login process even if polyfill fails
        }

        // Set session
        req.session.user = { userId: user.userId };

        console.log("Set session user to", user.userId);

        // For free users, get their rate limit information
        let weekSentencesUsed = 0;
        let weekSentencesTotal = 10; // Default weekly quota
        let weekSentencesRemaining = weekSentencesTotal;
        let weekExtendedTextUsed = 0;
        let weekExtendedTextTotal = user.tier === 0 ? FREE_TIER_WEEKLY_ANALYSIS_LIMIT : null;
        let weekExtendedTextRemaining = weekExtendedTextTotal;
        
        if (user.tier === 0) {
            const userId = user.userId.toString();
            const weekStartDate = getPreviousSunday();
            
            // Get user's rate limit record
            let rateLimitRecord = await db.collection('rate_limits').findOne({ 
                identifier: userId,
                identifierType: 'userId'
            });
            
            if (rateLimitRecord) {
                // Check if we need to reset the weekly counter for a new week
                if (rateLimitRecord.weekStartDate < weekStartDate) {
                    // Reset weekly counter if we're in a new week
                    await db.collection('rate_limits').updateOne(
                        { identifier: userId, identifierType: 'userId' },
                        { 
                            $set: { 
                                weekSentences: 0, 
                                weekExtendedTextAnalyses: 0,
                                weekStartDate, 
                                lastUpdated: new Date()
                            }
                        }
                    );
                    weekSentencesUsed = 0;
                    weekExtendedTextUsed = 0;
                    rateLimitRecord.weekExtendedTextAnalyses = 0;
                } else {
                    weekSentencesUsed = rateLimitRecord.weekSentences;
                    if (rateLimitRecord.weekExtendedTextAnalyses === undefined) {
                        weekExtendedTextUsed = 0;
                    } else {
                        weekExtendedTextUsed = rateLimitRecord.weekExtendedTextAnalyses;
                    }
                }
            } else {
                // Ensure we have a baseline record for future tracking
                await db.collection('rate_limits').insertOne({
                    identifier: userId,
                    identifierType: 'userId',
                    totalSentences: 0,
                    weekSentences: 0,
                    weekStartDate,
                    weekExtendedTextAnalyses: 0,
                    totalExtendedTextAnalyses: 0,
                    lastUpdated: new Date()
                });
                weekSentencesUsed = 0;
                weekExtendedTextUsed = 0;
            }
            
            weekSentencesRemaining = weekSentencesTotal - weekSentencesUsed;
            weekExtendedTextRemaining = Math.max((weekExtendedTextTotal || 0) - weekExtendedTextUsed, 0);
        } else {
            weekExtendedTextTotal = null;
            weekExtendedTextRemaining = null;
        }

        res.status(200).json({
            success: true,
            user: {
                userId: user.userId,
                name: user.name,
                email: user.email,
                dateCreated: user.dateCreated,
                tier: user.tier,
                verified: user.verified,
                remainingAudioGenerations: user.remainingAudioGenerations,
                maxSavedSentences: user.maxSavedSentences,
                maxSavedWords: user.maxSavedWords,
                feedbackAudioCreditRedeemed: user.feedbackAudioCreditRedeemed || false,
                remainingImageExtracts: user.remainingImageExtracts,
                remainingSentenceAnalyses: user.remainingSentenceAnalyses || 0,
                hasUsedFreeTrial: user.hasUsedFreeTrial || false,
                weekSentencesUsed,
                weekSentencesTotal,
                weekSentencesRemaining,
                weekExtendedTextUsed,
                weekExtendedTextTotal,
                weekExtendedTextRemaining
            }
        });

    } catch (error) {
        console.error('Email login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.'
        });
    }
};

module.exports = loginEmail; 
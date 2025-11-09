const { getDb } = require('../../database');
const polyfillData = require('../../migrations/user_polyfill');
const getPreviousSunday = require('../../utils/getPreviousSunday');
const { FREE_TIER_WEEKLY_ANALYSIS_LIMIT } = require('./extendedTextRateLimits');

const getSession = async (req, res) => {
    
    if (!req.session.user) {
        return res.status(401).json({ 
            success: false,
            message: 'No active session'
        });
    }

    try {
        const db = getDb();
        let user = await db.collection('users').findOne(
            { userId: req.session.user.userId }
        );

        if (!user) {
            req.session.destroy();
            return res.status(401).json({ 
                success: false,
                message: 'Invalid session'
            });
        }

        user = await polyfillData(user, db);

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
                        { identifier: userId },
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

        let userData = {
            userId: user.userId,
            name: user.name,
            email: user.email,
            dateCreated: user.dateCreated,
            tier: user.tier,
            verified: user.verified !== undefined ? user.verified : true, // Default to true for existing users
            remainingAudioGenerations: user.remainingAudioGenerations ? user.remainingAudioGenerations : 0,
            maxSavedSentences: user.maxSavedSentences ? user.maxSavedSentences : 0,
            maxSavedWords: user.maxSavedWords ? user.maxSavedWords : 0,
            feedbackAudioCreditRedeemed: user.feedbackAudioCreditRedeemed || false,
            remainingImageExtracts: user.remainingImageExtracts ? user.remainingImageExtracts : 0,
            remainingSentenceAnalyses: user.remainingSentenceAnalyses ? user.remainingSentenceAnalyses : 0,
            hasUsedFreeTrial: user.hasUsedFreeTrial || false,
            weekSentencesUsed,
            weekSentencesTotal,
            weekSentencesRemaining,
            weekExtendedTextUsed,
            weekExtendedTextTotal,
            weekExtendedTextRemaining
        };

        res.json({
            success: true,
            user: userData
        });

    } catch (error) {
        console.error('Session retrieval error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to retrieve session'
        });
    }
};

module.exports = getSession;

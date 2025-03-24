const { getDb } = require('../../database');
const polyfillData = require('../../migrations/user_polyfill');
const getPreviousSunday = require('../../utils/getPreviousSunday');

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
        let weekSentencesTotal = 30; // Default weekly quota
        let weekSentencesRemaining = weekSentencesTotal;
        
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
                                weekStartDate, 
                                lastUpdated: new Date()
                            }
                        }
                    );
                    weekSentencesUsed = 0;
                } else {
                    weekSentencesUsed = rateLimitRecord.weekSentences;
                }
            }
            
            weekSentencesRemaining = weekSentencesTotal - weekSentencesUsed;
        }

        let userData = {
            userId: user.userId,
            name: user.name,
            email: user.email,
            dateCreated: user.dateCreated,
            tier: user.tier,
            remainingAudioGenerations: user.remainingAudioGenerations ? user.remainingAudioGenerations : 0,
            maxSavedSentences: user.maxSavedSentences ? user.maxSavedSentences : 0,
            maxSavedWords: user.maxSavedWords ? user.maxSavedWords : 0,
            feedbackAudioCreditRedeemed: user.feedbackAudioCreditRedeemed || false,
            remainingImageExtracts: user.remainingImageExtracts ? user.remainingImageExtracts : 0,
            remainingSentenceAnalyses: user.remainingSentenceAnalyses ? user.remainingSentenceAnalyses : 0,
            weekSentencesUsed,
            weekSentencesTotal,
            weekSentencesRemaining
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

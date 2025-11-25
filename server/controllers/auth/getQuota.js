const { getDb } = require('../../database');
const getPreviousSunday = require('../../utils/getPreviousSunday');

const getQuota = async (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.userId : null;
        const db = getDb();
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const weekStartDate = getPreviousSunday();
        
        // Default response structure
        let response = {
            isPremium: false,
            remainingDaily: null, // Not currently used but good for future
            remainingWeekly: 10, // Default for free users
            totalWeekly: 10,
            usedPurchasedAnalysis: false,
            remainingPurchased: 0
        };

        // Check if user is logged in
        if (userId !== null) {
            const user = await db.collection('users').findOne({ userId });
            
            // Check if user is premium (tier > 0)
            if (user && user.tier > 0) {
                response.isPremium = true;
                response.remainingWeekly = -1; // -1 indicates unlimited
                return res.json(response);
            }
            
            // Get purchased analyses
            if (user && user.remainingSentenceAnalyses > 0) {
                response.remainingPurchased = user.remainingSentenceAnalyses;
            }
        }
        
        // Determine identifier for rate limiting
        const identifier = userId !== null ? userId.toString() : ipAddress;
        const identifierType = userId !== null ? 'userId' : 'ipAddress';
        
        // Get rate limit record
        let rateLimitRecord = await db.collection('rate_limits').findOne({ 
            identifier,
            identifierType 
        });
        
        // For logged-in users with no record, check their IP record in case it has usage data
        // This mirrors the logic in submitSentence to show consistent data
        if (userId !== null && !rateLimitRecord) {
            const ipRecord = await db.collection('rate_limits').findOne({ 
                identifier: ipAddress,
                identifierType: 'ipAddress'
            });
            
            if (ipRecord) {
                 rateLimitRecord = ipRecord;
            }
        }
        
        const WEEKLY_QUOTA = 10;

        if (!rateLimitRecord) {
            // No record means full quota
            response.remainingWeekly = WEEKLY_QUOTA;
        } else if (rateLimitRecord.weekStartDate < weekStartDate) {
             // Record exists but is from previous week -> effectively full quota
             response.remainingWeekly = WEEKLY_QUOTA;
        } else {
            // Current week record
            response.remainingWeekly = Math.max(0, WEEKLY_QUOTA - rateLimitRecord.weekSentences);
        }

        res.json(response);

    } catch (error) {
        console.error('Error getting quota:', error);
        res.status(500).json({ message: 'Failed to retrieve quota information' });
    }
};

module.exports = getQuota;


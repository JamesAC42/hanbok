require('dotenv').config();
const { OAuth2Client } = require('google-auth-library');
const { getDb } = require('../../database');
const polyfillData = require('../../migrations/user_polyfill');
const getPreviousSunday = require('../../utils/getPreviousSunday');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const login = async (req, res, redisClient) => {
    const { token } = req.body;
    if (!token) {
        return res.status(500).send({ success: false, message: "Invalid token" });
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        
        const googleId = payload['sub'];
        const email = payload['email'].toLowerCase();
        const name = payload['name'];

        const db = getDb();
        const usersCollection = db.collection('users');

        // Find existing user
        let user = await usersCollection.findOne({ email });

        if (!user) {
            // Get the next user ID
            const counterDoc = await db.collection('counters').findOneAndUpdate(
                { _id: 'userId' },
                { $inc: { seq: 1 } },
                { upsert: true, returnDocument: 'after' }
            );

            // Create new user
            user = {
                userId: counterDoc.seq,
                name,
                email,
                googleId,
                dateCreated: new Date(),
                tier: 0,
                remainingAudioGenerations: 10,
                maxSavedSentences:30,
                maxSavedWords:60,
                feedbackAudioCreditRedeemed: false,
                remainingImageExtracts: 20,
                remainingSentenceAnalyses: 0
            };

            await usersCollection.insertOne(user);
            
            // Check if we have rate limit data for this IP and migrate it to the new user account
            const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            const existingIpRateLimit = await db.collection('rate_limits').findOne({ 
                identifier: ipAddress,
                identifierType: 'ipAddress'
            });

            console.log("existingIpRateLimit", existingIpRateLimit);
            
            if (existingIpRateLimit) {
                // Create a new rate limit record for the user based on their IP usage
                const userRateLimit = {
                    identifier: user.userId.toString(),
                    identifierType: 'userId',
                    totalSentences: existingIpRateLimit.totalSentences,
                    weekSentences: existingIpRateLimit.weekSentences,
                    weekStartDate: existingIpRateLimit.weekStartDate,
                    lastUpdated: new Date()
                };
                
                await db.collection('rate_limits').insertOne(userRateLimit);
            }
        } else {
            try {
                user = await polyfillData(user, db);
            } catch (polyfillError) {
                console.error('Error during user data polyfill:', polyfillError);
                // Continue with the login process even if polyfill fails
                // This ensures users can still log in even if there's a schema validation issue
            }
        }

        req.session.user = { userId: user.userId };

        console.log("set session user to ", user.userId);

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
                        { identifier: userId, identifierType: 'userId' },
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

        res.status(200).json({
            success: true,
            user: {
                userId: user.userId,
                name: user.name,
                email: user.email,
                dateCreated: user.dateCreated,
                tier: user.tier,
                remainingAudioGenerations: user.remainingAudioGenerations,
                maxSavedSentences: user.maxSavedSentences,
                maxSavedWords: user.maxSavedWords,
                feedbackAudioCreditRedeemed: user.feedbackAudioCreditRedeemed || false,
                remainingImageExtracts: user.remainingImageExtracts,
                remainingSentenceAnalyses: user.remainingSentenceAnalyses || 0,
                weekSentencesUsed,
                weekSentencesTotal,
                weekSentencesRemaining
            }
        });

    } catch (error) {
        console.error('Error verifying Google token:', error);
        res.status(401).json({ message: 'Authentication failed' });
    }
}

module.exports = login;
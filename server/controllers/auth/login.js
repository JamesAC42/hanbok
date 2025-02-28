require('dotenv').config();
const { OAuth2Client } = require('google-auth-library');
const { getDb } = require('../../database');
const polyfillData = require('../../migrations/user_polyfill');

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
                remainingImageExtracts: 20
            };

            await usersCollection.insertOne(user);
        } else {
            user = await polyfillData(user, db);
        }

        req.session.user = { userId: user.userId };

        console.log("set session user to ", user.userId);

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
                remainingImageExtracts: user.remainingImageExtracts
            }
        });

    } catch (error) {
        console.error('Error verifying Google token:', error);
        res.status(401).json({ message: 'Authentication failed' });
    }
}

module.exports = login;
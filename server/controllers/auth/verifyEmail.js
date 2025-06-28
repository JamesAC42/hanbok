const { getDb } = require('../../database');

const verifyEmail = async (req, res, redisClient) => {
    const { code } = req.params;

    if (!code) {
        return res.status(400).json({
            success: false,
            message: 'Verification code is required'
        });
    }

    try {
        const db = getDb();
        const usersCollection = db.collection('users');

        // Get email associated with verification code from Redis
        const verificationKey = `verification:${code}`;
        const email = await redisClient.get(verificationKey);

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification code. Please request a new verification email.'
            });
        }

        // Find user by email
        const user = await usersCollection.findOne({ 
            email: email.toLowerCase() 
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is already verified
        if (user.verified) {
            // Clean up the verification code
            await redisClient.del(verificationKey);
            return res.status(200).json({
                success: true,
                message: 'Email is already verified'
            });
        }

        // Mark user as verified
        await usersCollection.updateOne(
            { email: email.toLowerCase() },
            { $set: { verified: true } }
        );

        // Clean up the verification code from Redis
        await redisClient.del(verificationKey);

        res.status(200).json({
            success: true,
            message: 'Email verified successfully! You can now sign in to your account.'
        });

    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Verification failed. Please try again.'
        });
    }
};

module.exports = verifyEmail; 
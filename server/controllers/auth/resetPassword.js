const { getDb } = require('../../database');
const bcrypt = require('bcrypt');

const resetPassword = async (req, res, redisClient) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Token and new password are required'
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long'
            });
        }

        const redisKey = `password_reset:${token}`;
        
        // Get token data from Redis
        const tokenData = await redisClient.get(redisKey);
        
        if (!tokenData) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        let parsedTokenData;
        try {
            parsedTokenData = JSON.parse(tokenData);
        } catch (parseError) {
            console.error('Error parsing token data:', parseError);
            return res.status(400).json({
                success: false,
                message: 'Invalid reset token'
            });
        }

        const { userId, email } = parsedTokenData;

        const db = getDb();

        // Verify user still exists and is an email/password user
        const user = await db.collection('users').findOne({ 
            userId: userId,
            email: email,
            googleId: null, // Must be email/password user
            password: { $ne: null } // Must have password set
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'User not found or invalid account type'
            });
        }

        // Hash the new password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update user's password
        await db.collection('users').updateOne(
            { userId: userId },
            { 
                $set: { 
                    password: hashedPassword,
                    // Update verified status to true since they proved email ownership
                    verified: true
                } 
            }
        );

        // Delete the reset token from Redis
        await redisClient.del(redisKey);

        console.log(`Password reset completed for user: ${email}`);

        res.json({
            success: true,
            message: 'Password reset successfully. You can now log in with your new password.'
        });

    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while resetting your password. Please try again.'
        });
    }
};

module.exports = resetPassword; 
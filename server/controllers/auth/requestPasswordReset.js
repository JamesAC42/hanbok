const { getDb } = require('../../database');
const { v4: uuidv4 } = require('uuid');
const { sendPasswordResetEmail } = require('../../utils/emailService');

const requestPasswordReset = async (req, res, redisClient) => {
    try {
        const { email } = req.body;

        if (!email || !email.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        
        // Validate email format
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid email address'
            });
        }

        const db = getDb();

        // Check if user exists and is an email/password user (not OAuth)
        const user = await db.collection('users').findOne({ 
            email: normalizedEmail,
            googleId: null, // Only allow password reset for email/password users
            password: { $ne: null } // Must have a password set
        });

        // Always return the same message for security (don't reveal if email exists)
        const genericMessage = 'If you have an account with this email, you should receive a password reset link soon.';

        if (user) {
            // Generate reset token
            const resetToken = uuidv4();
            const redisKey = `password_reset:${resetToken}`;
            
            // Store in Redis with 1 hour expiry
            await redisClient.setEx(redisKey, 3600, JSON.stringify({
                userId: user.userId,
                email: user.email,
                timestamp: new Date().toISOString()
            }));

            // Send password reset email
            try {
                await sendPasswordResetEmail(user.email, user.name, resetToken);
                console.log(`Password reset email sent to ${user.email}`);
            } catch (emailError) {
                console.error('Failed to send password reset email:', emailError);
                // Don't reveal email sending failure to client for security
            }
        } else {
            console.log(`Password reset requested for non-existent or OAuth user: ${normalizedEmail}`);
        }

        // Always return success with generic message
        res.json({
            success: true,
            message: genericMessage
        });

    } catch (error) {
        console.error('Password reset request error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred. Please try again later.'
        });
    }
};

module.exports = requestPasswordReset; 
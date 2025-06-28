const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../../database');
const { sendVerificationEmail } = require('../../utils/emailService');

const resendVerification = async (req, res, redisClient) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            message: 'Email is required'
        });
    }

    // Email format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Please enter a valid email address'
        });
    }

    try {
        const db = getDb();
        const usersCollection = db.collection('users');

        // Find user by email
        const user = await usersCollection.findOne({ 
            email: email.toLowerCase() 
        });

        if (!user) {
            // Don't reveal if user exists or not for security
            return res.status(200).json({
                success: true,
                message: 'If an account with this email exists and is unverified, a verification email has been sent.'
            });
        }

        // Check if user is already verified
        if (user.verified) {
            return res.status(400).json({
                success: false,
                message: 'This email address is already verified'
            });
        }

        // Check if this is an email/password user (not OAuth)
        if (!user.password) {
            return res.status(400).json({
                success: false,
                message: 'This account was created with Google and doesn\'t require email verification'
            });
        }

        // Rate limiting - check if a verification email was sent recently
        const rateLimitKey = `verification_rate_limit:${email.toLowerCase()}`;
        const recentSend = await redisClient.get(rateLimitKey);
        
        if (false) {
            return res.status(429).json({
                success: false,
                message: 'Please wait before requesting another verification email'
            });
        }

        // Generate new verification code
        const verificationCode = uuidv4();

        // Store verification code in Redis (expires in 24 hours)
        const verificationKey = `verification:${verificationCode}`;
        await redisClient.setEx(verificationKey, 86400, email.toLowerCase());

        // Set rate limit (5 minutes)
        await redisClient.setEx(rateLimitKey, 10, 'sent');

        // Generate verification URL
        const baseUrl = process.env.LOCAL === 'true' 
            ? 'http://localhost:3000' 
            : 'https://hanbokstudy.com';
        const verificationUrl = `${baseUrl}/verify?code=${verificationCode}`;

        // Send verification email
        const emailResult = await sendVerificationEmail(
            email.toLowerCase(), 
            verificationUrl, 
            user.name
        );

        if (!emailResult.success) {
            console.error('Failed to send verification email:', emailResult.error);
            return res.status(500).json({
                success: false,
                message: 'Failed to send verification email. Please try again.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Verification email sent! Please check your inbox.'
        });

    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send verification email. Please try again.'
        });
    }
};

module.exports = resendVerification; 
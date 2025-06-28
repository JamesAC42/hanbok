const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../../database');
const { sendVerificationEmail } = require('../../utils/emailService');
const polyfillData = require('../../migrations/user_polyfill');

const register = async (req, res, redisClient) => {
    const { email, password, name } = req.body;

    // Basic validation
    if (!email || !password || !name) {
        return res.status(400).json({
            success: false,
            message: 'Email, password, and name are required'
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

    // Password validation
    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 6 characters long'
        });
    }

    // Name validation
    if (name.length < 2 || name.length > 50) {
        return res.status(400).json({
            success: false,
            message: 'Name must be between 2 and 50 characters'
        });
    }

    try {
        const db = getDb();
        const usersCollection = db.collection('users');

        // Check if user with this email already exists
        const existingUser = await usersCollection.findOne({ 
            email: email.toLowerCase() 
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists'
            });
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Get the next user ID
        const counterDoc = await db.collection('counters').findOneAndUpdate(
            { _id: 'userId' },
            { $inc: { seq: 1 } },
            { upsert: true, returnDocument: 'after' }
        );

        // Generate verification code
        const verificationCode = uuidv4();

        // Create new user (unverified)
        let user = {
            userId: counterDoc.seq,
            name: name.trim(),
            email: email.toLowerCase(),
            password: hashedPassword,
            googleId: null, // Not a Google OAuth user
            verified: false, // Email not verified yet
            dateCreated: new Date(),
            tier: 0,
            remainingAudioGenerations: 10,
            maxSavedSentences: 30,
            maxSavedWords: 60,
            feedbackAudioCreditRedeemed: false,
            remainingImageExtracts: 20,
            remainingSentenceAnalyses: 0
        };

        await usersCollection.insertOne(user);

        // Store verification code in Redis (expires in 24 hours)
        const verificationKey = `verification:${verificationCode}`;
        await redisClient.setEx(verificationKey, 86400, email.toLowerCase());

        // Generate verification URL
        const baseUrl = process.env.LOCAL === 'true' 
            ? 'http://localhost:3000' 
            : 'https://hanbokstudy.com';
        const verificationUrl = `${baseUrl}/verify?code=${verificationCode}`;

        // Send verification email
        const emailResult = await sendVerificationEmail(
            email.toLowerCase(), 
            verificationUrl, 
            name.trim()
        );

        if (!emailResult.success) {
            console.error('Failed to send verification email:', emailResult.error);
            // Don't fail registration if email sending fails
        }

        // Apply polyfill data
        user = await polyfillData(user, db);

        res.status(201).json({
            success: true,
            message: 'Account created successfully! Please check your email to verify your account.',
            user: {
                userId: user.userId,
                name: user.name,
                email: user.email,
                verified: user.verified,
                tier: user.tier
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create account. Please try again.'
        });
    }
};

module.exports = register; 
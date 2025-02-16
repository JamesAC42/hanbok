const { getDb } = require('../../database');

const addWord = async (req, res) => {
    const { korean, english } = req.body;
    const userId = req.session.user.userId;

    if (!korean || !english) {
        return res.status(400).json({
            success: false,
            error: 'Both Korean and English words are required'
        });
    }

    try {
        const db = getDb();

        // Get user info
        const user = await db.collection('users').findOne({ userId });
        
        // Check tier and limits
        if (user.tier === 0) {
            // Count current saved words
            const savedCount = await db.collection('words').countDocuments({ userId });
            
            if (savedCount >= user.maxSavedWords) {
                return res.status(403).json({
                    success: false,
                    reachedLimit: true,
                    error: 'You have reached your maximum saved words limit'
                });
            }
        }
        
        // Get next word ID
        const counterDoc = await db.collection('counters').findOneAndUpdate(
            { _id: 'wordId' },
            { $inc: { seq: 1 } },
            { upsert: true, returnDocument: 'after' }
        );

        // Save the word
        await db.collection('words').insertOne({
            wordId: counterDoc.seq,
            userId,
            korean,
            english,
            dateSaved: new Date()
        });

        res.json({ success: true });

    } catch (error) {
        // Handle duplicate word error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'Word already saved'
            });
        }

        console.error('Error saving word:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save word'
        });
    }
};

module.exports = addWord;

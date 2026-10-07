const { getDb } = require('../../database');
const { findSentenceByKey } = require('../../lib/sentenceKeys');

const saveSentence = async (req, res) => {
    const { sentenceId } = req.params;
    const userId = req.session.user.userId;

    try {
        const db = getDb();
        
        // Get user info
        const user = await db.collection('users').findOne({ userId });
        
        // Check tier and limits
        if (user.tier === 0) {
            // Count current saved sentences
            const savedCount = await db.collection('savedSentences').countDocuments({ userId });
            
            if (savedCount >= user.maxSavedSentences) {
                return res.status(403).json({
                    success: false,
                    reachedLimit: true,
                    error: 'You have reached your maximum saved sentences limit'
                });
            }
        }

        // The key is a publicId or an old numeric id; only sentences this user can
        // open can be saved, so the save route can't be used to read other people's.
        const sentence = await findSentenceByKey(db, sentenceId, { userId });

        if (!sentence) {
            return res.status(404).json({
                success: false,
                error: 'Sentence not found'
            });
        }

        // Save the sentence
        await db.collection('savedSentences').insertOne({
            userId,
            sentenceId: sentence.sentenceId,
            dateSaved: new Date()
        });

        res.json({ success: true });

    } catch (error) {
        // Handle duplicate key error gracefully
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'Sentence already saved'
            });
        }

        console.error('Error saving sentence:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save sentence'
        });
    }
};

module.exports = saveSentence; 
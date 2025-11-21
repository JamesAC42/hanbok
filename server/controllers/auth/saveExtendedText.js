const { getDb } = require('../../database');

const getTotalSavedCount = async (db, userId) => {
    const [sentencesCount, extendedTextsCount] = await Promise.all([
        db.collection('savedSentences').countDocuments({ userId }),
        db.collection('savedExtendedTexts').countDocuments({ userId })
    ]);

    return sentencesCount + extendedTextsCount;
};

const saveExtendedText = async (req, res) => {
    const textId = parseInt(req.params.textId, 10);
    const userId = req.session.user?.userId;

    if (!userId) {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized'
        });
    }

    if (Number.isNaN(textId)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid extended text ID'
        });
    }

    try {
        const db = getDb();

        const user = await db.collection('users').findOne({ userId });
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not found'
            });
        }

        const extendedText = await db.collection('extended_texts').findOne({ textId });
        if (!extendedText) {
            return res.status(404).json({
                success: false,
                error: 'Extended text not found'
            });
        }

        if (extendedText.userId !== userId) {
            return res.status(403).json({
                success: false,
                error: 'You can only bookmark your own extended texts'
            });
        }

        if (user.tier === 0) {
            const maxSavedSentences = typeof user.maxSavedSentences === 'number' ? user.maxSavedSentences : 30;
            const savedCount = await getTotalSavedCount(db, userId);
            if (savedCount >= maxSavedSentences) {
                return res.status(403).json({
                    success: false,
                    reachedLimit: true,
                    error: 'You have reached your maximum saved item limit'
                });
            }
        }

        await db.collection('savedExtendedTexts').insertOne({
            userId,
            textId,
            dateSaved: new Date()
        });

        return res.json({ success: true });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'Extended text already saved'
            });
        }

        console.error('Error saving extended text:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to save extended text'
        });
    }
};

module.exports = saveExtendedText;

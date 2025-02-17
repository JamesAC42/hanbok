const { getDb } = require('../../database');

const getSiteStats = async (req, res) => {
    try {
        const db = getDb();
        
        // Get counts from different collections in parallel
        const [sentenceCount, wordCount, userCount] = await Promise.all([
            db.collection('sentences').countDocuments(),
            db.collection('words').countDocuments(),
            db.collection('users').countDocuments()
        ]);

        res.json({
            success: true,
            stats: {
                totalSentences: sentenceCount,
                totalWords: wordCount,
                totalUsers: userCount
            }
        });

    } catch (error) {
        console.error('Error fetching site stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch site statistics'
        });
    }
};

module.exports = getSiteStats; 
const { getDb } = require('../../database');

const getUserSentences = async (req, res) => {
    const userId = req.session.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    try {
        const db = getDb();
        const totalCount = await db.collection('sentences').countDocuments({ userId });
        const sentences = await db.collection('sentences')
            .find(
                { userId },
                { projection: { sentenceId: 1, text: 1, dateCreated: 1, _id: 0 } }
            )
            .sort({ dateCreated: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        res.json({ 
            success: true,
            sentences,
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit)
        });
    } catch (error) {
        console.error('Error fetching user sentences:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch sentences.'
        });
    }
};

module.exports = getUserSentences;

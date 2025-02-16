const { getDb } = require('../../database');

const getUserWords = async (req, res) => {
    const userId = req.session.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    try {
        const db = getDb();
        
        const totalCount = await db.collection('words').countDocuments({ userId });

        const words = await db.collection('words')
            .find({ userId })
            .sort({ dateSaved: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        res.json({
            success: true,
            words,
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit)
        });

    } catch (error) {
        console.error('Error fetching user words:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch words'
        });
    }
};

module.exports = getUserWords;
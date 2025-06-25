const { getDb } = require('../../database');

const getUserSentences = async (req, res) => {
    const userId = req.session.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const language = req.query.language;
    const skip = (page - 1) * limit;

    if(!userId) {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized'
        });
    }
    
    try {
        const db = getDb();
        
        const matchCriteria = { userId };
        if (language) {
            matchCriteria.originalLanguage = language;
        }

        const totalCount = await db.collection('sentences')
            .countDocuments(matchCriteria);

        const sentences = await db.collection('sentences')
            .find(matchCriteria)
            .sort({ dateCreated: -1 }) // Sort by creation date, most recent first
            .skip(skip)
            .limit(limit)
            .project({
                sentenceId: 1,
                text: 1,
                analysis: 1,
                originalLanguage: 1,
                dateCreated: 1
            })
            .toArray();

        res.json({
            success: true,
            sentences: sentences,
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit)
        });

    } catch (error) {
        console.error('Error fetching user sentences:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user sentences'
        });
    }
};

module.exports = getUserSentences;

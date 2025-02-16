const { getDb } = require('../../database');

const getSavedSentences = async (req, res) => {
    const userId = req.session.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    try {
        const db = getDb();
        
        const totalCount = await db.collection('savedSentences').countDocuments({ userId });

        const savedSentences = await db.collection('savedSentences')
            .aggregate([
                { $match: { userId } },
                { $sort: { dateSaved: -1 } },
                { $skip: skip },
                { $limit: limit },
                {
                    $lookup: {
                        from: 'sentences',
                        localField: 'sentenceId',
                        foreignField: 'sentenceId',
                        as: 'sentence'
                    }
                },
                { $unwind: '$sentence' },
                {
                    $project: {
                        sentenceId: 1,
                        dateSaved: 1,
                        text: '$sentence.text',
                        analysis: '$sentence.analysis'
                    }
                }
            ]).toArray();

        res.json({
            success: true,
            sentences: savedSentences,
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit)
        });

    } catch (error) {
        console.error('Error fetching saved sentences:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch saved sentences'
        });
    }
};

module.exports = getSavedSentences; 
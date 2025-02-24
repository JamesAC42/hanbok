const { getDb } = require('../../database');

const getSavedSentences = async (req, res) => {
    const userId = req.session.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const language = req.query.language;
    const skip = (page - 1) * limit;
    
    try {
        const db = getDb();
        
        const matchCriteria = { userId };
        if (language) {
            matchCriteria['sentence.originalLanguage'] = language;
        }

        const totalCount = await db.collection('savedSentences')
            .aggregate([
                {
                    $lookup: {
                        from: 'sentences',
                        localField: 'sentenceId',
                        foreignField: 'sentenceId',
                        as: 'sentence'
                    }
                },
                { $unwind: '$sentence' },
                { $match: matchCriteria },
                { $count: 'total' }
            ]).toArray();

        const savedSentences = await db.collection('savedSentences')
            .aggregate([
                {
                    $lookup: {
                        from: 'sentences',
                        localField: 'sentenceId',
                        foreignField: 'sentenceId',
                        as: 'sentence'
                    }
                },
                { $unwind: '$sentence' },
                { $match: matchCriteria },
                { $sort: { dateSaved: -1 } },
                { $skip: skip },
                { $limit: limit },
                {
                    $project: {
                        sentenceId: 1,
                        dateSaved: 1,
                        text: '$sentence.text',
                        analysis: '$sentence.analysis',
                        originalLanguage: '$sentence.originalLanguage'
                    }
                }
            ]).toArray();

        res.json({
            success: true,
            sentences: savedSentences,
            page,
            limit,
            totalCount: totalCount[0]?.total || 0,
            totalPages: Math.ceil((totalCount[0]?.total || 0) / limit)
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
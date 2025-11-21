const { getDb } = require('../../database');

const parseTypes = (raw) => {
    if (!raw) return { includeSentences: true, includeExtendedTexts: true };

    const parts = raw
        .split(',')
        .map((part) => part.trim().toLowerCase())
        .filter(Boolean);

    const includeSentences = parts.includes('sentence') || parts.includes('sentences') || parts.includes('all');
    const includeExtendedTexts = parts.includes('extended') || parts.includes('extended_texts') || parts.includes('extended-texts') || parts.includes('all');

    // Default to both if nothing valid was provided
    if (!includeSentences && !includeExtendedTexts) {
        return { includeSentences: true, includeExtendedTexts: true };
    }

    return { includeSentences, includeExtendedTexts };
};

const buildSentencePipeline = (userId, language) => {
    const match = { userId };
    if (language) {
        match.originalLanguage = language;
    }

    return [
        { $match: match },
        {
            $project: {
                type: { $literal: 'sentence' },
                sentenceId: 1,
                text: 1,
                translation: '$analysis.sentence.translation',
                originalLanguage: 1,
                translationLanguage: 1,
                dateCreated: 1,
                sortDate: '$dateCreated'
            }
        }
    ];
};

const buildExtendedTextPipeline = (userId, language) => {
    const match = { userId };
    if (language) {
        match.originalLanguage = language;
    }

    return [
        { $match: match },
        {
            $project: {
                type: { $literal: 'extended_text' },
                textId: 1,
                title: 1,
                text: 1,
                sentenceCount: 1,
                originalLanguage: 1,
                translationLanguage: 1,
                summary: '$overallAnalysis.summary',
                tone: '$overallAnalysis.tone',
                dateCreated: 1,
                sortDate: '$dateCreated'
            }
        }
    ];
};

const getUserHistory = async (req, res) => {
    const userId = req.session.user?.userId;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const language = req.query.language;
    const { includeSentences, includeExtendedTexts } = parseTypes(req.query.types);
    const skip = (page - 1) * limit;

    if (!userId) {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized'
        });
    }

    if (!includeSentences && !includeExtendedTexts) {
        return res.json({
            success: true,
            items: [],
            page,
            limit,
            totalCount: 0,
            totalPages: 0
        });
    }

    try {
        const db = getDb();

        const sentenceCountPromise = includeSentences
            ? db.collection('sentences').countDocuments({
                userId,
                ...(language ? { originalLanguage: language } : {})
            })
            : Promise.resolve(0);

        const extendedCountPromise = includeExtendedTexts
            ? db.collection('extended_texts').countDocuments({
                userId,
                ...(language ? { originalLanguage: language } : {})
            })
            : Promise.resolve(0);

        const [sentenceCount, extendedCount] = await Promise.all([sentenceCountPromise, extendedCountPromise]);
        const totalCount = sentenceCount + extendedCount;
        const totalPages = limit > 0 ? Math.ceil(totalCount / limit) : 0;

        let pipeline = [];
        let initialCollection = null;

        if (includeSentences) {
            initialCollection = 'sentences';
            pipeline = buildSentencePipeline(userId, language);

            if (includeExtendedTexts) {
                pipeline.push({
                    $unionWith: {
                        coll: 'extended_texts',
                        pipeline: buildExtendedTextPipeline(userId, language)
                    }
                });
            }
        } else {
            initialCollection = 'extended_texts';
            pipeline = buildExtendedTextPipeline(userId, language);
        }

        pipeline.push(
            { $sort: { sortDate: -1 } },
            { $skip: skip },
            { $limit: limit }
        );

        const items = await db.collection(initialCollection).aggregate(pipeline).toArray();

        const sentencesOnly = items.filter(item => item.type === 'sentence');
        const extendedTextsOnly = items.filter(item => item.type === 'extended_text');

        return res.json({
            success: true,
            items,
            sentences: sentencesOnly,
            extendedTexts: extendedTextsOnly,
            page,
            limit,
            totalCount,
            totalPages
        });
    } catch (error) {
        console.error('Error fetching user history:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch user history'
        });
    }
};

module.exports = getUserHistory;

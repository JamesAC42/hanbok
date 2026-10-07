const { getDb } = require('../../database');

const parseTypes = (raw) => {
    if (!raw) return { includeSentences: true, includeExtendedTexts: true };

    const parts = raw
        .split(',')
        .map((part) => part.trim().toLowerCase())
        .filter(Boolean);

    const includeSentences = parts.includes('sentence') || parts.includes('sentences') || parts.includes('all');
    const includeExtendedTexts = parts.includes('extended') || parts.includes('extended_texts') || parts.includes('extended-texts') || parts.includes('all');

    if (!includeSentences && !includeExtendedTexts) {
        return { includeSentences: true, includeExtendedTexts: true };
    }

    return { includeSentences, includeExtendedTexts };
};

// ?folder=<folderId> or ?folder=unfiled narrows the list to one Library folder.
const parseFolder = (raw) => {
    if (raw === undefined || raw === null || raw === '' || raw === 'all') return undefined;
    if (raw === 'unfiled') return null;
    const id = parseInt(raw, 10);
    return Number.isInteger(id) ? id : undefined;
};

const ownerMatch = (userId, folder) => (folder === undefined ? { userId } : { userId, folderId: folder });

const buildSavedSentencesPipeline = (userId, language, folder) => {
    const matchStage = ownerMatch(userId, folder);

    const pipeline = [
        { $match: matchStage },
        {
            $lookup: {
                from: 'sentences',
                localField: 'sentenceId',
                foreignField: 'sentenceId',
                as: 'sentence'
            }
        },
        { $unwind: '$sentence' }
    ];

    if (language) {
        pipeline.push({ $match: { 'sentence.originalLanguage': language } });
    }

    pipeline.push({
        $project: {
            type: { $literal: 'sentence' },
            sentenceId: '$sentenceId',
            publicId: '$sentence.publicId',
            text: '$sentence.text',
            translation: '$sentence.analysis.sentence.translation',
            originalLanguage: '$sentence.originalLanguage',
            translationLanguage: '$sentence.translationLanguage',
            dateCreated: '$sentence.dateCreated',
            dateSaved: '$dateSaved',
            folderId: { $ifNull: ['$folderId', null] },
            sortDate: '$dateSaved'
        }
    });

    return pipeline;
};

const buildSavedExtendedTextsPipeline = (userId, language, folder) => {
    const pipeline = [
        { $match: ownerMatch(userId, folder) },
        {
            $lookup: {
                from: 'extended_texts',
                localField: 'textId',
                foreignField: 'textId',
                as: 'extendedText'
            }
        },
        { $unwind: '$extendedText' }
    ];

    if (language) {
        pipeline.push({ $match: { 'extendedText.originalLanguage': language } });
    }

    pipeline.push({
        $project: {
            type: { $literal: 'extended_text' },
            textId: '$textId',
            title: '$extendedText.title',
            text: '$extendedText.text',
            sentenceCount: '$extendedText.sentenceCount',
            originalLanguage: '$extendedText.originalLanguage',
            translationLanguage: '$extendedText.translationLanguage',
            summary: '$extendedText.overallAnalysis.summary',
            tone: '$extendedText.overallAnalysis.tone',
            dateCreated: '$extendedText.dateCreated',
            dateSaved: '$dateSaved',
            folderId: { $ifNull: ['$folderId', null] },
            sortDate: '$dateSaved'
        }
    });

    return pipeline;
};

const countSavedSentences = async (db, userId, language, folder) => {
    if (!language) {
        return db.collection('savedSentences').countDocuments(ownerMatch(userId, folder));
    }

    const result = await db.collection('savedSentences')
        .aggregate([
            { $match: ownerMatch(userId, folder) },
            {
                $lookup: {
                    from: 'sentences',
                    localField: 'sentenceId',
                    foreignField: 'sentenceId',
                    as: 'sentence'
                }
            },
            { $unwind: '$sentence' },
            { $match: { 'sentence.originalLanguage': language } },
            { $count: 'total' }
        ])
        .toArray();

    return result[0]?.total || 0;
};

const countSavedExtendedTexts = async (db, userId, language, folder) => {
    if (!language) {
        return db.collection('savedExtendedTexts').countDocuments(ownerMatch(userId, folder));
    }

    const result = await db.collection('savedExtendedTexts')
        .aggregate([
            { $match: ownerMatch(userId, folder) },
            {
                $lookup: {
                    from: 'extended_texts',
                    localField: 'textId',
                    foreignField: 'textId',
                    as: 'extendedText'
                }
            },
            { $unwind: '$extendedText' },
            { $match: { 'extendedText.originalLanguage': language } },
            { $count: 'total' }
        ])
        .toArray();

    return result[0]?.total || 0;
};

const getSavedItems = async (req, res) => {
    const userId = req.session.user?.userId;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const language = req.query.language;
    const { includeSentences, includeExtendedTexts } = parseTypes(req.query.types);
    const folder = parseFolder(req.query.folder);
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
            ? countSavedSentences(db, userId, language, folder)
            : Promise.resolve(0);
        const extendedCountPromise = includeExtendedTexts
            ? countSavedExtendedTexts(db, userId, language, folder)
            : Promise.resolve(0);

        const [sentenceCount, extendedCount] = await Promise.all([
            sentenceCountPromise,
            extendedCountPromise
        ]);

        const totalCount = sentenceCount + extendedCount;
        const totalPages = limit > 0 ? Math.ceil(totalCount / limit) : 0;

        let pipeline = [];
        let initialCollection = null;

        if (includeSentences) {
            initialCollection = 'savedSentences';
            pipeline = buildSavedSentencesPipeline(userId, language, folder);

            if (includeExtendedTexts) {
                pipeline.push({
                    $unionWith: {
                        coll: 'savedExtendedTexts',
                        pipeline: buildSavedExtendedTextsPipeline(userId, language, folder)
                    }
                });
            }
        } else {
            initialCollection = 'savedExtendedTexts';
            pipeline = buildSavedExtendedTextsPipeline(userId, language, folder);
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
        console.error('Error fetching saved items:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch saved items'
        });
    }
};

module.exports = getSavedItems;

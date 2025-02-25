const { getDb } = require('../../database');
const SupportedLanguages = require('../../supported_languages');

const getUserWords = async (req, res) => {
    const userId = req.session.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const originalLanguage = req.query.originalLanguage;
    const translationLanguage = req.query.translationLanguage;
    const skip = (page - 1) * limit;

    // Validate languages if provided
    if ((originalLanguage && !SupportedLanguages[originalLanguage]) || 
        (translationLanguage && !SupportedLanguages[translationLanguage])) {
        return res.status(400).json({
            success: false,
            error: 'Unsupported language'
        });
    }

    try {
        const db = getDb();
        
        // Build query with language filter
        const query = { userId };
        if (originalLanguage) query.originalLanguage = originalLanguage;
        
        const totalCount = await db.collection('words').countDocuments(query);

        const words = await db.collection('words')
            .find(query)
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
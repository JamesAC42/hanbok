const { getDb } = require('../../database');

const checkSavedExtendedText = async (req, res) => {
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
        const saved = await db.collection('savedExtendedTexts').findOne({ userId, textId });

        return res.json({
            success: true,
            isSaved: !!saved
        });
    } catch (error) {
        console.error('Error checking saved extended text:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to check saved status'
        });
    }
};

module.exports = checkSavedExtendedText;

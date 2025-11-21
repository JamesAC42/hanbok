const { getDb } = require('../../database');

const unsaveExtendedText = async (req, res) => {
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

        await db.collection('savedExtendedTexts').deleteOne({
            userId,
            textId
        });

        return res.json({ success: true });
    } catch (error) {
        console.error('Error removing saved extended text:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to remove saved extended text'
        });
    }
};

module.exports = unsaveExtendedText;

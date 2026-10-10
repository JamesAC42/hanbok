const { getDb } = require('../../database');

// Sentences analyzed while signed out have no owner. When the visitor then signs
// in, the browser sends the public ids it remembers and they join that account's
// history. Only recent, still-unowned sentences can be claimed.
const MAX_CLAIM = 20;
const CLAIM_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const claimSentences = async (req, res) => {
    const userId = req.session.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const publicIds = Array.isArray(req.body?.publicIds)
        ? [...new Set(req.body.publicIds.filter(id => typeof id === 'string' && /^[A-Za-z0-9_-]{4,64}$/.test(id)))].slice(0, MAX_CLAIM)
        : [];
    if (publicIds.length === 0) return res.json({ success: true, claimed: 0 });

    try {
        const result = await getDb().collection('sentences').updateMany(
            {
                publicId: { $in: publicIds },
                userId: null,
                dateCreated: { $gte: new Date(Date.now() - CLAIM_WINDOW_MS) }
            },
            { $set: { userId, claimedAt: new Date() } }
        );
        return res.json({ success: true, claimed: result.modifiedCount });
    } catch (error) {
        console.error('Error claiming sentences:', error);
        return res.status(500).json({ success: false, error: 'Failed to claim sentences' });
    }
};

module.exports = claimSentences;

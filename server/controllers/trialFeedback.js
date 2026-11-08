// "What stopped you from keeping Plus?" Asked once, in the "Your free week of
// Plus is over" popup (app components/interstitials/PlansInterstitial.jsx),
// when someone taps "Not now". 48 no-card trials converted 0 times, and this
// is how we find out why without emailing everyone. One row per person in
// trial_feedback; results on the admin Surveys tab.
const getDb = () => require('../database').getDb();

const REASONS = ['price', 'notEnoughUse', 'missing', 'didntNotice', 'other'];
const NOTE_MAX = 500;

// Pure: the update for one answer, or null when the body doesn't make sense.
const buildUpdate = ({ reason, note }, user, now = new Date()) => {
    if (!REASONS.includes(reason)) return null;
    const set = { reason, answeredAt: now, tier: user?.tier ?? 0, trialSource: user?.autoTrial?.source || 'signup' };
    const cleanNote = typeof note === 'string' ? note.trim().slice(0, NOTE_MAX) : '';
    if (cleanNote) set.note = cleanNote;
    return { $set: set, $setOnInsert: { createdAt: now } };
};

// POST /api/trial-feedback { reason, note }. Signed in only.
const saveTrialFeedback = async (req, res) => {
    try {
        const userId = req.session?.user?.userId;
        if (!userId) return res.status(401).json({ success: false, error: 'Sign in first' });
        const db = getDb();
        const user = await db.collection('users').findOne({ userId }, { projection: { tier: 1, autoTrial: 1 } });
        const update = buildUpdate(req.body || {}, user);
        if (!update) return res.status(400).json({ success: false, error: 'Nothing to save' });
        await db.collection('trial_feedback').updateOne({ userId }, update, { upsert: true });
        res.json({ success: true });
    } catch (e) {
        console.error('trial feedback', e);
        res.status(500).json({ success: false, error: 'Could not save that' });
    }
};

// ---------- admin ----------

const summarizeTrialFeedback = (rows) => ({
    answered: rows.length,
    reasons: Object.fromEntries(REASONS.map((r) => [r, rows.filter((row) => row.reason === r).length])),
    recent: [...rows]
        .sort((a, b) => new Date(b.answeredAt || 0) - new Date(a.answeredAt || 0))
        .slice(0, 50)
        .map((r) => ({ at: r.answeredAt, reason: r.reason, note: r.note || null, userId: r.userId, trialSource: r.trialSource || 'signup' })),
});

// GET /api/admin/stats/trial-feedback
const getTrialFeedbackStats = async (req, res) => {
    try {
        const rows = await getDb().collection('trial_feedback').find(
            {},
            { projection: { reason: 1, note: 1, answeredAt: 1, userId: 1, trialSource: 1 } },
        ).toArray();
        res.json({ success: true, cachedAt: new Date(), ...summarizeTrialFeedback(rows) });
    } catch (error) {
        console.error('Admin trial feedback stats failed:', error);
        res.status(500).json({ success: false, error: 'Failed to load trial feedback' });
    }
};

module.exports = { REASONS, buildUpdate, saveTrialFeedback, summarizeTrialFeedback, getTrialFeedbackStats };

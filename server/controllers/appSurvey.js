// "If Hanbok were a phone app, would you use it?" A one-time card on the site
// (components/interstitials/AppSurveyCard.jsx) to see whether an iPhone app is
// worth building. One row per person in app_survey: by userId when signed in,
// else by a random id the browser keeps. Results are on the admin Surveys tab.
const { getDb } = require('../database');
const { trialEndsAt } = require('../utils/autoTrial');

const ANSWERS = ['yes', 'maybe', 'no'];
const PLATFORMS = ['iphone', 'android'];
const STEPS = ['seen', 'answer', 'platform', 'dismiss'];
const VISITOR_ID = /^[A-Za-z0-9-]{8,64}$/;

// Who answered, so the admin view can split by who pays.
// anon = signed out, trial = the no-card Plus trial, basic/plus = paying.
const groupOf = (user) => {
    if (!user) return 'anon';
    if (trialEndsAt(user)) return 'trial';
    if (user.tier === 2) return 'plus';
    if (user.tier === 1) return 'basic';
    return 'free';
};

// Pure: the update for one step, or null when the body doesn't make sense.
const buildUpdate = ({ step, answer, platform }, group, now = new Date()) => {
    if (!STEPS.includes(step)) return null;
    const set = { group, updatedAt: now };
    if (step === 'seen') set.seenAt = now;
    if (step === 'dismiss') set.dismissedAt = now;
    if (step === 'answer') {
        if (!ANSWERS.includes(answer)) return null;
        set.answer = answer;
        set.answeredAt = now;
    }
    if (step === 'platform') {
        if (!PLATFORMS.includes(platform)) return null;
        set.platform = platform;
    }
    return { $set: set, $setOnInsert: { createdAt: now } };
};

// POST /api/app-survey { step, answer, platform, visitorId }. Open to
// signed-out visitors; rate limited per IP in index.js.
const saveAppSurvey = async (req, res) => {
    try {
        const db = getDb();
        const userId = req.session?.user?.userId;
        const visitorId = typeof req.body?.visitorId === 'string' && VISITOR_ID.test(req.body.visitorId) ? req.body.visitorId : null;
        if (!userId && !visitorId) return res.status(400).json({ success: false, error: 'Nothing to save' });
        const user = userId
            ? await db.collection('users').findOne({ userId }, { projection: { tier: 1, autoTrial: 1, subscription: 1 } })
            : null;
        const update = buildUpdate(req.body || {}, groupOf(user));
        if (!update) return res.status(400).json({ success: false, error: 'Nothing to save' });
        if (visitorId) update.$set.visitorId = visitorId;
        const filter = userId ? { userId } : { visitorId, userId: null };
        if (!userId) update.$setOnInsert.userId = null;
        await db.collection('app_survey').updateOne(filter, update, { upsert: true });
        res.json({ success: true });
    } catch (e) {
        console.error('app survey', e);
        res.status(500).json({ success: false, error: 'Could not save that' });
    }
};

module.exports = { saveAppSurvey, buildUpdate, groupOf, ANSWERS, PLATFORMS };

// The admin Surveys tab: answers to "If Hanbok were a phone app, would you use
// it?" (controllers/appSurvey.js), split by who pays and which phone they have.
// All time: each person sees the card once, so there's no range to pick.
const { getDb } = require('../../database');
const { ANSWERS, PLATFORMS } = require('../appSurvey');

const GROUPS = ['anon', 'free', 'trial', 'basic', 'plus'];
const count = (rows, f) => rows.filter(f).length;

// Pure, so the tests can feed it rows directly.
const summarizeAppSurvey = (rows) => {
    const answered = rows.filter((r) => ANSWERS.includes(r.answer));
    const interested = answered.filter((r) => r.answer !== 'no');
    const answerCounts = (list) => Object.fromEntries(ANSWERS.map((a) => [a, count(list, (r) => r.answer === a)]));
    const platformCounts = (list) => ({
        ...Object.fromEntries(PLATFORMS.map((p) => [p, count(list, (r) => r.platform === p)])),
        skipped: count(list, (r) => !PLATFORMS.includes(r.platform)),
    });
    return {
        totals: {
            seen: rows.length,
            answered: answered.length,
            dismissed: count(rows, (r) => !r.answer && r.dismissedAt),
            ...answerCounts(answered),
        },
        byGroup: GROUPS.map((group) => {
            const list = answered.filter((r) => (r.group || 'anon') === group);
            return { group, answered: list.length, ...answerCounts(list) };
        }),
        // Phone, asked only after a yes or maybe.
        platforms: {
            all: platformCounts(interested),
            paying: platformCounts(interested.filter((r) => r.group === 'basic' || r.group === 'plus')),
            yes: platformCounts(interested.filter((r) => r.answer === 'yes')),
        },
        recent: answered
            .sort((a, b) => new Date(b.answeredAt || 0) - new Date(a.answeredAt || 0))
            .slice(0, 25)
            .map((r) => ({ at: r.answeredAt, answer: r.answer, platform: r.platform || null, group: r.group || 'anon', userId: r.userId ?? null })),
    };
};

// GET /api/admin/stats/app-survey
const getAppSurveyStats = async (req, res) => {
    try {
        const rows = await getDb().collection('app_survey').find(
            {},
            { projection: { answer: 1, platform: 1, group: 1, dismissedAt: 1, answeredAt: 1, userId: 1 } },
        ).toArray();
        res.json({ success: true, cachedAt: new Date(), ...summarizeAppSurvey(rows) });
    } catch (error) {
        console.error('Admin app survey stats failed:', error);
        res.status(500).json({ success: false, error: 'Failed to load the survey' });
    }
};

module.exports = { getAppSurveyStats, summarizeAppSurvey, GROUPS };

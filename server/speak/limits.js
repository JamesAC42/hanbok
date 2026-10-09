// Speaking minutes per plan. Voice is billed per minute by OpenAI, so every
// plan has a cap; the numbers can be tuned from the server .env. Every plan
// uses the full voice model by default: the mini model sounded off in testing.
const DAY_MS = 24 * 60 * 60 * 1000;
const num = (v, d) => (Number.isFinite(Number(v)) && v !== '' && v !== undefined ? Number(v) : d);

const PLANS = {
    0: { minutes: num(process.env.SPEAK_FREE_MINUTES, 5), windowDays: 7, model: process.env.SPEAK_MODEL_FREE || 'gpt-realtime-2.1' },
    1: { minutes: num(process.env.SPEAK_BASIC_MINUTES, 60), windowDays: 30, model: process.env.SPEAK_MODEL_BASIC || 'gpt-realtime-2.1' },
    2: { minutes: num(process.env.SPEAK_PLUS_MINUTES, 120), windowDays: 30, model: process.env.SPEAK_MODEL_PLUS || 'gpt-realtime-2.1' },
};
const MAX_SESSION_SECONDS = num(process.env.SPEAK_MAX_SESSION_SECONDS, 600);
const MIN_START_SECONDS = 30;

const planFor = (tier) => PLANS[tier] || PLANS[0];

// Seconds a session counts for. Ended sessions count what was billed;
// open ones count the time since they started, up to their cap.
const secondsUsed = (s, now = Date.now()) => {
    if (Number.isFinite(s.billedSeconds)) return s.billedSeconds;
    const elapsed = Math.max(0, (now - new Date(s.startedAt).getTime()) / 1000);
    return Math.min(elapsed, s.maxSeconds || MAX_SESSION_SECONDS);
};

const allowanceFor = async (db, user) => {
    const plan = planFor(user?.tier || 0);
    const since = new Date(Date.now() - plan.windowDays * DAY_MS);
    const sessions = await db.collection('speak_sessions')
        .find({ userId: user.userId, startedAt: { $gte: since } }, { projection: { billedSeconds: 1, startedAt: 1, maxSeconds: 1 } })
        .toArray();
    const usedSeconds = Math.round(sessions.reduce((sum, s) => sum + secondsUsed(s), 0));
    const limitSeconds = plan.minutes * 60;
    // When the oldest session in the window drops out, minutes come back.
    const oldest = sessions.reduce((min, s) => (!min || s.startedAt < min ? s.startedAt : min), null);
    return {
        tier: user?.tier || 0,
        minutes: plan.minutes,
        windowDays: plan.windowDays,
        usedSeconds,
        leftSeconds: Math.max(0, limitSeconds - usedSeconds),
        resetsAt: oldest ? new Date(new Date(oldest).getTime() + plan.windowDays * DAY_MS) : null,
        model: plan.model,
    };
};

// What each plan gets, for the plan table on /speak.
const planTable = () => [0, 1, 2].map((tier) => ({ tier, minutes: PLANS[tier].minutes, windowDays: PLANS[tier].windowDays }));

module.exports = { planTable, PLANS, MAX_SESSION_SECONDS, MIN_START_SECONDS, planFor, allowanceFor, secondsUsed };

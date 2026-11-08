// One-time "A free week of Hanbok Plus is waiting for you" email to older free
// accounts. The returning-user trial (RETURNING_TRIAL_ENABLED, utils/autoTrial)
// only starts when one of those accounts signs in again, and most of them
// don't come back on their own, so this tells them it's there.
//
// OFF unless FREE_WEEK_EMAIL_ENABLED=true, RETURNING_TRIAL_ENABLED=true (the
// email promises the trial), EMAIL_ENABLED=true and an unsubscribe secret is
// set. Each account gets it at most once (claimed on lifecycleEmails.freeWeek).
// Sends a small batch each hour, newest accounts first, so a big list goes out
// over several days and stays under the mailbox's sending limit. Turn the flag
// off again to stop it partway. Uses the lifecycle emails' template,
// unsubscribe link and marketing opt-out.

const { getUnsubscribeSecret, renderEmail } = require('./lifecycleEmails');
const { isReturningTrialEnabled, isReturningTrialEligible, returningTrialFilter } = require('../utils/autoTrial');

const TYPE = 'freeWeek';
const DEFAULT_BATCH = 40;
const MAX_BATCH = 200;
const SEND_DELAY_MS = 3000;
const RUN_INTERVAL_MS = 60 * 60 * 1000;
const FIRST_RUN_DELAY_MS = 5 * 60 * 1000;

const isEnabled = (env = process.env) =>
    env.FREE_WEEK_EMAIL_ENABLED === 'true' &&
    isReturningTrialEnabled(env) &&
    env.EMAIL_ENABLED === 'true' &&
    !!getUnsubscribeSecret(env);

// Emails per hourly run (FREE_WEEK_EMAIL_BATCH, default 40, at most 200)
const batchSize = (env = process.env) => {
    const n = parseInt(env.FREE_WEEK_EMAIL_BATCH, 10);
    if (Number.isNaN(n) || n <= 0) return DEFAULT_BATCH;
    return Math.min(n, MAX_BATCH);
};

// ---------- rules (pure) ----------

const skipReason = (user, now = new Date()) => {
    if (!user || !user.email || typeof user.email !== 'string') return 'no-email';
    if (!user.googleId && user.verified === false) return 'unverified';
    if (user.emailPrefs && user.emailPrefs.marketing === false) return 'unsubscribed';
    if (user.lifecycleEmails && user.lifecycleEmails[TYPE]) return 'already-sent';
    if (!isReturningTrialEligible(user, now)) return 'not-eligible';
    return null;
};

// ---------- DB layer ----------

const getDb = () => require('../database').getDb();

const USER_PROJECTION = {
    userId: 1, name: 1, email: 1, verified: 1, googleId: 1, tier: 1, emailPrefs: 1,
    autoTrial: 1, hasUsedFreeTrial: 1, dateCreated: 1, lifecycleEmails: 1,
    'subscription.stripeSubscriptionId': 1,
};

const candidateFilter = (now) => ({
    ...returningTrialFilter(now),
    email: { $type: 'string' },
    'emailPrefs.marketing': { $ne: false },
    [`lifecycleEmails.${TYPE}`]: { $exists: false },
});

const findCandidates = async (db, now = new Date(), limit = MAX_BATCH) => {
    const users = await db.collection('users')
        .find(candidateFilter(now))
        .project(USER_PROJECTION)
        .sort({ dateCreated: -1 })
        .limit(limit * 2)
        .toArray();
    return users.filter((u) => !skipReason(u, now)).slice(0, limit);
};

const countCandidates = (db, now = new Date()) => db.collection('users').countDocuments(candidateFilter(now));

const claimSend = async (db, userId, now) => {
    const result = await db.collection('users').updateOne(
        { userId, ...candidateFilter(now) },
        { $set: { [`lifecycleEmails.${TYPE}`]: now } }
    );
    return result.modifiedCount === 1;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const runFreeWeekEmails = async ({
    db = getDb(),
    now = new Date(),
    cap = batchSize(),
    delayMs = SEND_DELAY_MS,
    secret = getUnsubscribeSecret(),
    send,
} = {}) => {
    const summary = { sent: 0, failed: 0, skipped: 0 };
    const due = await findCandidates(db, now, cap);
    if (due.length === 0) return summary;

    let sendMail = send;
    if (!sendMail) {
        const { createTransporter } = require('../utils/emailService');
        const transporter = createTransporter();
        await transporter.verify();
        sendMail = (mail) => transporter.sendMail({ from: `"Hanbok Study" <${process.env.EMAIL_USER}>`, ...mail });
    }

    for (const user of due) {
        if (!(await claimSend(db, user.userId, now))) { summary.skipped++; continue; }
        try {
            const mail = renderEmail(TYPE, { name: user.name, userId: user.userId, secret });
            await sendMail({ to: user.email, ...mail });
            summary.sent++;
        } catch (error) {
            summary.failed++;
            console.error(`Free week email to user ${user.userId} failed:`, error.message);
            await db.collection('users').updateOne(
                { userId: user.userId },
                { $unset: { [`lifecycleEmails.${TYPE}`]: '' } }
            ).catch(() => {});
        }
        if (delayMs > 0) await sleep(delayMs);
    }
    return summary;
};

// For the admin preview: how many would get it, and how many already did.
const freeWeekStatus = async ({ db = getDb(), now = new Date() } = {}) => {
    const [waiting, sent] = await Promise.all([
        countCandidates(db, now),
        db.collection('users').countDocuments({ [`lifecycleEmails.${TYPE}`]: { $exists: true } }),
    ]);
    return { enabled: isEnabled(), batchPerHour: batchSize(), waiting, sent };
};

const startFreeWeekEmailScheduler = () => {
    if (process.env.FREE_WEEK_EMAIL_ENABLED !== 'true') return null;
    if (!isEnabled()) {
        console.warn('Free week email: FREE_WEEK_EMAIL_ENABLED is set but RETURNING_TRIAL_ENABLED, EMAIL_ENABLED or the unsubscribe secret is missing; not starting.');
        return null;
    }
    let running = false;
    const tick = async () => {
        if (running || !isEnabled()) return;
        running = true;
        try {
            const s = await runFreeWeekEmails();
            if (s.sent || s.failed) {
                console.log(`Free week email: sent=${s.sent} failed=${s.failed} skipped=${s.skipped}`);
            }
        } catch (error) {
            console.error('Free week email run failed:', error);
        } finally {
            running = false;
        }
    };
    const first = setTimeout(tick, FIRST_RUN_DELAY_MS);
    const interval = setInterval(tick, RUN_INTERVAL_MS);
    console.log(`Free week email: scheduler started (${batchSize()} an hour)`);
    return { stop: () => { clearTimeout(first); clearInterval(interval); } };
};

module.exports = {
    TYPE,
    isEnabled,
    batchSize,
    skipReason,
    candidateFilter,
    findCandidates,
    runFreeWeekEmails,
    freeWeekStatus,
    startFreeWeekEmailScheduler,
};

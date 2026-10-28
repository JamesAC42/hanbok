// Emails around the no-card Plus trial (utils/autoTrial). OFF unless
// TRIAL_EMAILS_ENABLED=true and EMAIL_ENABLED=true and an unsubscribe secret is
// set. Two emails, each at most once per account:
//   trialEnding - the trial ends within TRIAL_ENDING_HOURS
//   trialEnded  - the trial ended in the last TRIAL_ENDED_HOURS without a
//                 subscription; includes the trial-end offer when one is running
// Lifecycle emails skip trial accounts (they're tier 2), so without these a new
// account hears nothing from us in its first week. Uses the lifecycle emails'
// template, unsubscribe link and marketing opt-out.

const { getUnsubscribeSecret, renderEmail } = require('./lifecycleEmails');
const { trialEndsAt, trialEndedAt } = require('../utils/autoTrial');
const { getTrialEndOffer } = require('../utils/trialEndOffer');

const HOUR_MS = 60 * 60 * 1000;
const TRIAL_ENDING_HOURS = 30;
const TRIAL_ENDED_HOURS = 48;
const RUN_CAP = 200;
const SEND_DELAY_MS = 2000;
const RUN_INTERVAL_MS = 30 * 60 * 1000;
const FIRST_RUN_DELAY_MS = 2 * 60 * 1000;
const TYPES = ['trialEnding', 'trialEnded'];

const isEnabled = (env = process.env) =>
    env.TRIAL_EMAILS_ENABLED === 'true' &&
    env.EMAIL_ENABLED === 'true' &&
    !!getUnsubscribeSecret(env);

// ---------- rules (pure) ----------

const skipReason = (user) => {
    if (!user || !user.email || typeof user.email !== 'string') return 'no-email';
    if (!user.googleId && user.verified === false) return 'unverified';
    if (user.emailPrefs && user.emailPrefs.marketing === false) return 'unsubscribed';
    return null;
};

const sentAt = (user, type) => user.trialEmails && user.trialEmails[type];

// Which trial email this user is due right now, or null.
const dueEmail = (user, now = new Date()) => {
    if (skipReason(user)) return null;
    const endsAt = trialEndsAt(user);
    if (endsAt) {
        const left = new Date(endsAt).getTime() - now.getTime();
        return left > 0 && left <= TRIAL_ENDING_HOURS * HOUR_MS && !sentAt(user, 'trialEnding') ? 'trialEnding' : null;
    }
    const endedAt = trialEndedAt(user);
    if (endedAt) {
        const since = now.getTime() - new Date(endedAt).getTime();
        return since >= 0 && since <= TRIAL_ENDED_HOURS * HOUR_MS && !sentAt(user, 'trialEnded') ? 'trialEnded' : null;
    }
    return null;
};

// ---------- DB layer ----------

const getDb = () => require('../database').getDb();

const USER_PROJECTION = {
    userId: 1, name: 1, email: 1, verified: 1, googleId: 1, tier: 1, emailPrefs: 1,
    autoTrial: 1, trialEmails: 1, 'subscription.stripeSubscriptionId': 1,
};

const findCandidates = async (db, now = new Date()) => {
    const users = await db.collection('users').find({
        email: { $type: 'string' },
        'emailPrefs.marketing': { $ne: false },
        'subscription.stripeSubscriptionId': { $exists: false },
        $or: [
            { 'autoTrial.expiredAt': { $exists: false }, 'autoTrial.endsAt': { $gt: now, $lte: new Date(now.getTime() + TRIAL_ENDING_HOURS * HOUR_MS) } },
            { 'autoTrial.expiredAt': { $gte: new Date(now.getTime() - TRIAL_ENDED_HOURS * HOUR_MS), $lte: now } },
        ],
    }).project(USER_PROJECTION).toArray();
    return users
        .map((user) => ({ user, type: dueEmail(user, now) }))
        .filter((c) => c.type);
};

// What they did since the trial started, for the email.
const trialUsage = async (db, user) => {
    const since = user.autoTrial?.startedAt ? new Date(user.autoTrial.startedAt) : new Date(0);
    const [sentences, words] = await Promise.all([
        db.collection('sentences').countDocuments({ userId: user.userId, dateCreated: { $gte: since } }),
        db.collection('words').countDocuments({ userId: user.userId, dateSaved: { $gte: since } }),
    ]);
    return { sentences, words };
};

const claimSend = async (db, userId, type, now) => {
    const result = await db.collection('users').updateOne(
        { userId, 'emailPrefs.marketing': { $ne: false }, [`trialEmails.${type}`]: { $exists: false } },
        { $set: { [`trialEmails.${type}`]: now } }
    );
    return result.modifiedCount === 1;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const defaultRetrieveCoupon = (id) => require('stripe')(process.env.STRIPE_SECRET_KEY).coupons.retrieve(id);

const runTrialEmails = async ({
    db = getDb(),
    now = new Date(),
    cap = RUN_CAP,
    delayMs = SEND_DELAY_MS,
    secret = getUnsubscribeSecret(),
    retrieveCoupon = defaultRetrieveCoupon,
    send,
} = {}) => {
    const summary = { trialEnding: 0, trialEnded: 0, failed: 0, skipped: 0 };
    const due = await findCandidates(db, now);
    if (due.length === 0) return summary;

    let sendMail = send;
    if (!sendMail) {
        const { createTransporter } = require('../utils/emailService');
        const transporter = createTransporter();
        await transporter.verify();
        sendMail = (mail) => transporter.sendMail({ from: `"Hanbok Study" <${process.env.EMAIL_USER}>`, ...mail });
    }

    for (const { user, type } of due.slice(0, cap)) {
        if (!(await claimSend(db, user.userId, type, now))) { summary.skipped++; continue; }
        try {
            const usage = await trialUsage(db, user);
            const offer = type === 'trialEnded' ? await getTrialEndOffer(user, retrieveCoupon, now.getTime()) : null;
            const mail = renderEmail(type, { name: user.name, userId: user.userId, secret, data: { ...usage, offer } });
            await sendMail({ to: user.email, ...mail });
            summary[type]++;
        } catch (error) {
            summary.failed++;
            console.error(`Trial email ${type} to user ${user.userId} failed:`, error.message);
            await db.collection('users').updateOne(
                { userId: user.userId },
                { $unset: { [`trialEmails.${type}`]: '' } }
            ).catch(() => {});
        }
        if (delayMs > 0) await sleep(delayMs);
    }
    return summary;
};

const startTrialEmailScheduler = () => {
    if (!isEnabled()) {
        if (process.env.TRIAL_EMAILS_ENABLED === 'true') {
            console.warn('Trial emails: TRIAL_EMAILS_ENABLED is set but EMAIL_ENABLED or the unsubscribe secret is missing; not starting.');
        }
        return null;
    }
    let running = false;
    const tick = async () => {
        if (running || !isEnabled()) return;
        running = true;
        try {
            const s = await runTrialEmails();
            if (s.trialEnding || s.trialEnded || s.failed) {
                console.log(`Trial emails: ending=${s.trialEnding} ended=${s.trialEnded} failed=${s.failed} skipped=${s.skipped}`);
            }
        } catch (error) {
            console.error('Trial email run failed:', error);
        } finally {
            running = false;
        }
    };
    const first = setTimeout(tick, FIRST_RUN_DELAY_MS);
    const interval = setInterval(tick, RUN_INTERVAL_MS);
    console.log('Trial emails: scheduler started');
    return { stop: () => { clearTimeout(first); clearInterval(interval); } };
};

module.exports = {
    TYPES,
    TRIAL_ENDING_HOURS,
    TRIAL_ENDED_HOURS,
    isEnabled,
    skipReason,
    dueEmail,
    findCandidates,
    runTrialEmails,
    startTrialEmailScheduler,
};

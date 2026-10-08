// Streak reminder emails: at 7pm in the learner's time zone, anyone with a
// streak of 2+ days who hasn't studied yet today gets one short email with the
// sentence of the day. OFF unless STREAK_EMAILS_ENABLED=true and EMAIL_ENABLED=true
// and an unsubscribe secret is set. Uses the lifecycle emails' template,
// unsubscribe link and marketing opt-out. At most one per learner per day.

const { isValidTimeZone, computeStreak } = require('../lib/progressSeries');
const { activityHistory } = require('../lib/userActivity');
const { dailySentence } = require('../utils/dailySentence');
const { getUnsubscribeSecret, renderEmail } = require('./lifecycleEmails');

const DAY_MS = 24 * 60 * 60 * 1000;
const REMINDER_HOUR = 19;
const MIN_STREAK = 2;
const HISTORY_DAYS = 371;
const RUN_CAP = 200;
const SEND_DELAY_MS = 2000;
const RUN_INTERVAL_MS = 15 * 60 * 1000; // a few runs inside each local hour
const FIRST_RUN_DELAY_MS = 90 * 1000;

const isEnabled = (env = process.env) =>
    env.STREAK_EMAILS_ENABLED === 'true' &&
    env.EMAIL_ENABLED === 'true' &&
    !!getUnsubscribeSecret(env);

// ---------- pure helpers ----------

const localParts = (now, timeZone) => {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
    }).formatToParts(now);
    const get = (type) => parts.find((p) => p.type === type).value;
    return { day: `${get('year')}-${get('month')}-${get('day')}`, hour: parseInt(get('hour'), 10) };
};

// Why this user shouldn't get a reminder right now, or null if they can.
const skipReason = (user, now = new Date()) => {
    if (!user || !user.email || typeof user.email !== 'string') return 'no-email';
    if (!user.googleId && user.verified === false) return 'unverified';
    if (user.emailPrefs && user.emailPrefs.marketing === false) return 'unsubscribed';
    if (!isValidTimeZone(user.timeZone)) return 'no-time-zone';
    const { day, hour } = localParts(now, user.timeZone);
    if (hour !== REMINDER_HOUR) return 'not-evening';
    if (user.streakEmail && user.streakEmail.day === day) return 'already-sent';
    return null;
};

const shouldRemind = (streak) => !!streak && streak.current >= MIN_STREAK && !streak.activeToday;

// ---------- DB layer ----------

const getDb = () => require('../database').getDb();

const USER_PROJECTION = { userId: 1, name: 1, email: 1, verified: 1, googleId: 1, emailPrefs: 1, timeZone: 1, streakEmail: 1 };

// Learners who did anything in the last two days (a live streak needs yesterday).
const recentlyActiveUserIds = async (db, now) => {
    const since = new Date(now.getTime() - 2 * DAY_MS);
    const lists = await Promise.all([
        db.collection('sentences').distinct('userId', { userId: { $ne: null }, dateCreated: { $gte: since } }),
        db.collection('words').distinct('userId', { dateSaved: { $gte: since } }),
        db.collection('study_progress').distinct('userId', { date: { $gte: new Date(since.getTime() - DAY_MS) } }),
        db.collection('grammar_practice_log').distinct('userId', { date: { $gte: since } }),
    ]);
    return [...new Set(lists.flat().filter((id) => id !== null && id !== undefined))];
};

const findCandidates = async (db, now = new Date()) => {
    const ids = await recentlyActiveUserIds(db, now);
    if (ids.length === 0) return [];
    const users = await db.collection('users').find({
        userId: { $in: ids },
        email: { $type: 'string' },
        timeZone: { $type: 'string' },
        'emailPrefs.marketing': { $ne: false },
    }).project(USER_PROJECTION).toArray();

    const due = [];
    for (const user of users.filter((u) => !skipReason(u, now))) {
        const history = await activityHistory(db, user.userId, user.timeZone, HISTORY_DAYS, now);
        const streak = computeStreak(history);
        if (shouldRemind(streak)) due.push({ user, streak: streak.current });
    }
    return due;
};

// Marks today's reminder as sent; only the run that wins the claim sends.
const claimSend = async (db, user, now) => {
    const { day } = localParts(now, user.timeZone);
    const result = await db.collection('users').updateOne(
        { userId: user.userId, 'emailPrefs.marketing': { $ne: false }, 'streakEmail.day': { $ne: day } },
        { $set: { streakEmail: { day, sentAt: now } } }
    );
    return result.modifiedCount === 1 ? day : null;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const runStreakEmails = async ({
    db = getDb(),
    now = new Date(),
    cap = RUN_CAP,
    delayMs = SEND_DELAY_MS,
    secret = getUnsubscribeSecret(),
    send,
} = {}) => {
    const summary = { sent: 0, failed: 0, skipped: 0 };
    const due = await findCandidates(db, now);
    if (due.length === 0) return summary;

    let sendMail = send;
    if (!sendMail) {
        const { createTransporter } = require('../utils/emailService');
        const transporter = createTransporter();
        await transporter.verify();
        sendMail = (mail) => transporter.sendMail({ from: `"Hanbok Study" <${process.env.EMAIL_USER}>`, ...mail });
    }

    const sentence = dailySentence(now);
    for (const { user, streak } of due.slice(0, cap)) {
        const previous = user.streakEmail;
        if (!(await claimSend(db, user, now))) { summary.skipped++; continue; }
        try {
            const mail = renderEmail('streak', { name: user.name, userId: user.userId, secret, data: { streak, sentence } });
            await sendMail({ to: user.email, ...mail });
            summary.sent++;
        } catch (error) {
            summary.failed++;
            console.error(`Streak email to user ${user.userId} failed:`, error.message);
            await db.collection('users').updateOne(
                { userId: user.userId },
                previous ? { $set: { streakEmail: previous } } : { $unset: { streakEmail: '' } }
            ).catch(() => {});
        }
        if (delayMs > 0) await sleep(delayMs);
    }
    return summary;
};

const startStreakEmailScheduler = () => {
    if (!isEnabled()) {
        if (process.env.STREAK_EMAILS_ENABLED === 'true') {
            console.warn('Streak emails: STREAK_EMAILS_ENABLED is set but EMAIL_ENABLED or the unsubscribe secret is missing; not starting.');
        }
        return null;
    }
    let running = false;
    const tick = async () => {
        if (running || !isEnabled()) return;
        running = true;
        try {
            const s = await runStreakEmails();
            if (s.sent || s.failed) console.log(`Streak emails: sent=${s.sent} failed=${s.failed} skipped=${s.skipped}`);
        } catch (error) {
            console.error('Streak email run failed:', error);
        } finally {
            running = false;
        }
    };
    const first = setTimeout(tick, FIRST_RUN_DELAY_MS);
    const interval = setInterval(tick, RUN_INTERVAL_MS);
    console.log('Streak emails: scheduler started');
    return { stop: () => { clearTimeout(first); clearInterval(interval); } };
};

module.exports = {
    REMINDER_HOUR,
    isEnabled,
    localParts,
    skipReason,
    shouldRemind,
    findCandidates,
    runStreakEmails,
    startStreakEmailScheduler,
};

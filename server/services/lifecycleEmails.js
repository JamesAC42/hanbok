// Lifecycle ("upgrade") emails to free users. OFF unless both
// LIFECYCLE_EMAILS_ENABLED=true and EMAIL_ENABLED=true are set.
//
// Three emails:
//   limit   - used all 10 free analyses this week (at most once per 30 days)
//   day3    - verified account 3-7 days old with at least 1 analysis (once ever)
//   winback - 3+ analyses, last one 14-60 days ago (once ever)
//
// The rules and templates are pure functions on plain objects so they can be
// unit tested (test/lifecycleEmails.test.js). The DB code around them is thin.
// Each send is claimed on the user doc (lifecycleEmails.<type> = Date) with a
// conditional updateOne before the email goes out, so a crash can't double-send.

const crypto = require('crypto');
const getPreviousSunday = require('../utils/getPreviousSunday');

const SITE_URL = 'https://hanbokstudy.com';
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKLY_FREE_LIMIT = 10;
const LIMIT_COOLDOWN_DAYS = 30;
const RUN_CAP = 200;              // most emails sent per run
const SEND_DELAY_MS = 2000;       // pause between sends so the mail host isn't flooded
const RUN_INTERVAL_MS = 60 * 60 * 1000;
const FIRST_RUN_DELAY_MS = 60 * 1000;
const EMAIL_TYPES = ['limit', 'day3', 'winback'];
const SIGNATURE = 'James from Hanbok';

// ---------- switch and secret ----------

const getUnsubscribeSecret = (env = process.env) =>
    env.EMAIL_UNSUBSCRIBE_SECRET || env.SESSION_SECRET || null;

const isEnabled = (env = process.env) =>
    env.LIFECYCLE_EMAILS_ENABLED === 'true' &&
    env.EMAIL_ENABLED === 'true' &&
    !!getUnsubscribeSecret(env);

// ---------- unsubscribe tokens ----------

const signUnsubscribeToken = (userId, secret) =>
    crypto.createHmac('sha256', secret).update(String(userId)).digest('hex');

const verifyUnsubscribeToken = (userId, token, secret) => {
    if (!secret || typeof token !== 'string' || !/^[0-9a-f]{64}$/i.test(token)) return false;
    const expected = Buffer.from(signUnsubscribeToken(userId, secret), 'hex');
    const given = Buffer.from(token, 'hex');
    return given.length === expected.length && crypto.timingSafeEqual(given, expected);
};

const unsubscribeUrl = (userId, secret) =>
    `${SITE_URL}/api/email/unsubscribe?u=${encodeURIComponent(userId)}&t=${signUnsubscribeToken(userId, secret)}`;

// ---------- eligibility rules (pure) ----------

const daysBetween = (earlier, later) => (later.getTime() - new Date(earlier).getTime()) / DAY_MS;

// Returns why a user can't get any lifecycle email, or null if they can.
const skipReason = (user) => {
    if (!user) return 'missing';
    if (!user.email || typeof user.email !== 'string') return 'no-email';
    if ((user.tier || 0) > 0) return 'paid';
    // Google users have no verified flag; only email signups can be unverified
    if (!user.googleId && user.verified === false) return 'unverified';
    if (user.emailPrefs && user.emailPrefs.marketing === false) return 'unsubscribed';
    return null;
};

const sentAt = (user, type) => user.lifecycleEmails && user.lifecycleEmails[type];

// rateLimit: the user's rate_limits doc; weekStart: start of the current week
const isEligibleForLimit = (user, rateLimit, now = new Date(), weekStart = getPreviousSunday()) => {
    if (skipReason(user)) return false;
    if (!rateLimit || !rateLimit.weekStartDate) return false;
    if (new Date(rateLimit.weekStartDate) < weekStart) return false;
    if ((rateLimit.weekSentences || 0) < WEEKLY_FREE_LIMIT) return false;
    const last = sentAt(user, 'limit');
    return !last || daysBetween(last, now) >= LIMIT_COOLDOWN_DAYS;
};

const isEligibleForDay3 = (user, sentenceCount, now = new Date()) => {
    if (skipReason(user)) return false;
    if (sentAt(user, 'day3') || !user.dateCreated) return false;
    const age = daysBetween(user.dateCreated, now);
    return age >= 3 && age <= 7 && sentenceCount >= 1;
};

const isEligibleForWinback = (user, sentenceCount, lastSentenceDate, now = new Date()) => {
    if (skipReason(user)) return false;
    if (sentAt(user, 'winback') || !lastSentenceDate) return false;
    const idle = daysBetween(lastSentenceDate, now);
    return sentenceCount >= 3 && idle >= 14 && idle <= 60;
};

// ---------- templates (pure) ----------

const withUtm = (path, campaign) => {
    const url = new URL(path, SITE_URL);
    url.searchParams.set('utm_source', 'email');
    url.searchParams.set('utm_medium', 'lifecycle');
    url.searchParams.set('utm_campaign', campaign);
    return url.toString();
};

const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const firstName = (name) => {
    const first = String(name || '').trim().split(/\s+/)[0];
    return first || 'there';
};

// Each template returns { subject, paragraphs, button: {label, path}, extra? }.
// paragraphs are plain strings; links inside paragraphs use { text, path } items.
const COPY = {
    limit: (name) => ({
        subject: "You've used this week's 10 free analyses",
        intro: `Hi ${name},`,
        paragraphs: [
            "You've used all 10 of your free sentence analyses this week. That's a good sign you're studying regularly.",
            "You have two options. You can wait: your free analyses reset every Sunday, and everything you've saved stays in your Library.",
            'Or, if you want to keep going now, Basic gives you unlimited analyses. The yearly plan is $40 a year, which works out to about $3.33 a month (or $4 month to month). Plus is $99 a year or $10 a month and adds more audio and grammar practice.',
            "Either way is fine. I'd rather you keep learning than feel rushed.",
        ],
        button: { label: 'See plans', path: '/pricing' },
    }),
    day3: (name) => ({
        subject: 'Three things to try in Hanbok',
        intro: `Hi ${name},`,
        paragraphs: [
            "Thanks for trying Hanbok this week. Now that you've analyzed your first sentences, here are three things that help most people:",
        ],
        list: [
            { title: 'Review your words.', body: 'Words you save go to your Library, where you can study them as flashcards.', link: { label: 'Open your Library', path: '/library' } },
            { title: 'Follow the grammar review path.', body: 'Grammar points from your sentences are collected so you can review them in order.', link: { label: 'Go to My Grammar', path: '/my-grammar' } },
            { title: 'Add the Chrome extension.', body: 'Analyze Korean text on any web page without copying and pasting.', link: { label: 'Get the extension', path: '/extension' } },
        ],
        after: [
            'If you find yourself wanting more than 10 analyses a week, Basic is $40 a year (about $3.33 a month) for unlimited analyses. No pressure; the free plan is yours to keep.',
        ],
        button: { label: 'Open Hanbok', path: '/' },
    }),
    winback: (name) => ({
        subject: "Here's what's new in Hanbok",
        intro: `Hi ${name},`,
        paragraphs: [
            "It's been a little while since you last studied with Hanbok, so I wanted to share what has changed:",
        ],
        list: [
            { title: 'A new design.', body: 'Larger, clearer text and a simpler layout that is easier on the eyes.' },
            { title: 'A grammar review path.', body: 'Grammar from your sentences is gathered in one place so you can review it step by step.', link: { label: 'See My Grammar', path: '/my-grammar' } },
            { title: 'Learn articles.', body: 'Short, plain-language guides to Korean grammar and study habits.', link: { label: 'Read the articles', path: '/learn' } },
        ],
        after: [
            'Your saved sentences and words are still there whenever you want to pick up again.',
        ],
        button: { label: 'Come back to Hanbok', path: '/' },
    }),
};

const COLORS = { primary: '#3D64E8', shadow: '#2645B8', text: '#141833', muted: '#5B6080', border: '#E3E6F0' };

const renderEmail = (type, { name, userId, secret }) => {
    if (!COPY[type]) throw new Error(`Unknown lifecycle email type: ${type}`);
    const copy = COPY[type](firstName(name));
    const unsub = unsubscribeUrl(userId, secret);
    const buttonUrl = withUtm(copy.button.path, type);
    const p = `margin:0 0 18px;font-size:18px;line-height:1.6;color:${COLORS.text};`;
    const link = `color:${COLORS.primary};font-weight:bold;`;

    const htmlParagraphs = (items = []) => items.map((t) => `<p style="${p}">${escapeHtml(t)}</p>`).join('\n');
    const htmlList = (copy.list || []).map((item, i) => `
        <p style="${p}"><strong>${i + 1}. ${escapeHtml(item.title)}</strong> ${escapeHtml(item.body)}${item.link
            ? `<br><a href="${escapeHtml(withUtm(item.link.path, type))}" style="${link}">${escapeHtml(item.link.label)}</a>`
            : ''}</p>`).join('\n');

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(copy.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#FFFFFF;">
<div style="max-width:600px;margin:0 auto;padding:28px 20px;font-family:Arial,Helvetica,sans-serif;color:${COLORS.text};">
    <p style="margin:0 0 24px;font-size:22px;font-weight:bold;color:${COLORS.primary};">Hanbok</p>
    <p style="${p}">${escapeHtml(copy.intro)}</p>
    ${htmlParagraphs(copy.paragraphs)}
    ${htmlList}
    ${htmlParagraphs(copy.after)}
    <p style="margin:28px 0;">
        <a href="${escapeHtml(buttonUrl)}" style="display:inline-block;background:${COLORS.primary};color:#FFFFFF;font-size:18px;font-weight:bold;text-decoration:none;padding:14px 28px;border-radius:10px;box-shadow:0 4px 0 ${COLORS.shadow};">${escapeHtml(copy.button.label)}</a>
    </p>
    <p style="${p}">${escapeHtml(SIGNATURE)}</p>
    <hr style="border:none;border-top:1px solid ${COLORS.border};margin:28px 0 16px;">
    <p style="margin:0;font-size:15px;line-height:1.6;color:${COLORS.muted};">
        You're getting this because you have a free Hanbok account.
        <a href="${escapeHtml(unsub)}" style="color:${COLORS.muted};">Unsubscribe from these emails</a>.
        You'll still get account emails like password resets.
    </p>
</div>
</body>
</html>`;

    const textList = (copy.list || []).map((item, i) =>
        `${i + 1}. ${item.title} ${item.body}${item.link ? `\n   ${item.link.label}: ${withUtm(item.link.path, type)}` : ''}`);
    const text = [
        copy.intro,
        ...copy.paragraphs,
        ...textList,
        ...(copy.after || []),
        `${copy.button.label}: ${buttonUrl}`,
        SIGNATURE,
        '--',
        `You're getting this because you have a free Hanbok account. Unsubscribe: ${unsub}`,
    ].join('\n\n');

    return {
        subject: copy.subject,
        html,
        text,
        headers: {
            'List-Unsubscribe': `<${unsub}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
    };
};

// ---------- DB layer (thin) ----------

const getDb = () => require('../database').getDb();

const USER_PROJECTION = {
    userId: 1, name: 1, email: 1, verified: 1, googleId: 1, tier: 1,
    dateCreated: 1, emailPrefs: 1, lifecycleEmails: 1,
};

// Base filter for users who could get any lifecycle email (refined by skipReason)
const baseUserFilter = () => ({
    tier: { $not: { $gt: 0 } },
    email: { $type: 'string' },
    'emailPrefs.marketing': { $ne: false },
});

// Sentence count and last sentence date per user, for the given userIds
const sentenceStats = async (db, userIds) => {
    if (userIds.length === 0) return new Map();
    const rows = await db.collection('sentences').aggregate([
        { $match: { userId: { $in: userIds } } },
        { $group: { _id: '$userId', count: { $sum: 1 }, last: { $max: '$dateCreated' } } },
    ]).toArray();
    return new Map(rows.map((r) => [r._id, r]));
};

// Returns { limit: [user], day3: [user], winback: [user] } of who qualifies now.
const findCandidates = async (db, now = new Date()) => {
    const weekStart = getPreviousSunday();
    const users = db.collection('users');

    // limit: anyone at the weekly cap this week
    const limitDocs = await db.collection('rate_limits').find({
        identifierType: 'userId',
        weekStartDate: { $gte: weekStart },
        weekSentences: { $gte: WEEKLY_FREE_LIMIT },
    }).project({ identifier: 1, weekSentences: 1, weekStartDate: 1 }).toArray();
    const rateByUser = new Map(limitDocs.map((d) => [Number(d.identifier), d]));
    const limitUsers = rateByUser.size === 0 ? [] : await users.find({
        ...baseUserFilter(),
        userId: { $in: [...rateByUser.keys()] },
    }).project(USER_PROJECTION).toArray();
    const limit = limitUsers.filter((u) => isEligibleForLimit(u, rateByUser.get(u.userId), now, weekStart));

    // day3: accounts created 3-7 days ago that haven't had it
    const day3Users = await users.find({
        ...baseUserFilter(),
        dateCreated: { $gte: new Date(now - 7 * DAY_MS), $lte: new Date(now - 3 * DAY_MS) },
        'lifecycleEmails.day3': { $exists: false },
    }).project(USER_PROJECTION).toArray();
    const day3Stats = await sentenceStats(db, day3Users.map((u) => u.userId));
    const day3 = day3Users.filter((u) => isEligibleForDay3(u, day3Stats.get(u.userId)?.count || 0, now));

    // winback: users whose latest sentence in the last 60 days is 14+ days old
    const recent = await db.collection('sentences').aggregate([
        { $match: { userId: { $ne: null }, dateCreated: { $gte: new Date(now - 60 * DAY_MS) } } },
        { $group: { _id: '$userId', last: { $max: '$dateCreated' } } },
        { $match: { last: { $lte: new Date(now - 14 * DAY_MS) } } },
    ]).toArray();
    const winbackUsers = recent.length === 0 ? [] : await users.find({
        ...baseUserFilter(),
        userId: { $in: recent.map((r) => r._id) },
        'lifecycleEmails.winback': { $exists: false },
    }).project(USER_PROJECTION).toArray();
    const winbackStats = await sentenceStats(db, winbackUsers.map((u) => u.userId));
    const winback = winbackUsers.filter((u) => {
        const stats = winbackStats.get(u.userId);
        return stats && isEligibleForWinback(u, stats.count, stats.last, now);
    });

    return { limit, day3, winback };
};

// Atomically marks the email as sent. Returns true only for the run that wins
// the claim; the filter repeats the skip rules so a just-upgraded or
// just-unsubscribed user is never claimed.
const claimSend = async (db, userId, type, now) => {
    const notYetSent = type === 'limit'
        ? { $or: [
            { 'lifecycleEmails.limit': { $exists: false } },
            { 'lifecycleEmails.limit': { $lt: new Date(now - LIMIT_COOLDOWN_DAYS * DAY_MS) } },
        ] }
        : { [`lifecycleEmails.${type}`]: { $exists: false } };
    const result = await db.collection('users').updateOne(
        { userId, ...baseUserFilter(), ...notYetSent },
        { $set: { [`lifecycleEmails.${type}`]: now } }
    );
    return result.modifiedCount === 1;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// One pass: claim and send up to `cap` emails. `send` is injectable for tests.
const runLifecycleEmails = async ({
    db = getDb(),
    now = new Date(),
    cap = RUN_CAP,
    delayMs = SEND_DELAY_MS,
    secret = getUnsubscribeSecret(),
    send,
} = {}) => {
    const summary = { limit: 0, day3: 0, winback: 0, failed: 0, skipped: 0 };
    const candidates = await findCandidates(db, now);

    let sendMail = send;
    if (!sendMail) {
        const { createTransporter } = require('../utils/emailService');
        const transporter = createTransporter();
        await transporter.verify();
        sendMail = (mail) => transporter.sendMail({ from: `"Hanbok Study" <${process.env.EMAIL_USER}>`, ...mail });
    }

    const emailedThisRun = new Set(); // one lifecycle email per user per run
    let sent = 0;
    for (const type of EMAIL_TYPES) {
        for (const user of candidates[type]) {
            if (sent >= cap) break;
            if (emailedThisRun.has(user.userId)) { summary.skipped++; continue; }
            const previous = sentAt(user, type);
            if (!(await claimSend(db, user.userId, type, now))) { summary.skipped++; continue; }
            emailedThisRun.add(user.userId);
            sent++;
            try {
                const mail = renderEmail(type, { name: user.name, userId: user.userId, secret });
                await sendMail({ to: user.email, ...mail });
                summary[type]++;
            } catch (error) {
                summary.failed++;
                console.error(`Lifecycle email ${type} to user ${user.userId} failed:`, error.message);
                // Release the claim so it can be retried on a later run
                await db.collection('users').updateOne(
                    { userId: user.userId },
                    previous
                        ? { $set: { [`lifecycleEmails.${type}`]: previous } }
                        : { $unset: { [`lifecycleEmails.${type}`]: '' } }
                ).catch(() => {});
            }
            if (delayMs > 0) await sleep(delayMs);
        }
    }
    return summary;
};

// Admin preview: who would get each email right now, plus the rendered emails.
const previewLifecycleEmails = async ({ db = getDb(), now = new Date() } = {}) => {
    const candidates = await findCandidates(db, now);
    const secret = getUnsubscribeSecret() || 'preview-secret-not-configured';
    const result = { enabled: isEnabled(), secretConfigured: !!getUnsubscribeSecret(), counts: {}, samples: {}, emails: {} };
    for (const type of EMAIL_TYPES) {
        result.counts[type] = candidates[type].length;
        result.samples[type] = candidates[type].slice(0, 5).map((u) => ({ userId: u.userId, name: u.name }));
        const { subject, html } = renderEmail(type, { name: 'Alex', userId: 0, secret });
        result.emails[type] = { subject, html };
    }
    return result;
};

// ---------- unsubscribe route ----------

const unsubscribePage = (message) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Hanbok emails</title></head>
<body style="margin:0;background:#FFFFFF;font-family:Arial,Helvetica,sans-serif;color:${COLORS.text};">
<div style="max-width:560px;margin:60px auto;padding:0 20px;">
<p style="font-size:22px;font-weight:bold;color:${COLORS.primary};">Hanbok</p>
<p style="font-size:20px;line-height:1.6;">${escapeHtml(message)}</p>
<p style="font-size:18px;"><a href="${SITE_URL}" style="color:${COLORS.primary};">Back to Hanbok</a></p>
</div></body></html>`;

// GET (link click) and POST (one-click List-Unsubscribe) both land here
const handleUnsubscribe = async (req, res) => {
    const source = { ...(req.body || {}), ...req.query };
    const userId = parseInt(source.u, 10);
    const secret = getUnsubscribeSecret();
    if (!Number.isInteger(userId) || !verifyUnsubscribeToken(userId, source.t, secret)) {
        return res.status(400).type('html').send(unsubscribePage('This unsubscribe link is not valid. Please email us and we will remove you by hand.'));
    }
    try {
        await getDb().collection('users').updateOne(
            { userId },
            { $set: { 'emailPrefs.marketing': false, 'emailPrefs.updatedAt': new Date() } }
        );
        res.type('html').send(unsubscribePage("You're unsubscribed. We won't send you any more of these emails. You'll still get account emails like password resets."));
    } catch (error) {
        console.error('Unsubscribe failed:', error);
        res.status(500).type('html').send(unsubscribePage('Something went wrong. Please try the link again in a minute.'));
    }
};

// ---------- scheduler ----------

// Starts the hourly run. With the switch off nothing is queried or sent.
const startLifecycleEmailScheduler = () => {
    if (!isEnabled()) {
        if (process.env.LIFECYCLE_EMAILS_ENABLED === 'true') {
            console.warn('Lifecycle emails: LIFECYCLE_EMAILS_ENABLED is set but EMAIL_ENABLED or the unsubscribe secret is missing; not starting.');
        }
        return null;
    }
    let running = false;
    const tick = async () => {
        if (running || !isEnabled()) return;
        running = true;
        try {
            const s = await runLifecycleEmails();
            console.log(`Lifecycle emails: sent limit=${s.limit} day3=${s.day3} winback=${s.winback} failed=${s.failed} skipped=${s.skipped}`);
        } catch (error) {
            console.error('Lifecycle email run failed:', error);
        } finally {
            running = false;
        }
    };
    const first = setTimeout(tick, FIRST_RUN_DELAY_MS);
    const interval = setInterval(tick, RUN_INTERVAL_MS);
    console.log('Lifecycle emails: scheduler started (hourly)');
    return { stop: () => { clearTimeout(first); clearInterval(interval); } };
};

module.exports = {
    EMAIL_TYPES,
    WEEKLY_FREE_LIMIT,
    getUnsubscribeSecret,
    isEnabled,
    signUnsubscribeToken,
    verifyUnsubscribeToken,
    unsubscribeUrl,
    skipReason,
    isEligibleForLimit,
    isEligibleForDay3,
    isEligibleForWinback,
    withUtm,
    renderEmail,
    findCandidates,
    claimSend,
    runLifecycleEmails,
    previewLifecycleEmails,
    handleUnsubscribe,
    startLifecycleEmailScheduler,
};

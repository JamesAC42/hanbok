const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
    EMAIL_TYPES,
    isEnabled,
    getUnsubscribeSecret,
    signUnsubscribeToken,
    verifyUnsubscribeToken,
    skipReason,
    isEligibleForLimit,
    isEligibleForDay3,
    isEligibleForWinback,
    renderEmail,
    runLifecycleEmails,
} = require('../services/lifecycleEmails');

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-10-07T12:00:00Z');
const WEEK_START = new Date('2026-10-04T00:00:00Z');
const daysAgo = (n) => new Date(NOW.getTime() - n * DAY);
const SECRET = 'test-secret';

const freeUser = (overrides = {}) => ({
    userId: 42, name: 'Mina Park', email: 'mina@example.com', tier: 0,
    verified: true, dateCreated: daysAgo(5), ...overrides,
});

test('switch needs both flags and a secret', () => {
    assert.equal(isEnabled({}), false);
    assert.equal(isEnabled({ LIFECYCLE_EMAILS_ENABLED: 'true', SESSION_SECRET: 's' }), false);
    assert.equal(isEnabled({ EMAIL_ENABLED: 'true', SESSION_SECRET: 's' }), false);
    assert.equal(isEnabled({ LIFECYCLE_EMAILS_ENABLED: 'true', EMAIL_ENABLED: 'true' }), false);
    assert.equal(isEnabled({ LIFECYCLE_EMAILS_ENABLED: 'true', EMAIL_ENABLED: 'true', SESSION_SECRET: 's' }), true);
    assert.equal(getUnsubscribeSecret({ EMAIL_UNSUBSCRIBE_SECRET: 'a', SESSION_SECRET: 'b' }), 'a');
    assert.equal(getUnsubscribeSecret({ SESSION_SECRET: 'b' }), 'b');
});

test('skipReason covers paid, unverified, unsubscribed and missing email', () => {
    assert.equal(skipReason(freeUser()), null);
    assert.equal(skipReason(freeUser({ tier: 1 })), 'paid');
    assert.equal(skipReason(freeUser({ tier: 2 })), 'paid');
    assert.equal(skipReason(freeUser({ verified: false })), 'unverified');
    // Google users have no verified flag and count as verified
    assert.equal(skipReason(freeUser({ verified: undefined, googleId: 'g1' })), null);
    assert.equal(skipReason(freeUser({ verified: false, googleId: 'g1' })), null);
    assert.equal(skipReason(freeUser({ emailPrefs: { marketing: false } })), 'unsubscribed');
    assert.equal(skipReason(freeUser({ emailPrefs: { marketing: true } })), null);
    assert.equal(skipReason(freeUser({ email: '' })), 'no-email');
    assert.equal(skipReason(freeUser({ email: undefined })), 'no-email');
});

test('limit email: at the cap this week, at most once per 30 days', () => {
    const atCap = { weekSentences: 10, weekStartDate: WEEK_START };
    assert.equal(isEligibleForLimit(freeUser(), atCap, NOW, WEEK_START), true);
    assert.equal(isEligibleForLimit(freeUser(), { ...atCap, weekSentences: 9 }, NOW, WEEK_START), false);
    // usage from last week doesn't count
    assert.equal(isEligibleForLimit(freeUser(), { ...atCap, weekStartDate: daysAgo(10) }, NOW, WEEK_START), false);
    assert.equal(isEligibleForLimit(freeUser(), null, NOW, WEEK_START), false);
    assert.equal(isEligibleForLimit(freeUser({ lifecycleEmails: { limit: daysAgo(10) } }), atCap, NOW, WEEK_START), false);
    assert.equal(isEligibleForLimit(freeUser({ lifecycleEmails: { limit: daysAgo(31) } }), atCap, NOW, WEEK_START), true);
    assert.equal(isEligibleForLimit(freeUser({ tier: 1 }), atCap, NOW, WEEK_START), false);
    assert.equal(isEligibleForLimit(freeUser({ emailPrefs: { marketing: false } }), atCap, NOW, WEEK_START), false);
});

test('day3 email: verified, 3-7 days old, at least one analysis, once ever', () => {
    assert.equal(isEligibleForDay3(freeUser({ dateCreated: daysAgo(3) }), 1, NOW), true);
    assert.equal(isEligibleForDay3(freeUser({ dateCreated: daysAgo(7) }), 1, NOW), true);
    assert.equal(isEligibleForDay3(freeUser({ dateCreated: daysAgo(2) }), 1, NOW), false);
    assert.equal(isEligibleForDay3(freeUser({ dateCreated: daysAgo(8) }), 1, NOW), false);
    assert.equal(isEligibleForDay3(freeUser(), 0, NOW), false);
    assert.equal(isEligibleForDay3(freeUser({ verified: false }), 5, NOW), false);
    assert.equal(isEligibleForDay3(freeUser({ lifecycleEmails: { day3: daysAgo(1) } }), 5, NOW), false);
    assert.equal(isEligibleForDay3(freeUser({ tier: 2 }), 5, NOW), false);
});

test('winback email: 3+ analyses, last one 14-60 days ago, once ever', () => {
    assert.equal(isEligibleForWinback(freeUser(), 3, daysAgo(14), NOW), true);
    assert.equal(isEligibleForWinback(freeUser(), 3, daysAgo(60), NOW), true);
    assert.equal(isEligibleForWinback(freeUser(), 2, daysAgo(20), NOW), false);
    assert.equal(isEligibleForWinback(freeUser(), 5, daysAgo(13), NOW), false);
    assert.equal(isEligibleForWinback(freeUser(), 5, daysAgo(61), NOW), false);
    assert.equal(isEligibleForWinback(freeUser(), 5, null, NOW), false);
    assert.equal(isEligibleForWinback(freeUser({ lifecycleEmails: { winback: daysAgo(100) } }), 5, daysAgo(20), NOW), false);
    assert.equal(isEligibleForWinback(freeUser({ emailPrefs: { marketing: false } }), 5, daysAgo(20), NOW), false);
});

test('unsubscribe tokens sign and verify', () => {
    const token = signUnsubscribeToken(42, SECRET);
    assert.match(token, /^[0-9a-f]{64}$/);
    assert.equal(verifyUnsubscribeToken(42, token, SECRET), true);
    assert.equal(verifyUnsubscribeToken('42', token, SECRET), true);
    assert.equal(verifyUnsubscribeToken(43, token, SECRET), false);
    assert.equal(verifyUnsubscribeToken(42, token, 'other-secret'), false);
    assert.equal(verifyUnsubscribeToken(42, token.slice(0, 10), SECRET), false);
    assert.equal(verifyUnsubscribeToken(42, undefined, SECRET), false);
    assert.equal(verifyUnsubscribeToken(42, ['x'], SECRET), false);
    assert.equal(verifyUnsubscribeToken(42, token, null), false);
});

test('templates carry the unsubscribe link, header and UTM tags', () => {
    const token = signUnsubscribeToken(42, SECRET);
    const unsub = `https://hanbokstudy.com/api/email/unsubscribe?u=42&t=${token}`;
    for (const type of EMAIL_TYPES) {
        const mail = renderEmail(type, { name: 'Mina Park', userId: 42, secret: SECRET });
        assert.ok(mail.subject.length > 0, type);
        assert.ok(mail.html.includes(unsub.replace(/&/g, '&amp;')), `${type} html unsubscribe`);
        assert.ok(mail.text.includes(unsub), `${type} text unsubscribe`);
        assert.equal(mail.headers['List-Unsubscribe'], `<${unsub}>`);
        assert.ok(mail.html.includes(`utm_source=email&amp;utm_medium=lifecycle&amp;utm_campaign=${type}`), `${type} html utm`);
        assert.ok(mail.text.includes(`utm_source=email&utm_medium=lifecycle&utm_campaign=${type}`), `${type} text utm`);
        assert.ok(mail.text.includes('Hi Mina,'), `${type} greeting`);
        assert.ok(!/gradient/i.test(mail.html), `${type} no gradients`);
    }
    const limit = renderEmail('limit', { name: 'x', userId: 1, secret: SECRET });
    assert.ok(limit.text.includes('$40 a year'));
    assert.ok(limit.text.includes('Sunday'));
    assert.ok(limit.html.includes('https://hanbokstudy.com/pricing?utm_source=email'));
    const day3 = renderEmail('day3', { name: 'x', userId: 1, secret: SECRET });
    for (const path of ['/library', '/my-grammar', '/extension']) assert.ok(day3.text.includes(`https://hanbokstudy.com${path}?`), path);
    assert.ok(renderEmail('winback', { name: 'x', userId: 1, secret: SECRET }).text.includes('https://hanbokstudy.com/learn?'));
});

test('templates escape the user name in HTML', () => {
    const mail = renderEmail('day3', { name: '<script>x</script>', userId: 1, secret: SECRET });
    assert.ok(!mail.html.includes('<script>'));
    assert.ok(mail.html.includes('&lt;script&gt;'));
});

// Minimal fake of the Mongo calls the run makes, to check claim-before-send,
// the per-run cap and release of the claim when a send fails.
const fakeDb = ({ users, rateLimits = [], sentences = [] }) => {
    const get = (doc, path) => path.split('.').reduce((v, k) => (v == null ? undefined : v[k]), doc);
    const matches = (doc, filter) => Object.entries(filter).every(([key, cond]) => {
        if (key === '$or') return cond.some((f) => matches(doc, f));
        const v = get(doc, key);
        if (cond && typeof cond === 'object' && !(cond instanceof Date)) {
            return Object.entries(cond).every(([op, arg]) => {
                if (op === '$exists') return (v !== undefined) === arg;
                if (op === '$ne') return v !== arg;
                if (op === '$in') return arg.includes(v);
                if (op === '$gte') return v != null && v >= arg;
                if (op === '$lte') return v != null && v <= arg;
                if (op === '$lt') return v != null && v < arg;
                if (op === '$type') return typeof v === arg;
                if (op === '$not') return !matches({ x: v }, { x: arg });
                if (op === '$gt') return v != null && v > arg;
                throw new Error(`unsupported ${op}`);
            });
        }
        return v === cond;
    });
    const cursor = (rows) => ({ project: () => cursor(rows), toArray: async () => rows });
    const collections = {
        users: {
            find: (f) => cursor(users.filter((u) => matches(u, f))),
            updateOne: async (f, update) => {
                const doc = users.find((u) => matches(u, f));
                if (!doc) return { modifiedCount: 0 };
                for (const [k, v] of Object.entries(update.$set || {})) {
                    const [a, b] = k.split('.');
                    doc[a] = { ...(doc[a] || {}), [b]: v };
                }
                for (const k of Object.keys(update.$unset || {})) {
                    const [a, b] = k.split('.');
                    if (doc[a]) delete doc[a][b];
                }
                return { modifiedCount: 1 };
            },
        },
        rate_limits: { find: (f) => cursor(rateLimits.filter((r) => matches(r, f))) },
        sentences: {
            aggregate: (pipeline) => {
                let rows = sentences.filter((s) => matches(s, pipeline[0].$match));
                const groups = new Map();
                for (const s of rows) {
                    const g = groups.get(s.userId) || { _id: s.userId, count: 0, last: null };
                    g.count++;
                    if (!g.last || s.dateCreated > g.last) g.last = s.dateCreated;
                    groups.set(s.userId, g);
                }
                rows = [...groups.values()];
                if (pipeline[2]) rows = rows.filter((r) => matches(r, pipeline[2].$match));
                return { toArray: async () => rows };
            },
        },
    };
    return { collection: (name) => collections[name] };
};

test('run claims before sending, caps, and releases the claim on failure', async () => {
    const users = [1, 2, 3].map((id) => freeUser({ userId: id, email: `u${id}@example.com`, dateCreated: daysAgo(4) }));
    users.push(freeUser({ userId: 4, email: 'paid@example.com', tier: 1, dateCreated: daysAgo(4) }));
    const sentences = [1, 2, 3, 4].map((id) => ({ userId: id, dateCreated: daysAgo(1) }));
    const db = fakeDb({ users, sentences });

    const sent = [];
    const summary = await runLifecycleEmails({
        db, now: NOW, cap: 2, delayMs: 0, secret: SECRET,
        send: async (mail) => {
            // the claim is already recorded when the send happens
            assert.ok(users.find((u) => u.email === mail.to).lifecycleEmails.day3);
            if (mail.to === 'u2@example.com') throw new Error('smtp down');
            sent.push(mail.to);
        },
    });
    assert.deepEqual(sent, ['u1@example.com']);
    assert.equal(summary.day3, 1);
    assert.equal(summary.failed, 1);
    assert.equal(users[1].lifecycleEmails.day3, undefined, 'claim released after failure');
    assert.equal(users[2].lifecycleEmails, undefined, 'cap stopped the run');
    assert.equal(users[3].lifecycleEmails, undefined, 'paid user skipped');

    // A second run never re-sends to user 1
    const again = [];
    await runLifecycleEmails({ db, now: NOW, delayMs: 0, secret: SECRET, send: async (m) => again.push(m.to) });
    assert.deepEqual(again.sort(), ['u2@example.com', 'u3@example.com']);
});

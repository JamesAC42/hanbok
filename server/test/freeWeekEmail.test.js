const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isEnabled, batchSize, skipReason, runFreeWeekEmails, TYPE } = require('../services/freeWeekEmail');
const { renderEmail } = require('../services/lifecycleEmails');

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-11-07T12:00:00Z');

const oldFree = (overrides = {}) => ({
    userId: 11, name: 'Jun Lee', email: 'jun@example.com', verified: true, tier: 0,
    dateCreated: new Date(NOW.getTime() - 40 * DAY), ...overrides,
});

test('switch needs its flag, the returning trial, EMAIL_ENABLED and a secret', () => {
    const on = { FREE_WEEK_EMAIL_ENABLED: 'true', RETURNING_TRIAL_ENABLED: 'true', EMAIL_ENABLED: 'true', SESSION_SECRET: 's' };
    assert.equal(isEnabled(on), true);
    assert.equal(isEnabled({}), false);
    assert.equal(isEnabled({ ...on, FREE_WEEK_EMAIL_ENABLED: undefined }), false);
    // never promise a free week the site won't give
    assert.equal(isEnabled({ ...on, RETURNING_TRIAL_ENABLED: undefined }), false);
    assert.equal(isEnabled({ ...on, EMAIL_ENABLED: undefined }), false);
});

test('batch size defaults to 40 and is capped', () => {
    assert.equal(batchSize({}), 40);
    assert.equal(batchSize({ FREE_WEEK_EMAIL_BATCH: '10' }), 10);
    assert.equal(batchSize({ FREE_WEEK_EMAIL_BATCH: '5000' }), 200);
    assert.equal(batchSize({ FREE_WEEK_EMAIL_BATCH: 'x' }), 40);
});

test('only old free accounts that never had a trial or a subscription', () => {
    assert.equal(skipReason(oldFree(), NOW), null);
    assert.equal(skipReason(oldFree({ dateCreated: new Date(NOW.getTime() - 2 * DAY) }), NOW), 'not-eligible');
    assert.equal(skipReason(oldFree({ tier: 1 }), NOW), 'not-eligible');
    assert.equal(skipReason(oldFree({ autoTrial: { startedAt: NOW } }), NOW), 'not-eligible');
    assert.equal(skipReason(oldFree({ hasUsedFreeTrial: true }), NOW), 'not-eligible');
    assert.equal(skipReason(oldFree({ subscription: { stripeSubscriptionId: 'sub_1' } }), NOW), 'not-eligible');
});

test('respects opt-out, unverified signups and a previous send', () => {
    assert.equal(skipReason(oldFree({ emailPrefs: { marketing: false } }), NOW), 'unsubscribed');
    assert.equal(skipReason(oldFree({ verified: false }), NOW), 'unverified');
    assert.equal(skipReason(oldFree({ verified: false, googleId: 'g' }), NOW), null);
    assert.equal(skipReason(oldFree({ email: null }), NOW), 'no-email');
    assert.equal(skipReason(oldFree({ lifecycleEmails: { freeWeek: NOW } }), NOW), 'already-sent');
});

// Minimal stand-in for the users collection
const fakeDb = (users) => ({
    collection: () => ({
        find: () => ({ project: () => ({ sort: () => ({ limit: (n) => ({ toArray: async () => users.slice(0, n) }) }) }) }),
        updateOne: async (filter, update) => {
            const user = users.find((u) => u.userId === filter.userId);
            if (update.$set) {
                if (user.lifecycleEmails?.freeWeek) return { modifiedCount: 0 };
                user.lifecycleEmails = { ...(user.lifecycleEmails || {}), freeWeek: NOW };
            }
            if (update.$unset) delete user.lifecycleEmails.freeWeek;
            return { modifiedCount: 1 };
        },
    }),
});

test('sends each person once, up to the batch size, and un-claims failures', async () => {
    const users = [oldFree({ userId: 1 }), oldFree({ userId: 2, email: 'fail@example.com' }), oldFree({ userId: 3 }), oldFree({ userId: 4 })];
    const sent = [];
    const send = async (mail) => {
        if (mail.to === 'fail@example.com') throw new Error('smtp down');
        sent.push(mail);
    };
    const summary = await runFreeWeekEmails({ db: fakeDb(users), now: NOW, cap: 3, delayMs: 0, secret: 's', send });
    assert.deepEqual(summary, { sent: 2, failed: 1, skipped: 0 });
    assert.equal(sent.length, 2);
    assert.equal(users[1].lifecycleEmails.freeWeek, undefined);
    assert.ok(users[0].lifecycleEmails.freeWeek);
    assert.equal(users[3].lifecycleEmails, undefined);

    const again = await runFreeWeekEmails({ db: fakeDb(users.slice(0, 1)), now: NOW, cap: 3, delayMs: 0, secret: 's', send });
    assert.equal(again.sent, 0);
});

test('the email says what happens and links to sign in', () => {
    const mail = renderEmail(TYPE, { name: 'Jun Lee', userId: 11, secret: 's' });
    assert.match(mail.subject, /free week of Hanbok Plus/);
    assert.match(mail.text, /Hi Jun,/);
    assert.match(mail.text, /No card/);
    assert.match(mail.text, /Start my free week: .*\/home\?utm_/);
    assert.match(mail.text, /Unsubscribe: /);
    assert.ok(mail.headers['List-Unsubscribe']);
});

// #166 shipped the scheduler but never started it, so nothing was ever sent.
test('index.js starts the free week email scheduler', () => {
    const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'index.js'), 'utf8');
    assert.match(src, /freeWeekEmail\.startFreeWeekEmailScheduler\(\)/);
});

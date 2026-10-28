const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isEnabled, dueEmail, skipReason } = require('../services/trialEmails');
const { renderEmail } = require('../services/lifecycleEmails');

const HOUR = 60 * 60 * 1000;
const NOW = new Date('2026-10-28T12:00:00Z');
const at = (hours) => new Date(NOW.getTime() + hours * HOUR);

const trialUser = (overrides = {}) => ({
    userId: 7, name: 'Mina Park', email: 'mina@example.com', verified: true, tier: 2,
    autoTrial: { startedAt: at(-6 * 24), endsAt: at(20) }, ...overrides,
});
const endedUser = (overrides = {}) => trialUser({ tier: 0, autoTrial: { startedAt: at(-8 * 24), endsAt: at(-10), expiredAt: at(-10) }, ...overrides });

test('switch needs the flag, EMAIL_ENABLED and a secret', () => {
    assert.equal(isEnabled({}), false);
    assert.equal(isEnabled({ TRIAL_EMAILS_ENABLED: 'true', SESSION_SECRET: 's' }), false);
    assert.equal(isEnabled({ TRIAL_EMAILS_ENABLED: 'true', EMAIL_ENABLED: 'true' }), false);
    assert.equal(isEnabled({ TRIAL_EMAILS_ENABLED: 'true', EMAIL_ENABLED: 'true', SESSION_SECRET: 's' }), true);
});

test('trial ending: inside the last 30 hours, once', () => {
    assert.equal(dueEmail(trialUser(), NOW), 'trialEnding');
    assert.equal(dueEmail(trialUser({ autoTrial: { endsAt: at(40) } }), NOW), null);
    assert.equal(dueEmail(trialUser({ trialEmails: { trialEnding: at(-1) } }), NOW), null);
    // subscribed during the trial
    assert.equal(dueEmail(trialUser({ subscription: { stripeSubscriptionId: 'sub_1' } }), NOW), null);
});

test('trial ended: within 48 hours of the end, once, never for subscribers', () => {
    assert.equal(dueEmail(endedUser(), NOW), 'trialEnded');
    assert.equal(dueEmail(endedUser({ autoTrial: { endsAt: at(-60), expiredAt: at(-60) } }), NOW), null);
    assert.equal(dueEmail(endedUser({ trialEmails: { trialEnded: at(-2) } }), NOW), null);
    assert.equal(dueEmail(endedUser({ tier: 1, subscription: { stripeSubscriptionId: 'sub_1' } }), NOW), null);
});

test('respects opt-out and unverified email signups', () => {
    assert.equal(skipReason(trialUser({ emailPrefs: { marketing: false } })), 'unsubscribed');
    assert.equal(dueEmail(trialUser({ verified: false }), NOW), null);
    assert.equal(dueEmail(trialUser({ verified: false, googleId: 'g' }), NOW), 'trialEnding');
});

test('emails show real usage and the offer prices', () => {
    const ending = renderEmail('trialEnding', { name: 'Mina Park', userId: 7, secret: 's', data: { sentences: 12, words: 1 } });
    assert.match(ending.text, /analyzed 12 sentences and saved 1 word\./);
    assert.match(ending.text, /\$99 a year/);

    const offer = { percentOff: 40, duration: 'once', endsAt: '2026-10-31T12:00:00Z' };
    const ended = renderEmail('trialEnded', { name: 'Mina', userId: 7, secret: 's', data: { sentences: 0, words: 0, offer } });
    assert.match(ended.subject, /40% off until Saturday, October 31/);
    assert.match(ended.text, /\$59\.40 for your first year/);
    assert.match(ended.text, /Basic to \$24/);

    const plain = renderEmail('trialEnded', { name: 'Mina', userId: 7, secret: 's', data: {} });
    assert.equal(plain.subject, 'Your Plus trial has ended');
});

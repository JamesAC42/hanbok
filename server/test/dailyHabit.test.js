const test = require('node:test');
const assert = require('node:assert');
const { dailySentence, isDailySentence } = require('../utils/dailySentence');
const { skipReason, shouldRemind, localParts } = require('../services/streakEmails');
const { renderEmail } = require('../services/lifecycleEmails');

const DAY_MS = 24 * 60 * 60 * 1000;

test('everyone gets the same sentence on a UTC day, and it changes the next day', () => {
    const morning = new Date('2026-10-08T01:00:00Z');
    const evening = new Date('2026-10-08T23:00:00Z');
    assert.deepStrictEqual(dailySentence(morning), dailySentence(evening));
    assert.strictEqual(dailySentence(morning).date, '2026-10-08');
    assert.notStrictEqual(dailySentence(morning).text, dailySentence(new Date(morning.getTime() + DAY_MS)).text);
});

test('today\'s and yesterday\'s sentences are free, others are not', () => {
    const now = new Date('2026-10-08T12:00:00Z');
    assert.strictEqual(isDailySentence(dailySentence(now).text, now), true);
    assert.strictEqual(isDailySentence(`  ${dailySentence(now).text} `, now), true);
    assert.strictEqual(isDailySentence(dailySentence(new Date(now - DAY_MS)).text, now), true);
    assert.strictEqual(isDailySentence(dailySentence(new Date(now - 5 * DAY_MS)).text, now), false);
    assert.strictEqual(isDailySentence('', now), false);
});

test('reminders go out at 7pm local time, once a day', () => {
    const now = new Date('2026-10-08T23:30:00Z'); // 7:30pm in New York
    const user = { email: 'a@b.com', googleId: 'g', timeZone: 'America/New_York' };
    assert.deepStrictEqual(localParts(now, 'America/New_York'), { day: '2026-10-08', hour: 19 });
    assert.strictEqual(skipReason(user, now), null);
    assert.strictEqual(skipReason({ ...user, timeZone: 'Asia/Seoul' }, now), 'not-evening');
    assert.strictEqual(skipReason({ ...user, streakEmail: { day: '2026-10-08' } }, now), 'already-sent');
    assert.strictEqual(skipReason({ ...user, emailPrefs: { marketing: false } }, now), 'unsubscribed');
    assert.strictEqual(skipReason({ ...user, timeZone: undefined }, now), 'no-time-zone');
    assert.strictEqual(skipReason({ email: 'a@b.com', verified: false, timeZone: 'America/New_York' }, now), 'unverified');
});

test('only a 2+ day streak with nothing done today gets a reminder', () => {
    assert.strictEqual(shouldRemind({ current: 3, activeToday: false }), true);
    assert.strictEqual(shouldRemind({ current: 3, activeToday: true }), false);
    assert.strictEqual(shouldRemind({ current: 1, activeToday: false }), false);
});

test('the streak email names the streak and links today\'s sentence', () => {
    const sentence = { text: '밥은 먹었어?', gist: 'Did you eat?' };
    const mail = renderEmail('streak', { name: 'Min Ji', userId: 7, secret: 's', data: { streak: 5, sentence } });
    assert.match(mail.subject, /5-day streak/);
    assert.match(mail.text, /밥은 먹었어\?/);
    assert.match(mail.text, /analyze\?text=/);
    assert.match(mail.text, /Hanbok streak going/);
    assert.ok(mail.headers['List-Unsubscribe']);
});

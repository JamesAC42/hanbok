const test = require('node:test');
const assert = require('node:assert');

// database.js reads these when it is first required.
process.env.MONGODB_DB = process.env.MONGODB_DB || 'test';

const { buildUpdate, groupOf } = require('../controllers/appSurvey');
const { summarizeAppSurvey } = require('../controllers/admin/appSurveyStats');

const now = new Date('2026-10-12T10:00:00Z');

test('groupOf splits signed out, free, trial and paying', () => {
    assert.strictEqual(groupOf(null), 'anon');
    assert.strictEqual(groupOf({ tier: 0 }), 'free');
    assert.strictEqual(groupOf({ tier: 2, autoTrial: { endsAt: now } }), 'trial');
    assert.strictEqual(groupOf({ tier: 2, autoTrial: { endsAt: now }, subscription: { stripeSubscriptionId: 'sub_1' } }), 'plus');
    assert.strictEqual(groupOf({ tier: 1 }), 'basic');
});

test('buildUpdate keeps only known steps and answers', () => {
    assert.strictEqual(buildUpdate({ step: 'nope' }, 'anon', now), null);
    assert.strictEqual(buildUpdate({ step: 'answer', answer: 'sure' }, 'anon', now), null);
    assert.strictEqual(buildUpdate({ step: 'platform', platform: 'windows' }, 'anon', now), null);
    assert.deepStrictEqual(buildUpdate({ step: 'answer', answer: 'yes' }, 'free', now).$set, { group: 'free', updatedAt: now, answer: 'yes', answeredAt: now });
    assert.deepStrictEqual(buildUpdate({ step: 'platform', platform: 'iphone' }, 'plus', now).$set, { group: 'plus', updatedAt: now, platform: 'iphone' });
    assert.ok(buildUpdate({ step: 'seen' }, 'anon', now).$set.seenAt);
    assert.ok(buildUpdate({ step: 'dismiss' }, 'anon', now).$set.dismissedAt);
});

test('summarizeAppSurvey counts answers by group and phones among the interested', () => {
    const rows = [
        { group: 'anon', seenAt: now },
        { group: 'anon', dismissedAt: now },
        { group: 'anon', answer: 'yes', platform: 'iphone', answeredAt: now },
        { group: 'free', answer: 'maybe', platform: 'android', answeredAt: now },
        { group: 'free', answer: 'no', answeredAt: now },
        { group: 'plus', answer: 'yes', platform: 'iphone', answeredAt: now, userId: 7 },
        { group: 'basic', answer: 'yes', answeredAt: now, userId: 8 },
    ];
    const s = summarizeAppSurvey(rows);
    assert.deepStrictEqual(s.totals, { seen: 7, answered: 5, dismissed: 1, yes: 3, maybe: 1, no: 1 });
    const free = s.byGroup.find((g) => g.group === 'free');
    assert.deepStrictEqual(free, { group: 'free', answered: 2, yes: 0, maybe: 1, no: 1 });
    assert.deepStrictEqual(s.platforms.all, { iphone: 2, android: 1, skipped: 1 });
    assert.deepStrictEqual(s.platforms.paying, { iphone: 1, android: 0, skipped: 1 });
    assert.deepStrictEqual(s.platforms.yes, { iphone: 2, android: 0, skipped: 1 });
    assert.strictEqual(s.recent.length, 5);
});

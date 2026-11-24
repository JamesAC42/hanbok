process.env.MONGODB_DB = process.env.MONGODB_DB || 'test';
const test = require('node:test');
const assert = require('node:assert');
const { payersFrom, everPaid } = require('../controllers/admin/payers');

const DAY = 24 * 60 * 60 * 1000;
const now = Date.parse('2026-11-24T00:00:00Z');
const sec = (iso) => Date.parse(iso) / 1000;

test('a subscription counts as paid once it got past its trial', () => {
    assert.strictEqual(everPaid({ status: 'active', start_date: sec('2026-05-01') }, now), true);
    assert.strictEqual(everPaid({ status: 'canceled', start_date: sec('2026-05-01'), trial_end: sec('2026-05-08'), ended_at: sec('2026-05-05') }, now), false);
    assert.strictEqual(everPaid({ status: 'incomplete_expired', start_date: sec('2026-05-01') }, now), false);
    assert.strictEqual(everPaid({ status: 'trialing', start_date: sec('2026-11-20'), trial_end: sec('2026-11-27') }, now), false);
});

test('payer rows carry months and counts, not who they are', () => {
    const out = payersFrom({
        now,
        people: [
            { firstPaidAt: Date.parse('2026-03-10'), payingNow: true, plan: 'Plus monthly', signedUpAt: new Date('2026-03-10T01:00:00Z'), sentencesFirstWeek: 40, sentencesBeforePaying: 3, language: 'ko', country: 'US' },
            { firstPaidAt: Date.parse('2026-06-01'), payingNow: false, plan: 'Basic monthly', signedUpAt: new Date('2026-01-01'), sentencesFirstWeek: 2, sentencesBeforePaying: 80, language: 'ja', country: 'DE', coupon: true },
        ],
        cohorts: [{ month: '2026-03', signups: 50, everPaid: 1 }],
        recent: { since: new Date('2026-10-01'), users: [{ sentencesFirstWeek: 0, language: null }, { sentencesFirstWeek: 4, language: 'ko', heardFrom: 'search' }] },
    });
    assert.deepStrictEqual(out.rows.map((r) => [r.firstPaid, r.daysToPay, r.payingNow]), [['2026-03', 0, true], ['2026-06', 151, false]]);
    assert.ok(out.rows.every((r) => !('userId' in r) && !('email' in r)));
    assert.strictEqual(out.payingNow.count, 1);
    assert.deepStrictEqual(out.payingNow.sentencesFirstWeek, { '30+': 1 });
    assert.deepStrictEqual(out.everPaid.daysToPay, { 'same day': 1, '1-6 months': 1 });
    assert.deepStrictEqual(out.recentSignups.sentencesFirstWeek, { 0: 1, '3-9': 1 });
    assert.strictEqual(out.recentSignups.count, 2);
});

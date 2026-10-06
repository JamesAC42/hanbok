const test = require('node:test');
const assert = require('node:assert');

// database.js reads these when it is first required.
process.env.MONGODB_DB = process.env.MONGODB_DB || 'test';

const { createTtlCache } = require('../lib/ttlCache');
const { summarize, monthlyAmount } = require('../controllers/admin/revenue');
const { parseDays, parseTimeZone, listDays } = require('../controllers/admin/stats');

const DAY = 24 * 60 * 60;
const NOW = Date.UTC(2026, 9, 6, 12);
const nowSec = NOW / 1000;

const price = (amount, interval) => ({ id: `price_${amount}_${interval}`, unit_amount: amount, recurring: { interval, interval_count: 1 } });
const sub = (fields) => ({
    customer: 'cus_1',
    currency: 'usd',
    cancel_at_period_end: false,
    trial_end: null,
    ended_at: null,
    items: { data: [{ price: price(400, 'month'), quantity: 1 }] },
    ...fields,
    start_date: fields.created,
});

test('normalizes yearly and weekly prices to a monthly amount', () => {
    assert.strictEqual(monthlyAmount({ price: price(400, 'month') }), 400);
    assert.strictEqual(monthlyAmount({ price: price(9900, 'year') }), 825);
    assert.strictEqual(monthlyAmount({ price: price(100, 'week'), quantity: 3 }), 1300);
});

test('MRR counts paying subscriptions only and keeps trials separate', () => {
    const subs = [
        sub({ id: 'a', status: 'active', created: nowSec - 40 * DAY }),
        sub({ id: 'b', status: 'past_due', created: nowSec - 100 * DAY, items: { data: [{ price: price(9900, 'year') }] } }),
        sub({ id: 'c', status: 'trialing', created: nowSec - 2 * DAY, trial_end: nowSec + 5 * DAY }),
        sub({ id: 'd', status: 'canceled', created: nowSec - 200 * DAY, ended_at: nowSec - 10 * DAY }),
        sub({ id: 'e', status: 'active', created: nowSec - 5 * DAY, cancel_at_period_end: true }),
    ];
    const result = summarize(subs, [], { days: 30, now: NOW, users: new Map() });

    assert.strictEqual(result.mrr, 400 + 825 + 400);
    assert.deepStrictEqual(
        { paying: result.subscribers.paying, trialing: result.subscribers.trialing, pastDue: result.subscribers.pastDue, cancelling: result.subscribers.cancelling },
        { paying: 3, trialing: 1, pastDue: 1, cancelling: 1 },
    );
    assert.strictEqual(result.subscribers.newInRange, 2); // c and e
    assert.strictEqual(result.subscribers.cancelledInRange, 1); // d
    // Today's history point matches the live MRR.
    assert.strictEqual(result.mrrHistory[result.mrrHistory.length - 1].mrr, result.mrr);
    // Eleven months ago none of them had started yet.
    assert.strictEqual(result.mrrHistory[0].mrr, 0);
});

test('revenue splits subscriptions from one-time packs and subtracts refunds', () => {
    const charge = (fields) => ({ paid: true, status: 'succeeded', currency: 'usd', amount_refunded: 0, created: nowSec - DAY, ...fields });
    const charges = [
        charge({ id: '1', amount: 400, invoice: 'in_1' }),
        charge({ id: '2', amount: 100, invoice: null }),
        charge({ id: '3', amount: 1000, invoice: 'in_2', amount_refunded: 1000, refunded: true }),
        charge({ id: '4', amount: 400, invoice: 'in_3', created: nowSec - 45 * DAY }),
        charge({ id: '5', amount: 999, paid: false, status: 'failed' }),
    ];
    const result = summarize([], charges, { days: 30, now: NOW, users: new Map() });
    assert.deepStrictEqual(result.revenue.current, { total: 500, subscriptions: 400, oneTime: 100, count: 3 });
    assert.strictEqual(result.revenue.prev.total, 400);
});

test('payments are matched to learners by Stripe customer id', () => {
    const users = new Map([['cus_9', { userId: 9, name: 'Mina', email: 'mina@example.com' }]]);
    const charges = [{ id: 'x', paid: true, status: 'succeeded', amount: 400, amount_refunded: 0, currency: 'usd', created: nowSec, invoice: 'in', customer: { id: 'cus_9' } }];
    const [payment] = summarize([], charges, { days: 30, now: NOW, users }).recentPayments;
    assert.strictEqual(payment.userId, 9);
    assert.strictEqual(payment.name, 'Mina');
});

test('ttl cache reuses values, shares in-flight work and never caches failures', async () => {
    const cache = createTtlCache(60000);
    let calls = 0;
    const compute = async () => { calls += 1; return calls; };

    const [a, b] = await Promise.all([cache.get('k', compute), cache.get('k', compute)]);
    assert.strictEqual(a.value, 1);
    assert.strictEqual(b.value, 1);
    assert.strictEqual((await cache.get('k', compute)).value, 1);
    assert.strictEqual((await cache.get('k', compute, { fresh: true })).value, 2);

    await assert.rejects(cache.get('bad', async () => { throw new Error('boom'); }));
    assert.strictEqual((await cache.get('bad', async () => 'ok')).value, 'ok');
});

test('range and time zone inputs fall back to safe defaults', () => {
    assert.strictEqual(parseDays('90'), 90);
    assert.strictEqual(parseDays('1000'), 30);
    assert.strictEqual(parseDays(undefined), 30);
    assert.strictEqual(parseTimeZone('America/New_York'), 'America/New_York');
    assert.strictEqual(parseTimeZone('Not/AZone'), 'UTC');
    assert.strictEqual(parseTimeZone({ $gt: '' }), 'UTC');
});

test('listDays covers every local day in the range once', () => {
    const to = new Date(Date.UTC(2026, 2, 10, 15));
    const from = new Date(to.getTime() - 7 * DAY * 1000);
    const days = listDays(from, to, 'America/New_York');
    assert.strictEqual(days.length, 8);
    assert.strictEqual(days[0], '2026-03-03');
    assert.strictEqual(days[days.length - 1], '2026-03-10');
    assert.strictEqual(new Set(days).size, days.length);
});

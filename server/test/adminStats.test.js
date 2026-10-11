const test = require('node:test');
const assert = require('node:assert');

// database.js reads these when it is first required.
process.env.MONGODB_DB = process.env.MONGODB_DB || 'test';

const { createTtlCache } = require('../lib/ttlCache');
const { summarize, monthlyAmount, netMonthly, dayStart } = require('../controllers/admin/revenue');
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

test('MRR is net of coupons, read from the latest invoice first', () => {
    const yearly = { data: [{ price: price(4000, 'year'), quantity: 1 }] };
    const deal = { id: 'di_1', coupon: { id: 'DEAL30', name: 'Yearly deal', percent_off: 30, duration: 'once' } };
    // Bought yearly with 30% off the first year: $28 paid.
    const dealSub = sub({
        id: 'deal', status: 'active', created: nowSec - DAY, items: yearly, discounts: [],
        latest_invoice: { billing_reason: 'subscription_create', subtotal: 4000, total: 2800, amount_paid: 2800, total_discount_amounts: [{ amount: 1200 }], discounts: [deal] },
    });
    assert.strictEqual(Math.round(netMonthly(dealSub)), 233);

    // No usable invoice: a forever student coupon still on the subscription.
    const student = sub({
        id: 'student', status: 'active', created: nowSec - 90 * DAY,
        discounts: [{ id: 'di_2', coupon: { id: 'STUDENT50', percent_off: 50, duration: 'forever' } }],
    });
    assert.strictEqual(netMonthly(student), 200);

    // A once coupon that was already used and an expired repeating one change nothing.
    const used = sub({
        id: 'used', status: 'active', created: nowSec - 90 * DAY,
        discounts: [
            { id: 'di_3', coupon: { id: 'ONCE', percent_off: 50, duration: 'once' } },
            { id: 'di_4', end: nowSec - DAY, coupon: { id: 'THREE', amount_off: 100, duration: 'repeating' } },
        ],
    });
    assert.strictEqual(netMonthly(used, NOW), 400);

    const result = summarize([dealSub, student, used], [], { days: 30, now: NOW, users: new Map() });
    assert.strictEqual(Math.round(result.mrr), 233 + 200 + 400);
    assert.strictEqual(Math.round(result.mrrList), 333 + 400 + 400);
    assert.strictEqual(result.subscribers.discounted, 2);
    assert.strictEqual(result.mrrHistory[result.mrrHistory.length - 1].mrr, result.mrr);
    const basicYearly = result.plans.find((p) => p.interval === 'yearly');
    assert.strictEqual(Math.round(basicYearly.mrr), 233);
    assert.strictEqual(basicYearly.discounted, 1);
});

test('new subscriptions and cancellations come back as events with what was paid', () => {
    const users = new Map([['cus_s', { userId: 7, name: 'Saskia', email: 's@example.com' }]]);
    const subs = [
        sub({
            id: 'new', customer: { id: 'cus_s' }, status: 'active', created: nowSec - 5 * 3600,
            items: { data: [{ price: { id: 'price_1Rjh9EDv6kE7GataEdXl4ICx', unit_amount: 4000, recurring: { interval: 'year', interval_count: 1 } } }] },
            latest_invoice: {
                billing_reason: 'subscription_create', subtotal: 4000, amount_paid: 2800, total_discount_amounts: [{ amount: 1200 }],
                discounts: [{ id: 'di', coupon: { id: 'DEAL30', name: 'Yearly deal', percent_off: 30, duration: 'once' } }],
            },
        }),
        sub({ id: 'monthly', status: 'active', created: nowSec - 17 * 3600 }),
        sub({ id: 'gone', status: 'canceled', created: nowSec - 300 * DAY, ended_at: nowSec - 3 * DAY }),
        sub({ id: 'leaving', status: 'active', created: nowSec - 300 * DAY, cancel_at_period_end: true, canceled_at: nowSec - 2 * DAY, cancel_at: nowSec + 20 * DAY }),
        sub({ id: 'trial', status: 'trialing', created: nowSec - DAY, trial_end: nowSec + 6 * DAY }),
    ];
    const charges = [{ id: 'ch', paid: true, status: 'succeeded', amount: 400, amount_refunded: 0, currency: 'usd', created: nowSec - 17 * 3600 + 5, invoice: 'in_m', customer: 'cus_1' }];
    const result = summarize(subs, charges, { days: 7, now: NOW, users });

    assert.deepStrictEqual(result.events.map((e) => [e.type, e.subscriptionId]), [
        ['new', 'new'], ['new', 'monthly'], ['trial', 'trial'], ['cancelling', 'leaving'], ['cancelled', 'gone'],
    ]);
    const [deal, monthly] = result.events;
    assert.strictEqual(deal.name, 'Saskia');
    assert.strictEqual(deal.plan, 'Basic');
    assert.strictEqual(deal.interval, 'yearly');
    assert.strictEqual(deal.paid, 2800);
    assert.strictEqual(deal.listPrice, 4000);
    assert.deepStrictEqual(deal.coupon, { id: 'DEAL30', name: 'Yearly deal', percentOff: 30, amountOff: null, duration: 'once' });
    assert.strictEqual(monthly.paid, 400);
    assert.strictEqual(monthly.coupon, null);
    assert.strictEqual(result.events[3].endsAt.getTime(), (nowSec + 20 * DAY) * 1000);

    // MRR moved by the two new payers minus the one that ended.
    assert.strictEqual(result.movement.newCount, 2);
    assert.strictEqual(result.movement.churnedCount, 1);
    assert.strictEqual(Math.round(result.movement.to - result.movement.from), Math.round(2800 / 12 + 400 - 400));
    assert.strictEqual(Math.round(result.movement.otherMrr), 0);
});

test('today and the daily series follow the admin time zone', () => {
    const tz = 'America/New_York';
    // NOW is 08:00 in New York on Oct 6.
    assert.strictEqual(dayStart('2026-10-06', tz), Date.UTC(2026, 9, 6, 4));
    assert.strictEqual(dayStart('2026-11-01', tz), Date.UTC(2026, 10, 1, 4)); // the day clocks go back
    assert.strictEqual(dayStart('2026-11-02', tz), Date.UTC(2026, 10, 2, 5));

    const at = (iso) => Date.parse(iso) / 1000;
    const charge = (amount, created, fields = {}) => ({ id: `${amount}-${created}`, paid: true, status: 'succeeded', amount, amount_refunded: 0, currency: 'usd', created, invoice: 'in', ...fields });
    const charges = [
        charge(2800, at('2026-10-06T06:30:00-04:00')),
        charge(400, at('2026-10-05T22:00:00-04:00'), { amount_refunded: 400, refunded: true }),
        charge(1000, at('2026-10-05T03:00:00-04:00')),
        charge(500, at('2026-09-29T12:00:00-04:00')),
    ];
    const result = summarize([], charges, { days: 7, now: NOW, users: new Map(), tz });

    assert.strictEqual(result.today.date, '2026-10-06');
    assert.strictEqual(result.today.gross, 2800);
    assert.strictEqual(result.today.yesterday, 1400); // gross, before the refund
    assert.strictEqual(result.today.yesterdaySoFar, 1000);
    assert.strictEqual(result.today.hourly.length, 9);
    assert.strictEqual(result.today.hourly[5], 0);
    assert.strictEqual(result.today.hourly[6], 2800);
    assert.strictEqual(result.today.yesterdayHourly.length, 24);
    assert.strictEqual(result.today.yesterdayHourly[23], 1400);

    assert.strictEqual(result.daily.length, 8);
    const last = result.daily[result.daily.length - 1];
    assert.deepStrictEqual([last.date, last.gross, last.prevDate, last.prevGross], ['2026-10-06', 2800, '2026-09-29', 500]);
    assert.strictEqual(result.revenue.gross, 2800 + 1400 + 500); // range starts 08:00 Sep 29
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

test('ttl cache serves a stale value at once and refreshes it in the background', async () => {
    const cache = createTtlCache(10, { staleMs: 10000 });
    let calls = 0;
    const compute = async () => { calls += 1; return calls; };

    assert.strictEqual((await cache.get('k', compute)).value, 1);
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.strictEqual((await cache.get('k', compute)).value, 1); // stale, refresh started
    await new Promise((resolve) => setTimeout(resolve, 5));
    assert.strictEqual((await cache.get('k', compute)).value, 2);
    assert.strictEqual(calls, 2);
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

test('umami stats read both v2 ({ value, prev }) and v3 (plain number) shapes', () => {
    const { normalizeStats } = require('../controllers/admin/traffic');
    const v2 = normalizeStats({ pageviews: { value: 120, prev: 90 }, visitors: { value: 40, prev: 30 }, visits: { value: 50 }, bounces: { value: 20 }, totaltime: { value: 3000 } });
    const v3 = normalizeStats({ pageviews: 120, visitors: 40, visits: 50, bounces: 20, totaltime: 3000, comparison: {} });
    assert.deepStrictEqual(v2, v3);
    assert.deepStrictEqual(normalizeStats(undefined), { pageviews: 0, visitors: 0, visits: 0, bounces: 0, totaltime: 0 });
});

test('umami daily series fills missing days and accepts both date formats', () => {
    const { toDailySeries, toList } = require('../controllers/admin/traffic');
    const rows = [{ x: '2026-10-01 00:00:00', y: 5 }, { x: '2026-10-03T00:00:00Z', y: 2 }];
    assert.deepStrictEqual(toDailySeries(rows, ['2026-10-01', '2026-10-02', '2026-10-03']), [5, 0, 2]);
    assert.deepStrictEqual(toList([{ x: '/analyze', y: 9 }, { x: '/x', y: 0 }]), [{ label: '/analyze', value: 9 }]);
});

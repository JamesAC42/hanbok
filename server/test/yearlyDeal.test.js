const test = require('node:test');
const assert = require('node:assert');
const { dealFromCoupon, getYearlyDeal, isDealEligible, isYearlyPrice, resetDealCache } = require('../utils/yearlyDeal');

const withEnv = async (vars, fn) => {
    const saved = {};
    for (const key of Object.keys(vars)) {
        saved[key] = process.env[key];
        if (vars[key] === undefined) delete process.env[key];
        else process.env[key] = vars[key];
    }
    try {
        resetDealCache();
        await fn();
    } finally {
        for (const key of Object.keys(saved)) {
            if (saved[key] === undefined) delete process.env[key];
            else process.env[key] = saved[key];
        }
        resetDealCache();
    }
};

test('reads the discount and end date from the coupon', () => {
    const now = Date.parse('2026-10-10T00:00:00Z');
    const redeemBy = Date.parse('2026-10-20T00:00:00Z') / 1000;
    assert.deepStrictEqual(
        dealFromCoupon({ id: 'c1', valid: true, percent_off: 30, duration: 'once', redeem_by: redeemBy }, now),
        { couponId: 'c1', percentOff: 30, amountOff: null, currency: null, duration: 'once', durationInMonths: null, endsAt: '2026-10-20T00:00:00.000Z' }
    );
    assert.strictEqual(dealFromCoupon({ id: 'c1', valid: false, percent_off: 30 }, now), null);
    assert.strictEqual(dealFromCoupon({ id: 'c1', valid: true, percent_off: 30, redeem_by: now / 1000 - 1 }, now), null);
    assert.strictEqual(dealFromCoupon({ id: 'c1', valid: true }, now), null);
});

test('no coupon id means no deal and no Stripe call', async () => {
    await withEnv({ YEARLY_DEAL_COUPON_ID: undefined }, async () => {
        let called = false;
        assert.strictEqual(await getYearlyDeal(async () => { called = true; }), null);
        assert.strictEqual(called, false);
    });
});

test('a Stripe error turns the deal off instead of failing', async () => {
    await withEnv({ YEARLY_DEAL_COUPON_ID: 'missing' }, async () => {
        assert.strictEqual(await getYearlyDeal(async () => { throw new Error('No such coupon'); }), null);
    });
});

test('caches the coupon between calls', async () => {
    await withEnv({ YEARLY_DEAL_COUPON_ID: 'c2' }, async () => {
        let calls = 0;
        const retrieve = async (id) => { calls++; return { id, valid: true, percent_off: 25, duration: 'once' }; };
        assert.strictEqual((await getYearlyDeal(retrieve)).percentOff, 25);
        assert.strictEqual((await getYearlyDeal(retrieve)).percentOff, 25);
        assert.strictEqual(calls, 1);
    });
});

test('only free accounts, trials and visitors get the deal', async () => {
    await withEnv({ STRIPE_STUDENT_COUPON_ID: 'student' }, async () => {
        assert.ok(isDealEligible(null));
        assert.ok(isDealEligible({ tier: 0, email: 'a@gmail.com' }));
        assert.ok(isDealEligible({ tier: 2, autoTrial: { endsAt: new Date(Date.now() + 1e8) }, email: 'a@gmail.com' }));
        assert.ok(!isDealEligible({ tier: 2, email: 'a@gmail.com' }));
        assert.ok(!isDealEligible({ tier: 0, email: 'a@mit.edu', verified: true }));
    });
});

test('applies to the yearly prices only', () => {
    assert.ok(isYearlyPrice('price_1RjhBODv6kE7GatajkAfu5cB'));
    assert.ok(!isYearlyPrice('price_1QtBf2Dv6kE7Gatasq6pq1Tc'));
});

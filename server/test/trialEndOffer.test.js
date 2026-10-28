const test = require('node:test');
const assert = require('node:assert');
const { offerEndsAt, getTrialEndOffer, trialEndOfferHours } = require('../utils/trialEndOffer');
const { resetDealCache } = require('../utils/yearlyDeal');

const HOUR = 60 * 60 * 1000;
const NOW = Date.parse('2026-10-28T12:00:00Z');
const endedUser = (hoursAgo, overrides = {}) => ({
    userId: 1, email: 'a@example.com', tier: 0,
    autoTrial: { endsAt: new Date(NOW - hoursAgo * HOUR), expiredAt: new Date(NOW - hoursAgo * HOUR) },
    ...overrides,
});

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

const coupon = async (id) => ({ id, valid: true, percent_off: 40, duration: 'once' });

test('off without a coupon id', async () => {
    await withEnv({ TRIAL_END_COUPON_ID: undefined }, async () => {
        assert.strictEqual(offerEndsAt(endedUser(1), NOW), null);
        assert.strictEqual(await getTrialEndOffer(endedUser(1), coupon, NOW), null);
    });
});

test('runs for 72 hours after the trial ends by default', async () => {
    await withEnv({ TRIAL_END_COUPON_ID: 'te1', TRIAL_END_OFFER_HOURS: undefined }, async () => {
        assert.strictEqual(trialEndOfferHours(), 72);
        const offer = await getTrialEndOffer(endedUser(10), coupon, NOW);
        assert.strictEqual(offer.couponId, 'te1');
        assert.strictEqual(offer.percentOff, 40);
        assert.strictEqual(offer.kind, 'trialEnd');
        assert.strictEqual(offer.endsAt, new Date(NOW + 62 * HOUR).toISOString());
        assert.strictEqual(await getTrialEndOffer(endedUser(73), coupon, NOW), null);
    });
});

test('only for ended trials on accounts that did not subscribe', async () => {
    await withEnv({ TRIAL_END_COUPON_ID: 'te1' }, async () => {
        // still on the trial
        assert.strictEqual(offerEndsAt({ tier: 2, autoTrial: { endsAt: new Date(NOW + HOUR) } }, NOW), null);
        // subscribed
        assert.strictEqual(offerEndsAt(endedUser(1, { tier: 1, subscription: { stripeSubscriptionId: 's' } }), NOW), null);
        // never had a trial
        assert.strictEqual(offerEndsAt({ tier: 0 }, NOW), null);
    });
});

test("the coupon's own end date wins when it comes first", async () => {
    await withEnv({ TRIAL_END_COUPON_ID: 'te2' }, async () => {
        const redeemBy = (NOW + 5 * HOUR) / 1000;
        const offer = await getTrialEndOffer(endedUser(1), async (id) => ({ id, valid: true, percent_off: 30, redeem_by: redeemBy }), NOW);
        assert.strictEqual(offer.endsAt, new Date(NOW + 5 * HOUR).toISOString());
    });
});

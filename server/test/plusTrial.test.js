const test = require('node:test');
const assert = require('node:assert');
const { plusTrialDays, isTrialEligible, isPlusPrice } = require('../utils/plusTrial');

const withDays = (value, fn) => {
    const before = process.env.PLUS_TRIAL_DAYS;
    if (value === undefined) delete process.env.PLUS_TRIAL_DAYS;
    else process.env.PLUS_TRIAL_DAYS = value;
    try { fn(); } finally {
        if (before === undefined) delete process.env.PLUS_TRIAL_DAYS;
        else process.env.PLUS_TRIAL_DAYS = before;
    }
};

test('trial is 7 days by default, PLUS_TRIAL_DAYS changes or disables it', () => {
    withDays(undefined, () => assert.strictEqual(plusTrialDays(), 7));
    withDays('14', () => assert.strictEqual(plusTrialDays(), 14));
    withDays('0', () => {
        assert.strictEqual(plusTrialDays(), 0);
        assert.strictEqual(isTrialEligible({ tier: 0 }), false);
    });
});

test('only accounts that never subscribed or trialed are eligible', () => withDays(undefined, () => {
    assert.strictEqual(isTrialEligible(null), true);
    assert.strictEqual(isTrialEligible({ tier: 0 }), true);
    assert.strictEqual(isTrialEligible({ tier: 0, hasUsedFreeTrial: true }), false);
    assert.strictEqual(isTrialEligible({ tier: 0, subscription: { stripeSubscriptionId: 'sub_1', status: 'cancelled' } }), false);
    assert.strictEqual(isTrialEligible({ tier: 1 }), false);
}));

test('trial applies to Plus prices only', () => {
    assert.strictEqual(isPlusPrice('price_1QtBf2Dv6kE7Gatasq6pq1Tc'), true);
    assert.strictEqual(isPlusPrice('price_1RjhBODv6kE7GatajkAfu5cB'), true);
    assert.strictEqual(isPlusPrice('price_1R94kODv6kE7Gata9Zwzvvom'), false);
});

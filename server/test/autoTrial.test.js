const test = require('node:test');
const assert = require('node:assert');
const { autoTrialFields, expireIfDue, trialEndsAt, isPaying } = require('../utils/autoTrial');
const { isTrialEligible } = require('../utils/plusTrial');

const DAY = 24 * 60 * 60 * 1000;
const now = new Date('2026-10-10T12:00:00Z');

const withEnv = (vars, fn) => {
    const before = Object.fromEntries(Object.keys(vars).map((k) => [k, process.env[k]]));
    for (const [k, v] of Object.entries(vars)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
    }
    const restore = () => {
        for (const [k, v] of Object.entries(before)) {
            if (v === undefined) delete process.env[k];
            else process.env[k] = v;
        }
    };
    try {
        const result = fn();
        if (result && typeof result.then === 'function') return result.finally(restore);
        restore();
        return result;
    } catch (error) {
        restore();
        throw error;
    }
};

test('new accounts get nothing unless AUTO_TRIAL_ENABLED=true', () => {
    withEnv({ AUTO_TRIAL_ENABLED: undefined, PLUS_TRIAL_DAYS: undefined }, () => {
        assert.deepStrictEqual(autoTrialFields(now), {});
    });
    withEnv({ AUTO_TRIAL_ENABLED: 'true', PLUS_TRIAL_DAYS: '0' }, () => {
        assert.deepStrictEqual(autoTrialFields(now), {});
    });
});

test('when enabled, new accounts start on Plus for PLUS_TRIAL_DAYS', () => {
    withEnv({ AUTO_TRIAL_ENABLED: 'true', PLUS_TRIAL_DAYS: undefined }, () => {
        assert.deepStrictEqual(autoTrialFields(now), {
            tier: 2,
            autoTrial: { startedAt: now, endsAt: new Date(now.getTime() + 7 * DAY) },
        });
    });
});

test('a running trial is not paying, a subscription is', () => {
    const trial = { tier: 2, autoTrial: { startedAt: now, endsAt: new Date(now.getTime() + DAY) } };
    assert.strictEqual(trialEndsAt(trial), trial.autoTrial.endsAt);
    assert.strictEqual(isPaying(trial), false);

    const subscribed = { ...trial, subscription: { stripeSubscriptionId: 'sub_1' } };
    assert.strictEqual(trialEndsAt(subscribed), null);
    assert.strictEqual(isPaying(subscribed), true);

    const ended = { tier: 0, autoTrial: { ...trial.autoTrial, expiredAt: now } };
    assert.strictEqual(trialEndsAt(ended), null);
    assert.strictEqual(isPaying(ended), false);
    assert.strictEqual(isPaying({ tier: 1 }), true);
});

test('an account that had the no-card trial gets no second trial at checkout', () => {
    withEnv({ PLUS_TRIAL_DAYS: undefined }, () => {
        assert.strictEqual(isTrialEligible({ tier: 0, autoTrial: { startedAt: now, endsAt: now, expiredAt: now } }), false);
        assert.strictEqual(isTrialEligible({ tier: 0 }), true);
    });
});

const fakeDb = () => {
    const calls = [];
    return {
        calls,
        collection: () => ({ updateOne: async (filter, update) => { calls.push({ filter, update }); return { modifiedCount: 1 }; } }),
    };
};

test('a due trial ends on the next page load, a running one does not', async () => {
    const db = fakeDb();
    const running = { userId: 5, tier: 2, autoTrial: { startedAt: now, endsAt: new Date(now.getTime() + DAY) } };
    assert.strictEqual(await expireIfDue(db, running, now), running);
    assert.strictEqual(db.calls.length, 0);

    const due = { userId: 6, tier: 2, autoTrial: { startedAt: now, endsAt: new Date(now.getTime() - 1) } };
    const after = await expireIfDue(db, due, now);
    assert.strictEqual(after.tier, 0);
    assert.strictEqual(trialEndsAt(after), null);
    assert.strictEqual(db.calls.length, 1);
    assert.strictEqual(db.calls[0].filter.userId, 6);
    assert.deepStrictEqual(db.calls[0].update, { $set: { tier: 0, 'autoTrial.expiredAt': now } });
});

test('a trial user who subscribed keeps their plan', async () => {
    const db = fakeDb();
    const user = { userId: 7, tier: 1, subscription: { stripeSubscriptionId: 'sub_2' }, autoTrial: { startedAt: now, endsAt: new Date(now.getTime() - DAY) } };
    assert.strictEqual(await expireIfDue(db, user, now), user);
    assert.strictEqual(db.calls.length, 0);
});

test('returning free accounts a week old get one trial on their next visit', async () => {
    const { isReturningTrialEligible, startReturningTrialIfEligible, carryOverTrialEnd } = require('../utils/autoTrial');
    const old = { userId: 5, tier: 0, dateCreated: new Date(now - 30 * DAY) };
    assert.strictEqual(isReturningTrialEligible(old, now), true);
    assert.strictEqual(isReturningTrialEligible({ ...old, dateCreated: new Date(now - 2 * DAY) }, now), false);
    assert.strictEqual(isReturningTrialEligible({ ...old, autoTrial: { endsAt: now, expiredAt: now } }, now), false);
    assert.strictEqual(isReturningTrialEligible({ ...old, hasUsedFreeTrial: true }, now), false);
    assert.strictEqual(isReturningTrialEligible({ ...old, tier: 1 }, now), false);
    assert.strictEqual(isReturningTrialEligible({ ...old, subscription: { stripeSubscriptionId: 's' } }, now), false);

    let update = null;
    const db = { collection: () => ({ updateOne: async (filter, change) => { update = { filter, change }; return { modifiedCount: 1 }; } }) };
    await withEnv({ RETURNING_TRIAL_ENABLED: undefined }, async () => {
        assert.strictEqual(await startReturningTrialIfEligible(db, old, now), old);
        assert.strictEqual(update, null);
    });
    await withEnv({ RETURNING_TRIAL_ENABLED: 'true', PLUS_TRIAL_DAYS: undefined }, async () => {
        const user = await startReturningTrialIfEligible(db, old, now);
        assert.strictEqual(user.tier, 2);
        assert.strictEqual(user.autoTrial.source, 'returning');
        assert.strictEqual(new Date(user.autoTrial.endsAt).getTime(), now.getTime() + 7 * DAY);
        assert.strictEqual(update.filter.userId, 5);
        assert.deepStrictEqual(update.filter.autoTrial, { $exists: false });
        // a plan bought on day 1 starts billing when the trial would have ended
        assert.strictEqual(carryOverTrialEnd(user, now.getTime()).getTime(), now.getTime() + 7 * DAY);
        assert.strictEqual(carryOverTrialEnd({ ...user, autoTrial: { endsAt: new Date(now.getTime() + DAY) } }, now.getTime()), null);
    });
});

// No-card Plus trial: new accounts start on Plus for PLUS_TRIAL_DAYS and drop
// back to Free when it ends, unless they subscribed in the meantime. OFF unless
// AUTO_TRIAL_ENABLED=true. Existing trials still expire if the flag is turned off.
const { plusTrialDays } = require('./plusTrial');

const DAY = 24 * 60 * 60 * 1000;
const SWEEP_INTERVAL_MS = 10 * 60 * 1000;

const isAutoTrialEnabled = (env = process.env) => env.AUTO_TRIAL_ENABLED === 'true' && plusTrialDays() > 0;

// Fields to merge into a brand-new user document.
const autoTrialFields = (now = new Date()) => {
    if (!isAutoTrialEnabled()) return {};
    return {
        tier: 2,
        autoTrial: { startedAt: now, endsAt: new Date(now.getTime() + plusTrialDays() * DAY) },
    };
};

// A trial that has run out, on an account that never subscribed.
const dueFilter = (now) => ({
    'autoTrial.endsAt': { $lte: now },
    'autoTrial.expiredAt': { $exists: false },
    'subscription.stripeSubscriptionId': { $exists: false },
});
const expireUpdate = (now) => ({ $set: { tier: 0, 'autoTrial.expiredAt': now } });

const expireAutoTrials = async (db, now = new Date()) => {
    const result = await db.collection('users').updateMany(dueFilter(now), expireUpdate(now));
    return result.modifiedCount || 0;
};

// Ends this user's trial right away if it is due, so the page they load is
// accurate without waiting for the sweep. Returns the user as it now is.
const expireIfDue = async (db, user, now = new Date()) => {
    const trial = user?.autoTrial;
    if (!trial || trial.expiredAt || user.subscription?.stripeSubscriptionId) return user;
    if (new Date(trial.endsAt) > now) return user;
    await db.collection('users').updateOne({ userId: user.userId, ...dueFilter(now) }, expireUpdate(now));
    return { ...user, tier: 0, autoTrial: { ...trial, expiredAt: now } };
};

// When the running trial ends, for the client; null when there is none.
const trialEndsAt = (user) => {
    const trial = user?.autoTrial;
    if (!trial || trial.expiredAt || user.subscription?.stripeSubscriptionId) return null;
    return trial.endsAt;
};

// Subscribing during the trial keeps the days left: checkout starts the
// subscription as a Stripe trial ending when this one would have, so nobody
// loses free days by paying early. Stripe Checkout needs trial_end at least 48
// hours out, so with less left than that they're simply charged now.
const MIN_CARRY_OVER_MS = 49 * 60 * 60 * 1000;
const carryOverTrialEnd = (user, now = Date.now()) => {
    const endsAt = trialEndsAt(user);
    if (!endsAt) return null;
    const end = new Date(endsAt);
    return end.getTime() - now >= MIN_CARRY_OVER_MS ? end : null;
};

// When this account's trial ran out without a subscription; null otherwise.
const trialEndedAt = (user) => {
    const trial = user?.autoTrial;
    if (!trial?.expiredAt || user.subscription?.stripeSubscriptionId || user.tier > 0) return null;
    return trial.expiredAt;
};

// Paid tier from a real subscription, not a running trial. Use these anywhere
// tier > 0 is read as "paying" (admin stats, affiliates, the snapshot).
const isPaying = (user) => user?.tier > 0 && !trialEndsAt(user);
const missing = (field) => ({ $eq: [{ $type: field }, 'missing'] });
const ON_TRIAL_EXPR = { $and: [
    { $not: [missing('$autoTrial.endsAt')] },
    missing('$autoTrial.expiredAt'),
    missing('$subscription.stripeSubscriptionId'),
] };
const PAYING_EXPR = { $and: [{ $gt: ['$tier', 0] }, { $not: [ON_TRIAL_EXPR] }] };
// Fields isPaying needs in a projection.
const PAYING_PROJECTION = { tier: 1, autoTrial: 1, 'subscription.stripeSubscriptionId': 1 };

const startAutoTrialExpiry = (getDb) => {
    const tick = () => expireAutoTrials(getDb())
        .then((count) => { if (count) console.log(`Auto trial: ${count} trial(s) ended`); })
        .catch((error) => console.error('Auto trial expiry failed:', error.message));
    tick();
    const timer = setInterval(tick, SWEEP_INTERVAL_MS);
    timer.unref?.();
    return timer;
};

module.exports = {
    isAutoTrialEnabled, autoTrialFields, expireAutoTrials, expireIfDue, trialEndsAt, trialEndedAt, carryOverTrialEnd, startAutoTrialExpiry,
    isPaying, ON_TRIAL_EXPR, PAYING_EXPR, PAYING_PROJECTION,
};

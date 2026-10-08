// Free trial of Plus for accounts that have never subscribed. Card is taken at
// checkout and charged when the trial ends unless the subscription is cancelled.
// PLUS_TRIAL_DAYS sets the length (default 7); 0 turns the trial off.
const PLUS_PRICE_IDS = [
    'price_1QtBf2Dv6kE7Gatasq6pq1Tc', // PLUS_SUBSCRIPTION
    'price_1RjhBODv6kE7GatajkAfu5cB', // PLUS_SUBSCRIPTION_YEARLY
];

const plusTrialDays = () => {
    const days = parseInt(process.env.PLUS_TRIAL_DAYS, 10);
    if (Number.isNaN(days)) return 7;
    return Math.max(0, Math.min(days, 30));
};

// Signed-out visitors count as eligible: they'll make a fresh account at checkout.
const isTrialEligible = (user) => {
    if (plusTrialDays() === 0) return false;
    if (!user) return true;
    return user.hasUsedFreeTrial !== true
        && !user.subscription?.stripeSubscriptionId
        && !(user.tier > 0);
};

const isPlusPrice = (priceId) => PLUS_PRICE_IDS.includes(priceId);

module.exports = { plusTrialDays, isTrialEligible, isPlusPrice, PLUS_PRICE_IDS };

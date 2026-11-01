// A personal offer for the hours right after someone's no-card Plus trial ends:
// a Stripe coupon on the yearly plans, applied automatically at checkout, that
// runs out TRIAL_END_OFFER_HOURS (default 72) after the trial ended. Off until
// TRIAL_END_COUPON_ID names a coupon. The discount itself is read from the
// coupon, the same way as the yearly deal (utils/yearlyDeal).
const { trialEndedAt } = require('./autoTrial');
const { isStudentEligible } = require('./studentDiscount');
const { getCouponDeal } = require('./yearlyDeal');

const HOUR = 60 * 60 * 1000;

const trialEndCouponId = (env = process.env) => env.TRIAL_END_COUPON_ID || null;

const trialEndOfferHours = (env = process.env) => {
    const hours = parseInt(env.TRIAL_END_OFFER_HOURS, 10);
    if (Number.isNaN(hours) || hours <= 0) return 72;
    return Math.min(hours, 24 * 14);
};

// When this user's offer runs out, or null if they don't have one right now.
// Students keep their own coupon since Stripe applies only one.
const offerEndsAt = (user, now = Date.now()) => {
    if (!trialEndCouponId()) return null;
    const ended = trialEndedAt(user);
    if (!ended || isStudentEligible(user)) return null;
    const endsAt = new Date(ended).getTime() + trialEndOfferHours() * HOUR;
    return endsAt > now ? new Date(endsAt) : null;
};

// The offer as a deal (same shape as the yearly deal), or null. The deal ends at
// the personal deadline, or earlier if the coupon's own "Redeem by" comes first.
const getTrialEndOffer = async (user, retrieveCoupon, now = Date.now()) => {
    const personalEnd = offerEndsAt(user, now);
    if (!personalEnd) return null;
    const deal = await getCouponDeal(trialEndCouponId(), retrieveCoupon, now);
    if (!deal) return null;
    const couponEnd = deal.endsAt ? new Date(deal.endsAt) : null;
    const endsAt = couponEnd && couponEnd < personalEnd ? couponEnd : personalEnd;
    return { ...deal, endsAt: endsAt.toISOString(), kind: 'trialEnd' };
};

module.exports = { trialEndCouponId, trialEndOfferHours, offerEndsAt, getTrialEndOffer };

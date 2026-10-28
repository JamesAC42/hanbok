// Time-limited deal on the yearly plans. Off until YEARLY_DEAL_COUPON_ID names a
// Stripe coupon. Everything shown to visitors (the discount, how long it lasts,
// when it ends) is read from that coupon, so the site can't promise a deal
// Stripe won't honour. Set "Redeem by" on the coupon to give the deal an end date.
const { isPaying } = require('./autoTrial');
const { isStudentEligible } = require('./studentDiscount');

const YEARLY_PRICE_IDS = [
    'price_1Rjh9EDv6kE7GataEdXl4ICx', // BASIC_SUBSCRIPTION_YEARLY
    'price_1RjhBODv6kE7GatajkAfu5cB', // PLUS_SUBSCRIPTION_YEARLY
];

const CACHE_MS = 10 * 60 * 1000;
const cache = new Map(); // couponId -> { at, raw }

const dealCouponId = (env = process.env) => env.YEARLY_DEAL_COUPON_ID || null;

const isYearlyPrice = (priceId) => YEARLY_PRICE_IDS.includes(priceId);

// The parts of a Stripe coupon the site shows, or null when it can't be used.
const dealFromCoupon = (coupon, now = Date.now()) => {
    if (!coupon || coupon.valid === false || coupon.deleted) return null;
    if (!coupon.percent_off && !coupon.amount_off) return null;
    if (coupon.redeem_by && coupon.redeem_by * 1000 <= now) return null;
    return {
        couponId: coupon.id,
        percentOff: coupon.percent_off || null,
        amountOff: coupon.amount_off ? coupon.amount_off / 100 : null,
        currency: coupon.currency || null,
        duration: coupon.duration, // once | repeating | forever
        durationInMonths: coupon.duration_in_months || null,
        endsAt: coupon.redeem_by ? new Date(coupon.redeem_by * 1000).toISOString() : null,
    };
};

// Any coupon as a deal, or null. Cached for a few minutes per coupon.
// retrieveCoupon is stripe.coupons.retrieve.
const getCouponDeal = async (couponId, retrieveCoupon, now = Date.now()) => {
    if (!couponId) return null;
    const hit = cache.get(couponId);
    if (hit && now - hit.at < CACHE_MS) return dealFromCoupon(hit.raw, now);
    let raw = null;
    try {
        raw = await retrieveCoupon(couponId);
    } catch (error) {
        console.error(`Error loading coupon ${couponId}:`, error.message);
    }
    cache.set(couponId, { at: now, raw });
    return dealFromCoupon(raw, now);
};

// The live yearly deal, or null.
const getYearlyDeal = (retrieveCoupon, now = Date.now()) => getCouponDeal(dealCouponId(), retrieveCoupon, now);

// Signed-out visitors and free accounts (including anyone on the no-card trial)
// get the deal. Paying subscribers don't, and students keep their own coupon
// since Stripe applies only one.
const isDealEligible = (user) => {
    if (!user) return true;
    if (isPaying(user)) return false;
    return !isStudentEligible(user);
};

const resetDealCache = () => { cache.clear(); };

module.exports = { YEARLY_PRICE_IDS, dealCouponId, isYearlyPrice, dealFromCoupon, getCouponDeal, getYearlyDeal, isDealEligible, resetDealCache };

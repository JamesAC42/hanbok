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
let cache = null; // { couponId, at, raw }

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

// The live deal, or null. retrieveCoupon is stripe.coupons.retrieve.
const getYearlyDeal = async (retrieveCoupon, now = Date.now()) => {
    const couponId = dealCouponId();
    if (!couponId) return null;
    if (cache && cache.couponId === couponId && now - cache.at < CACHE_MS) {
        return dealFromCoupon(cache.raw, now);
    }
    try {
        const raw = await retrieveCoupon(couponId);
        cache = { couponId, at: now, raw };
    } catch (error) {
        console.error('Error loading yearly deal coupon:', error.message);
        cache = { couponId, at: now, raw: null };
    }
    return dealFromCoupon(cache.raw, now);
};

// Signed-out visitors and free accounts (including anyone on the no-card trial)
// get the deal. Paying subscribers don't, and students keep their own coupon
// since Stripe applies only one.
const isDealEligible = (user) => {
    if (!user) return true;
    if (isPaying(user)) return false;
    return !isStudentEligible(user);
};

const resetDealCache = () => { cache = null; };

module.exports = { YEARLY_PRICE_IDS, dealCouponId, isYearlyPrice, dealFromCoupon, getYearlyDeal, isDealEligible, resetDealCache };

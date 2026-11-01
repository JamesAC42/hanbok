const { getDb } = require('../database');
const { isSchoolEmail, isStudentEligible, studentCouponId, studentDiscountPercent } = require('../utils/studentDiscount');
const { plusTrialDays, isTrialEligible } = require('../utils/plusTrial');
const { getYearlyDeal, isDealEligible } = require('../utils/yearlyDeal');
const { getTrialEndOffer } = require('../utils/trialEndOffer');
const { carryOverTrialEnd } = require('../utils/autoTrial');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const retrieveCoupon = (id) => stripe.coupons.retrieve(id);

// What the pricing page should say about the student price for this visitor.
const getPricingOffer = async (req, res) => {
    const enabled = !!studentCouponId();
    const offer = {
        student: { enabled, percent: studentDiscountPercent(), eligible: false, schoolEmail: false },
        trial: { days: plusTrialDays(), eligible: isTrialEligible(null) },
        // On the no-card trial with 2+ days left: a plan bought now starts billing when the trial ends
        trialCarryOver: null,
        deal: null
    };
    const deal = await getYearlyDeal(retrieveCoupon);
    if (deal) {
        const { couponId, ...shown } = deal;
        offer.deal = { ...shown, eligible: true };
    }

    const userId = req.session?.user?.userId;
    if (userId) {
        try {
            const user = await getDb().collection('users').findOne({ userId }, {
                projection: { email: 1, verified: 1, googleId: 1, tier: 1, hasUsedFreeTrial: 1, autoTrial: 1, 'subscription.stripeSubscriptionId': 1 }
            });
            offer.trial.eligible = isTrialEligible(user);
            const carryOver = carryOverTrialEnd(user);
            if (carryOver) offer.trialCarryOver = { endsAt: carryOver.toISOString() };
            if (offer.deal) offer.deal.eligible = isDealEligible(user);
            // Right after a no-card trial ends, their personal offer replaces the yearly deal.
            const trialEnd = await getTrialEndOffer(user, retrieveCoupon);
            if (trialEnd) {
                const { couponId, ...shown } = trialEnd;
                offer.deal = { ...shown, eligible: true };
            }
            if (enabled) {
                offer.student.schoolEmail = isSchoolEmail(user?.email);
                offer.student.eligible = isStudentEligible(user);
            }
        } catch (error) {
            console.error('Error checking pricing offer:', error);
        }
    }

    res.json({ success: true, ...offer });
};

module.exports = getPricingOffer;

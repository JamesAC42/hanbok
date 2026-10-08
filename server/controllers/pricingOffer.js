const { getDb } = require('../database');
const { isSchoolEmail, isStudentEligible, studentCouponId, studentDiscountPercent } = require('../utils/studentDiscount');
const { plusTrialDays, isTrialEligible } = require('../utils/plusTrial');

// What the pricing page should say about the student price for this visitor.
const getPricingOffer = async (req, res) => {
    const enabled = !!studentCouponId();
    const offer = {
        student: { enabled, percent: studentDiscountPercent(), eligible: false, schoolEmail: false },
        trial: { days: plusTrialDays(), eligible: isTrialEligible(null) }
    };

    const userId = req.session?.user?.userId;
    if (userId) {
        try {
            const user = await getDb().collection('users').findOne({ userId }, {
                projection: { email: 1, verified: 1, googleId: 1, tier: 1, hasUsedFreeTrial: 1, 'subscription.stripeSubscriptionId': 1 }
            });
            offer.trial.eligible = isTrialEligible(user);
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

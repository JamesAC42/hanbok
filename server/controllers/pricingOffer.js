const { getDb } = require('../database');
const { isSchoolEmail, isStudentEligible, studentCouponId, studentDiscountPercent } = require('../utils/studentDiscount');

// What the pricing page should say about the student price for this visitor.
const getPricingOffer = async (req, res) => {
    const enabled = !!studentCouponId();
    const offer = { student: { enabled, percent: studentDiscountPercent(), eligible: false, schoolEmail: false } };

    const userId = req.session?.user?.userId;
    if (enabled && userId) {
        try {
            const user = await getDb().collection('users').findOne({ userId }, { projection: { email: 1, verified: 1, googleId: 1 } });
            offer.student.schoolEmail = isSchoolEmail(user?.email);
            offer.student.eligible = isStudentEligible(user);
        } catch (error) {
            console.error('Error checking pricing offer:', error);
        }
    }

    res.json({ success: true, ...offer });
};

module.exports = getPricingOffer;

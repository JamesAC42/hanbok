// Student price: accounts on a school email (.edu, .ac.uk, .edu.au, ...) get a
// Stripe coupon applied at checkout. Off until STRIPE_STUDENT_COUPON_ID is set.
const SCHOOL_DOMAIN = /(^|\.)(edu|ac\.[a-z]{2}|edu\.[a-z]{2}|k12\.[a-z]{2}\.us)$/i;

const isSchoolEmail = (email) => {
    if (typeof email !== 'string') return false;
    const domain = email.trim().toLowerCase().split('@')[1];
    return !!domain && SCHOOL_DOMAIN.test(domain);
};

const studentCouponId = () => process.env.STRIPE_STUDENT_COUPON_ID || null;

const studentDiscountPercent = () => {
    const percent = parseInt(process.env.STUDENT_DISCOUNT_PERCENT, 10);
    return Number.isFinite(percent) && percent > 0 && percent < 100 ? percent : 50;
};

// Email signups must have verified the address; Google accounts are verified by Google.
const isStudentEligible = (user) => {
    if (!studentCouponId() || !user) return false;
    const verified = user.verified === true || !!user.googleId;
    return verified && isSchoolEmail(user.email);
};

module.exports = { isSchoolEmail, isStudentEligible, studentCouponId, studentDiscountPercent };

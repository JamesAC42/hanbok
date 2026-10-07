const test = require('node:test');
const assert = require('node:assert');
const { isSchoolEmail, isStudentEligible, studentDiscountPercent } = require('../utils/studentDiscount');

test('recognizes school email domains', () => {
    for (const email of ['a@mit.edu', 'b@cs.stanford.edu', 'c@ox.ac.uk', 'd@snu.ac.kr', 'e@unimelb.edu.au', 'F@Students.UCLA.EDU']) {
        assert.ok(isSchoolEmail(email), email);
    }
    for (const email of ['a@gmail.com', 'b@education.com', 'c@edu.com', 'd@mac.com', '', null, 'noatsign.edu']) {
        assert.ok(!isSchoolEmail(email), String(email));
    }
});

test('eligibility needs a coupon, a school email and a verified address', () => {
    const saved = process.env.STRIPE_STUDENT_COUPON_ID;
    try {
        delete process.env.STRIPE_STUDENT_COUPON_ID;
        assert.ok(!isStudentEligible({ email: 'a@mit.edu', verified: true }));

        process.env.STRIPE_STUDENT_COUPON_ID = 'coupon_test';
        assert.ok(isStudentEligible({ email: 'a@mit.edu', verified: true }));
        assert.ok(isStudentEligible({ email: 'a@mit.edu', googleId: 'g1' }));
        assert.ok(!isStudentEligible({ email: 'a@mit.edu', verified: false }));
        assert.ok(!isStudentEligible({ email: 'a@gmail.com', verified: true }));
    } finally {
        if (saved === undefined) delete process.env.STRIPE_STUDENT_COUPON_ID;
        else process.env.STRIPE_STUDENT_COUPON_ID = saved;
    }
});

test('discount percent defaults to 50 and ignores bad values', () => {
    const saved = process.env.STUDENT_DISCOUNT_PERCENT;
    try {
        delete process.env.STUDENT_DISCOUNT_PERCENT;
        assert.strictEqual(studentDiscountPercent(), 50);
        process.env.STUDENT_DISCOUNT_PERCENT = '40';
        assert.strictEqual(studentDiscountPercent(), 40);
        process.env.STUDENT_DISCOUNT_PERCENT = 'abc';
        assert.strictEqual(studentDiscountPercent(), 50);
    } finally {
        if (saved === undefined) delete process.env.STUDENT_DISCOUNT_PERCENT;
        else process.env.STUDENT_DISCOUNT_PERCENT = saved;
    }
});

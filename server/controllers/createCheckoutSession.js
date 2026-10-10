const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getDb } = require('../database');
const { isStudentEligible, studentCouponId } = require('../utils/studentDiscount');
const { plusTrialDays, isTrialEligible, isPlusPrice } = require('../utils/plusTrial');

const createCheckoutSession = async (req, res) => {
    const { priceId } = req.body;
    const userId = req.session.user.userId;

    console.log('Creating checkout session for user:', userId);

    try {
        // Get the price details to check if it's recurring
        const price = await stripe.prices.retrieve(priceId);
        const isSubscription = price.type === 'recurring';

        const db = getDb();
        const user = await db.collection('users').findOne({ userId });

        // New subscribers get a free trial of Plus (monthly or yearly)
        const withTrial = isSubscription && isPlusPrice(priceId) && isTrialEligible(user);

        // Base session configuration
        const sessionConfig = {
            mode: isSubscription ? 'subscription' : 'payment',
            payment_method_types: ['card'],
            line_items: [{
                price: priceId,
                quantity: 1,
            }],
            metadata: {
                priceId: priceId
            },
            allow_promotion_codes: true,
            success_url: 'https://hanbokstudy.com/success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url: 'https://hanbokstudy.com/pricing',
            client_reference_id: userId.toString(),
        };

        if (withTrial) {
            sessionConfig.subscription_data = {
                trial_period_days: plusTrialDays(),
                trial_settings: {
                    end_behavior: {
                        missing_payment_method: 'cancel',
                    },
                },
            };
            sessionConfig.metadata.trial = 'true';
        }

        // Students get their coupon applied automatically. Stripe allows either a
        // discount or the promo-code box, not both.
        if (isSubscription) {
            if (isStudentEligible(user)) {
                sessionConfig.discounts = [{ coupon: studentCouponId() }];
                delete sessionConfig.allow_promotion_codes;
                sessionConfig.metadata.student = 'true';
            }
        }

        const session = await stripe.checkout.sessions.create(sessionConfig);

        console.log('Created session with ID:', session.id);
        console.log('With metadata:', session.metadata);
        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
};

module.exports = createCheckoutSession;

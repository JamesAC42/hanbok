const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getDb } = require('../database');

const createCheckoutSession = async (req, res) => {
    const { priceId } = req.body;
    const userId = req.session.user.userId;

    console.log('Creating checkout session for user:', userId);

    try {
        // Get the price details to check if it's recurring
        const price = await stripe.prices.retrieve(priceId);
        const isSubscription = price.type === 'recurring';

        // Check if this is a monthly subscription for trial (exclude yearly)
        const MONTHLY_SUBSCRIPTION_PRICE_IDS = [
            'price_1R94kODv6kE7Gata9Zwzvvom', // BASIC_SUBSCRIPTION
            'price_1QtBf2Dv6kE7Gatasq6pq1Tc', // PLUS_SUBSCRIPTION
        ];
        const isMonthlySubscription = MONTHLY_SUBSCRIPTION_PRICE_IDS.includes(priceId);

        // Check if user has already used their free trial
        let userHasUsedTrial = false;
        if (isSubscription && isMonthlySubscription) {
            const db = getDb();
            const user = await db.collection('users').findOne({ userId });
            userHasUsedTrial = user?.hasUsedFreeTrial === true;
            console.log('User has used free trial:', userHasUsedTrial);
        }

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

        // Add trial settings for monthly subscriptions (only if user hasn't used trial yet)
        if (isSubscription && isMonthlySubscription && !userHasUsedTrial) {
            sessionConfig.subscription_data = {
                trial_period_days: 7,
                trial_settings: {
                    end_behavior: {
                        missing_payment_method: 'cancel',
                    },
                },
            };
            sessionConfig.payment_method_collection = 'if_required';
            console.log('Applying 7-day free trial to checkout session');
        } else if (isSubscription && isMonthlySubscription && userHasUsedTrial) {
            console.log('User has already used free trial, no trial applied');
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

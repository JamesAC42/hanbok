const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createCheckoutSession = async (req, res) => {
    const { priceId } = req.body;
    const userId = req.session.user.userId;

    console.log('Creating checkout session for user:', userId);

    try {
        // Get the price details to check if it's recurring
        const price = await stripe.prices.retrieve(priceId);
        const isSubscription = price.type === 'recurring';

        const session = await stripe.checkout.sessions.create({
            mode: isSubscription ? 'subscription' : 'payment',
            payment_method_types: ['card'],
            line_items: [{
                price: priceId,
                quantity: 1,
            }],
            metadata: {
                priceId: priceId
            },
            success_url: 'https://hanbokstudy.com/success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url: 'https://hanbokstudy.com/pricing',
            client_reference_id: userId.toString(),
        });

        console.log('Created session with ID:', session.id);
        console.log('With metadata:', session.metadata);
        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
};

module.exports = createCheckoutSession;

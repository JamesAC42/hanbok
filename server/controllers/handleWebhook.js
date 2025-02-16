const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getDb } = require('../database');
const handleCheckoutComplete = require('./auth/handleCheckoutComplete');

// Events we care about and want to log
const IMPORTANT_EVENTS = [
    'checkout.session.completed',
    'customer.subscription.deleted',
    'payment_intent.payment_failed'
];

const handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook Error:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        // Only log important events
        if (IMPORTANT_EVENTS.includes(event.type)) {
            console.log('Processing event:', event.type);
        }

        const db = getDb();
        
        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                console.log('\n=== Checkout Session Completed ===');
                console.log('Session ID:', session.id);
                console.log('User ID:', session.client_reference_id);
                console.log('Price ID:', session.metadata.priceId);
                console.log('Amount:', session.amount_total);
                if (session.subscription) {
                    console.log('Subscription ID:', session.subscription);
                    console.log('Customer ID:', session.customer);
                }
                console.log('================================\n');
                await handleCheckoutComplete(session);
                break;
                
            case 'customer.subscription.deleted':
                const subscription = event.data.object;
                await db.collection('users').updateOne(
                    { 'subscription.stripeSubscriptionId': subscription.id },
                    { 
                        $set: { 
                            tier: 0,
                            maxSavedSentences: 30,
                            maxSavedWords: 60,
                            remainingAudioGenerations: 10,
                            'subscription.status': 'cancelled',
                            'subscription.endDate': new Date()
                        }
                    }
                );
                break;

            case 'payment_intent.payment_failed':
                const paymentIntent = event.data.object;
                console.error('Payment failed:', paymentIntent.id);
                break;

            default:
                // Don't log unhandled events that aren't important
                if (IMPORTANT_EVENTS.includes(event.type)) {
                    console.log(`Unhandled important event type ${event.type}`);
                }
        }
    } catch (error) {
        console.error('Error processing webhook:', error);
        return res.status(500).json({ error: 'Webhook handler failed' });
    }

    res.json({received: true});
};

module.exports = handleWebhook;

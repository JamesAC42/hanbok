const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getDb } = require('../database');
const handleCheckoutComplete = require('./auth/handleCheckoutComplete');

// Events we care about and want to log
const IMPORTANT_EVENTS = [
    'checkout.session.completed',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'payment_intent.payment_failed',
    'customer.subscription.trial_will_end',
    'invoice.payment_failed'
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
        
        // Helper function to downgrade user
        const downgradeUser = async (subscriptionId) => {
            const user = await db.collection('users').findOne({ 
                'subscription.stripeSubscriptionId': subscriptionId 
            });
            
            if (user) {
                console.log(`Downgrading user ${user.userId} for subscription ${subscriptionId}`);
                await db.collection('users').updateOne(
                    { 'subscription.stripeSubscriptionId': subscriptionId },
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
                return user;
            }
            return null;
        };

        // Helper function to handle subscription updates (upgrades/downgrades)
        const handleSubscriptionUpdate = async (subscription) => {
            try {
                // Get the current price/plan from the subscription
                const priceId = subscription.items?.data?.[0]?.price?.id;
                if (!priceId) {
                    console.log('No price ID found in subscription update');
                    return;
                }

                console.log('Subscription update - Price ID:', priceId);

                // Map price IDs to tiers
                const TIER_MAPPING = {
                    'price_1R94kODv6kE7Gata9Zwzvvom': 1, // BASIC_SUBSCRIPTION
                    'price_1Rjh9EDv6kE7GataEdXl4ICx': 1, // BASIC_SUBSCRIPTION_YEARLY
                    'price_1QtBf2Dv6kE7Gatasq6pq1Tc': 2, // PLUS_SUBSCRIPTION
                    'price_1RjhBODv6kE7GatajkAfu5cB': 2, // PLUS_SUBSCRIPTION_YEARLY
                };

                const newTier = TIER_MAPPING[priceId];
                if (newTier === undefined) {
                    console.log('Unknown price ID for subscription update:', priceId);
                    return;
                }

                // Find user by subscription ID
                const user = await db.collection('users').findOne({ 
                    'subscription.stripeSubscriptionId': subscription.id 
                });

                if (!user) {
                    console.log('No user found for subscription ID:', subscription.id);
                    return;
                }

                console.log(`Updating user ${user.userId} to tier ${newTier}`);

                // Prepare subscription update
                const subscriptionUpdate = {
                    tier: newTier,
                    'subscription.status': subscription.status,
                    'subscription.startDate': new Date(subscription.current_period_start * 1000),
                    'subscription.stripeSubscriptionId': subscription.id,
                    'subscription.customerId': subscription.customer
                };

                // Check if this subscription has a trial and mark it as used
                if (subscription.trial_end && subscription.trial_end > Date.now() / 1000) {
                    subscriptionUpdate.hasUsedFreeTrial = true;
                    console.log('Marking user as having used free trial (subscription update)');
                }

                // Update user
                await db.collection('users').updateOne(
                    { userId: user.userId },
                    { $set: subscriptionUpdate }
                );

                console.log(`Successfully updated user ${user.userId} tier to ${newTier}`);

            } catch (error) {
                console.error('Error handling subscription update:', error);
            }
        };

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
                
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
                const subscription = event.data.object;
                const isDeleted = event.type === 'customer.subscription.deleted';
                
                console.log(`\n=== Subscription ${isDeleted ? 'Deleted' : 'Updated'} ===`);
                console.log('Subscription ID:', subscription.id);
                console.log('Status:', subscription.status);
                if (subscription.cancellation_details?.reason) {
                    console.log('Cancel reason:', subscription.cancellation_details.reason);
                }
                if (subscription.trial_end) {
                    console.log('Was in trial:', subscription.status === 'trialing' ? 'Yes' : 'No');
                }
                console.log('============================\n');
                
                // Handle subscription updates (upgrades/downgrades/status changes)
                if (!isDeleted && subscription.status === 'active') {
                    await handleSubscriptionUpdate(subscription);
                }
                
                // Downgrade if subscription is in a failed/cancelled state
                if (['canceled', 'unpaid', 'incomplete_expired'].includes(subscription.status) || isDeleted) {
                    await downgradeUser(subscription.id);
                }
                break;

            case 'customer.subscription.trial_will_end':
                const trialSub = event.data.object;
                console.log('\n=== Trial Will End (3 days notice) ===');
                console.log('Subscription ID:', trialSub.id);
                console.log('Trial end date:', new Date(trialSub.trial_end * 1000));
                console.log('====================================\n');
                // Could send reminder email here if needed
                break;

            case 'invoice.payment_failed':
                const invoice = event.data.object;
                console.log('\n=== Invoice Payment Failed ===');
                console.log('Invoice ID:', invoice.id);
                console.log('Subscription ID:', invoice.subscription);
                console.log('Amount:', invoice.amount_due);
                console.log('Attempt count:', invoice.attempt_count);
                console.log('Max attempts:', invoice.next_payment_attempt ? 'TBD' : 'Final attempt');
                console.log('===============================\n');
                
                // Only downgrade if all retry attempts are exhausted
                if (invoice.subscription) {
                    const maxRetry = invoice.next_payment_attempt ? (invoice.attempt_count || 1) : 1;
                    const currentAttempt = invoice.attempt_count || 1;
                    
                    console.log(`Payment attempt ${currentAttempt}/${maxRetry}`);
                    
                    if (currentAttempt >= maxRetry) {
                        console.log('All payment attempts exhausted, downgrading user');
                        await downgradeUser(invoice.subscription);
                    } else {
                        console.log('Payment will be retried, not downgrading yet');
                    }
                }
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

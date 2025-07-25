const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getDb } = require('../../database');

//real
const PRICE_IDS = {
    BASIC_UPGRADE: 'price_1QtCSlDv6kE7GataHOJpDPKT',
    AUDIO_PACK: 'price_1QtCTcDv6kE7GataN7ebeLCF',
    IMAGE_PACK: 'price_1QxXiXDv6kE7GataLRxt8hrj',
    MORE_SENTENCES: 'price_1R5e8hDv6kE7Gata5CKPAu0Z',
    BASIC_SUBSCRIPTION: 'price_1R94kODv6kE7Gata9Zwzvvom',
    PLUS_SUBSCRIPTION: 'price_1QtBf2Dv6kE7Gatasq6pq1Tc',
    BASIC_SUBSCRIPTION_YEARLY: 'price_1Rjh9EDv6kE7GataEdXl4ICx',
    PLUS_SUBSCRIPTION_YEARLY: 'price_1RjhBODv6kE7GatajkAfu5cB',
};

// Tier mapping for subscriptions
const TIER_MAPPING = {
    [PRICE_IDS.BASIC_SUBSCRIPTION]: 1,
    [PRICE_IDS.BASIC_SUBSCRIPTION_YEARLY]: 1,
    [PRICE_IDS.PLUS_SUBSCRIPTION]: 2,
    [PRICE_IDS.PLUS_SUBSCRIPTION_YEARLY]: 2,
};

//test
// const PRICE_IDS = {
//     BASIC_UPGRADE: 'price_1QtEdrDv6kE7GatabIZ21Odt',
//     AUDIO_PACK: 'price_1QtEdODv6kE7GataOemGLYiK',
//     MONTHLY_SUB: 'price_1QtEcWDv6kE7Gata4QDYmETm'
// };


const handleCheckoutComplete = async (session) => {
    const userId = parseInt(session.client_reference_id);
    
    // Get the price ID from metadata instead of line items
    const priceId = session.metadata.priceId;
    if (!priceId) {
        throw new Error('No price ID found in session metadata');
    }

    const db = getDb();

    try {
        // Get current user data
        const user = await db.collection('users').findOne({ userId });
        if (!user) {
            throw new Error('User not found');
        }

        let subscriptionUpdate;

        switch (priceId) {
            case PRICE_IDS.BASIC_UPGRADE: // Basic Upgrade
                await db.collection('users').updateOne(
                    { userId },
                    { 
                        $set: { 
                            maxSavedSentences: 150,
                            maxSavedWords: 200,
                            // Store purchase info
                            purchases: {
                                ...user.purchases,
                                basicUpgrade: {
                                    purchaseDate: new Date(),
                                    sessionId: session.id
                                }
                            }
                        }
                    }
                );
                break;  

            case PRICE_IDS.AUDIO_PACK: // Audio Pack
                await db.collection('users').updateOne(
                    { userId },
                    { 
                        $inc: { remainingAudioGenerations: 50 },
                        $push: {
                            'purchases.audioPacks': {
                                purchaseDate: new Date(),
                                sessionId: session.id,
                                amount: 50
                            }
                        }
                    }
                );
                break;

            case PRICE_IDS.PLUS_SUBSCRIPTION: // Plus Subscription
            case PRICE_IDS.PLUS_SUBSCRIPTION_YEARLY: // Plus Subscription Yearly
            case PRICE_IDS.BASIC_SUBSCRIPTION: // Basic Subscription
            case PRICE_IDS.BASIC_SUBSCRIPTION_YEARLY: // Basic Subscription Yearly
                const tier = TIER_MAPPING[priceId];
                if (!tier) {
                    throw new Error(`Unknown subscription tier for price ID: ${priceId}`);
                }

                subscriptionUpdate = {
                    tier: tier,
                    'subscription.status': 'active',
                    'subscription.startDate': new Date(),
                    'subscription.stripeSubscriptionId': session.subscription,
                    'subscription.customerId': session.customer
                };

                // Check if this subscription has a trial and mark it as used
                if (session.subscription) {
                    const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);
                    if (stripeSubscription.trial_end && stripeSubscription.trial_end > Date.now() / 1000) {
                        subscriptionUpdate.hasUsedFreeTrial = true;
                        console.log(`Marking user as having used free trial (Tier ${tier})`);
                    }
                }

                await db.collection('users').updateOne(
                    { userId },
                    { $set: subscriptionUpdate }
                );
                break;

            case PRICE_IDS.IMAGE_PACK: // Image Pack
            
                await db.collection('users').updateOne(
                    { userId },
                    { $inc: { remainingImageExtracts: 150 } }
                );
                break;

            case PRICE_IDS.MORE_SENTENCES: // More Sentences
                await db.collection('users').updateOne(
                    { userId },
                    { $inc: { remainingSentenceAnalyses: 100 } }
                );
                break;

            default:
                console.error('Unknown price ID:', priceId);
                throw new Error('Unknown price ID');
        }

        // Log the transaction
        await db.collection('transactions').insertOne({
            userId,
            sessionId: session.id,
            priceId,
            amount: session.amount_total,
            currency: session.currency,
            status: session.payment_status,
            dateCreated: new Date()
        });

    } catch (error) {
        console.error('Error processing checkout completion:', error);
        throw error;
    }
};

module.exports = handleCheckoutComplete; 
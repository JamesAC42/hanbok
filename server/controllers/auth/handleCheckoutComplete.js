const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getDb } = require('../../database');

//real
const PRICE_IDS = {
    BASIC_UPGRADE: 'price_1QtCSlDv6kE7GataHOJpDPKT',
    AUDIO_PACK: 'price_1QtCTcDv6kE7GataN7ebeLCF',
    MONTHLY_SUB: 'price_1QtBf2Dv6kE7Gatasq6pq1Tc',
    IMAGE_PACK: 'price_1QxXiXDv6kE7GataLRxt8hrj'
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

            case PRICE_IDS.MONTHLY_SUB: // Monthly Sub
                const subscriptionUpdate = {
                    tier: 1,
                    'subscription.status': 'active',
                    'subscription.startDate': new Date(),
                    'subscription.stripeSubscriptionId': session.subscription,
                    'subscription.customerId': session.customer
                };

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
'use client';
import Image from 'next/image';
import styles from '@/styles/components/pagelayout.module.scss';
import pricingStyles from '@/styles/components/pricing.module.scss';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import ContentPage from '@/components/ContentPage';
import Footer from '@/components/Footer';

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

//test
// const PRICE_IDS = {
//     BASIC_UPGRADE: 'price_1QtEdrDv6kE7GatabIZ21Odt',
//     AUDIO_PACK: 'price_1QtEdODv6kE7GataOemGLYiK',
//     MONTHLY_SUB: 'price_1QtEcWDv6kE7Gata4QDYmETm'
// };

const PRICING = {
    basic: {
        monthly: 4,
        yearly: 40, // $3/month billed yearly - 25% discount
    },
    plus: {
        monthly: 10,
        yearly: 99, // $8/month billed yearly - 20% discount
    }
};

const REVIEWS = [
    {
        name: "/u/Brief_Brush_8680", 
        text: "This is such an amazing website and by far the korean best translation tool I ever came across.",
        rating: 5
    },
    {
        name: "/u/FuriaDC",
        text: "Oh my god! It's exactly what I need!!",
        rating: 5
    },
    {
        name: "Isabelle D.",
        text: "Fantastic website and very helpful for translations and explanations!",
        rating: 5
    },
];

const FAQ_ITEMS = [
    {
        question: "How does the 7-day free trial work?",
        answer: "Start using all premium features immediately without entering a credit card. After 7 days, you can add payment info to continue, or the trial will automatically end with no charges. Each user can only use the free trial once."
    },
    {
        question: "Can I cancel my subscription anytime?",
        answer: "Yes! You can cancel your subscription at any time from your account settings. Your access will continue until the end of your current billing period."
    },
    {
        question: "Is there really a money-back guarantee?",
        answer: "Absolutely! We offer a 30-day money-back guarantee. If you're not satisfied with Hanbok, contact us within 30 days for a full refund."
    },
    {
        question: "What's the difference between Basic and Plus?",
        answer: "Plus includes everything in Basic, plus unlimited text extraction, unlimited audio generation, 200 conversations with the tutor per month, 50 messages per conversation, and priority support."
    },
    {
        question: "Can I upgrade or downgrade my plan?",
        answer: "Yes, you can change your plan at any time. Upgrades take effect immediately, and downgrades take effect at the next billing cycle."
    },
    {
        question: "Do you offer student discounts?",
        answer: "We're working on student pricing! For now, try our free plan or consider the one-time purchases which offer great value for students."
    },
    {
        question: "Is my payment information secure?",
        answer: "Yes, all payments are processed securely through Stripe, a trusted payment processor used by millions of businesses worldwide."
    }
];

const Pricing = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isYearly, setIsYearly] = useState(false);
    const [openFaqIndex, setOpenFaqIndex] = useState(null);
    const { t } = useLanguage();

    useEffect(() => {
        document.title = t('pricing.pageTitle');
    }, [t]);

    const handlePurchase = async (priceId) => {
        if (!user) {
            router.push('/login');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ priceId }),
                credentials: 'include'
            });

            const { url } = await response.json();
            window.location.href = url;
        } catch (error) {
            console.error('Error creating checkout session:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPriceInfo = (plan) => {
        const pricing = PRICING[plan];
        if (!pricing) return null;

        const monthlyPrice = pricing.monthly;
        const yearlyTotal = pricing.yearly;
        const savings = (monthlyPrice * 12) - yearlyTotal;
        const discountPercentage = Math.round((savings / (monthlyPrice * 12)) * 100);

        return {
            monthlyPrice,
            yearlyTotal,
            savings,
            discountPercentage
        };
    };

    const getPriceId = (plan) => {
        if (plan === 'basic') {
            return isYearly ? PRICE_IDS.BASIC_SUBSCRIPTION_YEARLY : PRICE_IDS.BASIC_SUBSCRIPTION;
        } else if (plan === 'plus') {
            return isYearly ? PRICE_IDS.PLUS_SUBSCRIPTION_YEARLY : PRICE_IDS.PLUS_SUBSCRIPTION;
        }
        return null;
    };

    const toggleFaq = (index) => {
        setOpenFaqIndex(openFaqIndex === index ? null : index);
    };

    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, i) => (
            <span key={i} className={`${pricingStyles.star} ${i < rating ? pricingStyles.filled : ''}`}>★</span>
        ));
    };

    return (
        <ContentPage>
            <div className={pricingStyles.pricingPage}>
                {/* Hero Section with CTA */}
                <div className={pricingStyles.pricingHero}>
                    <h1 className={pricingStyles.heroTitle}>{t('pricing.title')}</h1>
                    <p className={pricingStyles.heroSubtitle}>{t('pricing.subtitle')}</p>
                    
                    {/* CTA Button */}
                    <div className={pricingStyles.heroCta}>
                        <button 
                            className={pricingStyles.heroCtaButton}
                            onClick={() => document.getElementById('pricing-plans').scrollIntoView({ behavior: 'smooth' })}
                        >
                            {!user?.hasUsedFreeTrial ? 
                                'Start Your Free 7-Day Trial - No Credit Card Required' : 
                                'Get Started Today - 30-Day Money Back Guarantee'
                            }
                        </button>
                        <p className={pricingStyles.ctaSubtext}>Join thousands of language learners worldwide • 30-Day Money Back Guarantee</p>
                    </div>
                </div>

                {/* Billing Toggle */}
                <div className={pricingStyles.billingToggle}>
                    <div className={pricingStyles.toggleContainer}>
                        <span className={`${pricingStyles.toggleLabel} ${!isYearly ? pricingStyles.active : ''}`}>
                            {t('pricing.billing.monthly')}
                        </span>
                        <div className={pricingStyles.toggleSwitch} onClick={() => setIsYearly(!isYearly)}>
                            <div className={`${pricingStyles.toggleSlider} ${isYearly ? pricingStyles.yearly : ''}`}>
                                <div className={pricingStyles.toggleButton}></div>
                            </div>
                        </div>
                        <span className={`${pricingStyles.toggleLabel} ${isYearly ? pricingStyles.active : ''}`}>
                            {t('pricing.billing.yearly')}
                            <span className={pricingStyles.saveBadge}>{t('pricing.billing.saveUp')}</span>
                        </span>
                    </div>
                </div>

                {/* Main Subscription Plans */}
                <section id="pricing-plans" className={pricingStyles.mainPlansSection}>
                    <div className={pricingStyles.mainPlansContainer}>
                        
                        {/* Free Plan */}
                        <div className={`${pricingStyles.planCard} ${pricingStyles.freePlan}`}>
                            <div className={pricingStyles.planHeader}>
                                <h3 className={pricingStyles.planName}>{t('pricing.plans.free')}</h3>
                                <div className={pricingStyles.planPrice}>
                                    <span className={pricingStyles.currency}>{t('pricing.pricing.currency')}</span>
                                    <span className={pricingStyles.amount}>0</span>
                                    <span className={pricingStyles.period}>{t('pricing.pricing.forever')}</span>
                                </div>
                            </div>
                            <ul className={pricingStyles.planFeatures}>
                                <li>{t('pricing.features.free.analyses')}</li>
                                <li>{t('pricing.features.free.conversations')}</li>
                                <li>{t('pricing.features.free.messages')}</li>
                                <li>{t('pricing.features.free.bookmarks')}</li>
                                <li>{t('pricing.features.free.flashcards')}</li>
                                <li>{t('pricing.features.free.support')}</li>
                            </ul>
                            <button className={`${pricingStyles.planButton} ${pricingStyles.freeButton}`} onClick={() => router.push('/analyze')}>
                                {t('pricing.planButtons.getStartedFree')}
                            </button>
                        </div>

                        {/* Basic Plan */}
                        <div className={`${pricingStyles.planCard} ${pricingStyles.basicPlan}`}>
                            {isYearly ? (
                                <div className={pricingStyles.discountBadge}>
                                    Save {getPriceInfo('basic')?.discountPercentage}% - 2 months FREE!
                                </div>
                            ) : (!user?.hasUsedFreeTrial && (
                                <div className={pricingStyles.trialBadge}>
                                    7-Day FREE Trial
                                </div>
                            ))}
                            <div className={pricingStyles.planHeader}>
                                <h3 className={pricingStyles.planName}>{t('pricing.plans.basic')}</h3>
                                <div className={pricingStyles.planPrice}>
                                    <span className={pricingStyles.currency}>{t('pricing.pricing.currency')}</span>
                                    <span className={pricingStyles.amount}>{getPriceInfo('basic')?.monthlyPrice}</span>
                                    <span className={pricingStyles.period}>{t('pricing.pricing.perMonth')}</span>
                                </div>
                                {isYearly ? (
                                    <div className={pricingStyles.yearlyDeal}>
                                        <div className={pricingStyles.billingInfo}>
                                            Billed ${getPriceInfo('basic')?.yearlyTotal} annually
                                        </div>
                                        <div className={pricingStyles.savingsHighlight}>
                                            You save ${getPriceInfo('basic')?.savings} per year!
                                        </div>
                                    </div>
                                ) : (!user?.hasUsedFreeTrial ? (
                                    <div className={pricingStyles.trialInfo}>
                                        <div className={pricingStyles.trialNote}>
                                            Try free for 7 days, then ${getPriceInfo('basic')?.monthlyPrice}/month
                                        </div>
                                        <div className={pricingStyles.trialSubnote}>
                                            No credit card required • Cancel anytime
                                        </div>
                                    </div>
                                ) : (
                                    <div className={pricingStyles.trialInfo}>
                                        <div className={pricingStyles.trialNote}>
                                            ${getPriceInfo('basic')?.monthlyPrice}/month
                                        </div>
                                        <div className={pricingStyles.trialSubnote}>
                                            Billed monthly • Cancel anytime
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <ul className={pricingStyles.planFeatures}>
                                <li>{t('pricing.features.basic.analyses')}</li>
                                <li>{t('pricing.features.basic.conversations')}</li>
                                <li>{t('pricing.features.basic.messages')}</li>
                                <li>{t('pricing.features.basic.bookmarks')}</li>
                                <li>{t('pricing.features.basic.flashcards')}</li>
                                <li>{t('pricing.features.basic.support')}</li>
                            </ul>
                            <button 
                                className={`${pricingStyles.planButton} ${pricingStyles.basicButton}`}
                                onClick={() => handlePurchase(getPriceId('basic'))}
                                disabled={loading}
                            >
                                {isYearly ? t('pricing.buttons.subscribe') : (
                                    !user?.hasUsedFreeTrial ? 'Start 7-Day Free Trial' : t('pricing.buttons.subscribe')
                                )}
                            </button>
                        </div>

                        {/* Plus Plan */}
                        <div className={`${pricingStyles.planCard} ${pricingStyles.plusPlan}`}>
                            {isYearly ? (
                                <div className={pricingStyles.discountBadge}>
                                    Save {getPriceInfo('plus')?.discountPercentage}% - 2 months FREE!
                                </div>
                            ) : (!user?.hasUsedFreeTrial && (
                                <div className={pricingStyles.trialBadge}>
                                    7-Day FREE Trial
                                </div>
                            ))}
                            <div className={pricingStyles.planHeader}>
                                <h3 className={pricingStyles.planName}>{t('pricing.plans.plus')}</h3>
                                <div className={pricingStyles.planPrice}>
                                    <span className={pricingStyles.currency}>{t('pricing.pricing.currency')}</span>
                                    <span className={pricingStyles.amount}>{getPriceInfo('plus')?.monthlyPrice}</span>
                                    <span className={pricingStyles.period}>{t('pricing.pricing.perMonth')}</span>
                                </div>
                                {isYearly ? (
                                    <div className={pricingStyles.yearlyDeal}>
                                        <div className={pricingStyles.billingInfo}>
                                            Billed ${getPriceInfo('plus')?.yearlyTotal} annually
                                        </div>
                                        <div className={pricingStyles.savingsHighlight}>
                                            You save ${getPriceInfo('plus')?.savings} per year!
                                        </div>
                                    </div>
                                ) : (!user?.hasUsedFreeTrial ? (
                                    <div className={pricingStyles.trialInfo}>
                                        <div className={pricingStyles.trialNote}>
                                            Try free for 7 days, then ${getPriceInfo('plus')?.monthlyPrice}/month
                                        </div>
                                        <div className={pricingStyles.trialSubnote}>
                                            No credit card required • Cancel anytime
                                        </div>
                                    </div>
                                ) : (
                                    <div className={pricingStyles.trialInfo}>
                                        <div className={pricingStyles.trialNote}>
                                            ${getPriceInfo('plus')?.monthlyPrice}/month
                                        </div>
                                        <div className={pricingStyles.trialSubnote}>
                                            Billed monthly • Cancel anytime
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <ul className={pricingStyles.planFeatures}>
                                <li>{t('pricing.features.plus.everythingInBasic')}</li>
                                <li>{t('pricing.features.plus.imageExtraction')}</li>
                                <li>{t('pricing.features.plus.audioGeneration')}</li>
                                <li>{t('pricing.features.plus.conversations')}</li>
                                <li>{t('pricing.features.plus.messages')}</li>
                                <li>{t('pricing.features.plus.support')}</li>
                            </ul>
                            <button 
                                className={`${pricingStyles.planButton} ${pricingStyles.plusButton}`}
                                onClick={() => handlePurchase(getPriceId('plus'))}
                                disabled={loading}
                            >
                                {isYearly ? t('pricing.buttons.subscribe') : (
                                    !user?.hasUsedFreeTrial ? 'Start 7-Day Free Trial' : t('pricing.buttons.subscribe')
                                )}
                            </button>
                        </div>
                    </div>
                </section>

                    {/* Review Bubbles */}
                    <div className={pricingStyles.reviewBubbles}>
                        {REVIEWS.map((review, index) => (
                            <div key={index} className={pricingStyles.reviewBubble}>
                                <div className={pricingStyles.reviewStars}>
                                    {renderStars(review.rating)}
                                </div>
                                <p className={pricingStyles.reviewText}>"{review.text}"</p>
                                <span className={pricingStyles.reviewAuthor}>- {review.name}</span>
                            </div>
                        ))}
                    </div>

                {/* FAQ Section */}
                <section className={pricingStyles.faqSection}>
                    <h2 className={pricingStyles.faqTitle}>Frequently Asked Questions</h2>
                    <div className={pricingStyles.faqContainer}>
                        {FAQ_ITEMS.map((item, index) => (
                            <div key={index} className={pricingStyles.faqItem}>
                                <button 
                                    className={`${pricingStyles.faqQuestion} ${openFaqIndex === index ? pricingStyles.active : ''}`}
                                    onClick={() => toggleFaq(index)}
                                >
                                    <span>{item.question}</span>
                                    <span className={pricingStyles.faqToggle}>
                                        {openFaqIndex === index ? '−' : '+'}
                                    </span>
                                </button>
                                {openFaqIndex === index && (
                                    <div className={pricingStyles.faqAnswer}>
                                        <p>{item.answer}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* One-time Purchases */}
                <section className={pricingStyles.oneTimeSection}>
                    <h2 className={pricingStyles.oneTimeTitle}>{t('pricing.oneTime.title')}</h2>
                    <p className={pricingStyles.oneTimeSubtitle}>{t('pricing.oneTime.subtitle')}</p>
                    
                    <div className={pricingStyles.oneTimeGrid}>
                        <div className={pricingStyles.oneTimeCard}>
                            <h4>{t('pricing.oneTime.products.extraSentences.name')}</h4>
                            <div className={pricingStyles.oneTimePrice}>{t('pricing.oneTime.products.extraSentences.price')}</div>
                            <p>{t('pricing.oneTime.products.extraSentences.description')}</p>
                            <button 
                                className={pricingStyles.oneTimeButton}
                                onClick={() => handlePurchase(PRICE_IDS.MORE_SENTENCES)}
                                disabled={loading}
                            >
                                {t('pricing.buttons.buyNow')}
                            </button>
                        </div>

                        <div className={pricingStyles.oneTimeCard}>
                            <div className={pricingStyles.limitedOffer}>{t('pricing.badges.limitedOffer')}</div>
                            <h4>{t('pricing.oneTime.products.basicUpgrade.name')}</h4>
                            <div className={pricingStyles.oneTimePrice}>{t('pricing.oneTime.products.basicUpgrade.price')}</div>
                            <p>{t('pricing.oneTime.products.basicUpgrade.description')}</p>
                            <button 
                                className={pricingStyles.oneTimeButton}
                                onClick={() => handlePurchase(PRICE_IDS.BASIC_UPGRADE)}
                                disabled={loading}
                            >
                                {t('pricing.buttons.buyNow')}
                            </button>
                        </div>

                        <div className={pricingStyles.oneTimeCard}>
                            <div className={pricingStyles.limitedOffer}>{t('pricing.badges.limitedOffer')}</div>
                            <h4>{t('pricing.oneTime.products.audioPack.name')}</h4>
                            <div className={pricingStyles.oneTimePrice}>{t('pricing.oneTime.products.audioPack.price')}</div>
                            <p>{t('pricing.oneTime.products.audioPack.description')}</p>
                            <button 
                                className={pricingStyles.oneTimeButton}
                                onClick={() => handlePurchase(PRICE_IDS.AUDIO_PACK)}
                                disabled={loading}
                            >
                                {t('pricing.buttons.buyNow')}
                            </button>
                        </div>

                        <div className={pricingStyles.oneTimeCard}>
                            <div className={pricingStyles.limitedOffer}>{t('pricing.badges.limitedOffer')}</div>
                            <h4>{t('pricing.oneTime.products.imagePack.name')}</h4>
                            <div className={pricingStyles.oneTimePrice}>{t('pricing.oneTime.products.imagePack.price')}</div>
                            <p>{t('pricing.oneTime.products.imagePack.description')}</p>
                            <button 
                                className={pricingStyles.oneTimeButton}
                                onClick={() => handlePurchase(PRICE_IDS.IMAGE_PACK)}
                                disabled={loading}
                            >
                                {t('pricing.buttons.buyNow')}
                            </button>
                        </div>
                    </div>
                </section>

                {/* Ko-fi Section */}
                <section className={pricingStyles.supportSection}>
                    <Image 
                        src="/images/backgrounddark.png" 
                        alt="Background" 
                        fill 
                        priority 
                        style={{ objectFit: 'cover' }} 
                    />
                    <div className={pricingStyles.supportContent}>
                        <h2>{t('pricing.support.title')}</h2>
                        <p className={pricingStyles.supportText}>
                            {t('pricing.donate.text')}
                        </p>
                        <a href='https://ko-fi.com/U7U21B323R' target='_blank' className={pricingStyles.kofiLink}>
                            <img 
                                height='40' 
                                src='https://storage.ko-fi.com/cdn/kofi5.png?v=6' 
                                alt='Buy Me a Coffee at ko-fi.com' 
                            />
                        </a>
                    </div>
                </section>

            </div>
            <Footer />
        </ContentPage>
    );
};

export default Pricing;

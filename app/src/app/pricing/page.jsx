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
        question: "What if I'm not satisfied?",
        answer: "We offer a no-questions-asked 30-day refund policy. Just email us if you're not happy with the service."
    },
    {
        question: "Can I cancel anytime?",
        answer: "Yes, you can cancel your subscription at any time. You will continue to have access to premium features until the end of your billing period."
    },
    {
        question: "Do you offer student discounts?",
        answer: "We keep our prices as low as possible to be accessible to everyone, so we don't offer additional discounts at this time."
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
                {/* Hero Section */}
                <div className={pricingStyles.pricingHero}>
                    <h1 className={pricingStyles.heroTitle}>{t('pricing.title')}</h1>
                    <p className={pricingStyles.heroSubtitle}>{t('pricing.subtitle')}</p>
                </div>

                {/* Billing Toggle */}
                <div className={pricingStyles.billingToggle}>
                    <div className={pricingStyles.toggleContainer}>
                        <span className={`${pricingStyles.toggleLabel} ${!isYearly ? pricingStyles.active : ''}`}>
                            {t('pricing.billing.monthly')}
                        </span>
                        <div 
                            className={pricingStyles.toggleSwitch} 
                            onClick={() => setIsYearly(!isYearly)}
                        >
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
                        
                        {/* Free Plan (Anchor) */}
                        <div className={`${pricingStyles.planCard} ${pricingStyles.freePlan}`}>
                            <div className={pricingStyles.planHeader}>
                                <h3 className={pricingStyles.planName}>{t('pricing.plans.free')}</h3>
                                <div className={pricingStyles.planPrice}>
                                    <span className={pricingStyles.currency}>{t('pricing.pricing.currency')}</span>
                                    <span className={pricingStyles.amount}>0</span>
                                    <span className={pricingStyles.period}>/{t('pricing.billing.monthly')}</span>
                                </div>
                            </div>
                            <ul className={pricingStyles.planFeatures}>
                                <li>{t('pricing.features.free.analyses')}</li>
                                <li>{t('pricing.features.free.conversations')}</li>
                                <li>{t('pricing.features.free.limitations')}</li>
                                <li>{t('pricing.features.free.support')}</li>
                            </ul>
                            <button 
                                className={`${pricingStyles.planButton} ${pricingStyles.freeButton}`} 
                                onClick={() => router.push('/analyze')} // Assuming Free plan just means using the app without sub
                            >
                                {t('pricing.planButtons.stayFree')}
                            </button>
                        </div>

                        {/* Plus Plan (Hero) */}
                        <div className={`${pricingStyles.planCard} ${pricingStyles.plusPlan}`}>
                            <div className={pricingStyles.popularBadge}>{t('pricing.badges.mostPopular')}</div>
                            <div className={pricingStyles.planHeader}>
                                <h3 className={pricingStyles.planName}>
                                    {t('pricing.plans.plus')} 👑
                                </h3>
                                <div className={pricingStyles.planPrice}>
                                    <span className={pricingStyles.currency}>{t('pricing.pricing.currency')}</span>
                                    <span className={pricingStyles.amount}>
                                        {isYearly ? PRICING.plus.yearly : PRICING.plus.monthly}
                                    </span>
                                    <span className={pricingStyles.period}>
                                        {isYearly ? '/year' : '/month'}
                                    </span>
                                </div>
                                <p className={pricingStyles.subText}>{t('pricing.features.plus.subtext')}</p>
                            </div>
                            <ul className={pricingStyles.planFeatures}>
                                <li><strong>{t('pricing.features.plus.unlimited')}</strong></li>
                                <li>{t('pricing.features.plus.audio')}</li>
                                <li>{t('pricing.features.plus.image')}</li>
                                <li>{t('pricing.features.plus.support')}</li>
                            </ul>
                            <button 
                                className={`${pricingStyles.planButton} ${pricingStyles.plusButton}`} 
                                onClick={() => handlePurchase(getPriceId('plus'))}
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : t('pricing.planButtons.getPlus')}
                            </button>
                            <p className={pricingStyles.guaranteeText}>{t('pricing.badges.guarantee')}</p>
                        </div>

                        {/* Basic Plan */}
                        <div className={`${pricingStyles.planCard} ${pricingStyles.basicPlan}`}>
                            <div className={pricingStyles.planHeader}>
                                <h3 className={pricingStyles.planName}>{t('pricing.plans.basic')}</h3>
                                <div className={pricingStyles.planPrice}>
                                    <span className={pricingStyles.currency}>{t('pricing.pricing.currency')}</span>
                                    <span className={pricingStyles.amount}>
                                        {isYearly ? PRICING.basic.yearly : PRICING.basic.monthly}
                                    </span>
                                    <span className={pricingStyles.period}>
                                        {isYearly ? '/year' : '/month'}
                                    </span>
                                </div>
                            </div>
                            <ul className={pricingStyles.planFeatures}>
                                <li>{t('pricing.features.basic.analyses')}</li>
                                <li>{t('pricing.features.basic.extendedText')}</li>
                                <li>{t('pricing.features.basic.conversations')}</li>
                                <li>{t('pricing.features.basic.saves')}</li>
                                <li>{t('pricing.features.basic.support')}</li>
                            </ul>
                            <button 
                                className={`${pricingStyles.planButton} ${pricingStyles.basicButton}`}
                                onClick={() => handlePurchase(getPriceId('basic'))}
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : t('pricing.planButtons.getBasic')}
                            </button>
                        </div>
                    </div>
                </section>

                {/* Why Upgrade Section */}
                <section className={pricingStyles.whyUpgradeSection}>
                    <h2 className={pricingStyles.whyUpgradeTitle}>{t('pricing.whyUpgrade.title')}</h2>
                    <div className={pricingStyles.whyUpgradeGrid}>
                        <div className={pricingStyles.whyUpgradeCard}>
                            <div className={pricingStyles.whyUpgradeIcon}>🤖</div>
                            <h3>{t('pricing.whyUpgrade.aiAnalysis.title')}</h3>
                            <p>{t('pricing.whyUpgrade.aiAnalysis.desc')}</p>
                        </div>
                        <div className={pricingStyles.whyUpgradeCard}>
                            <div className={pricingStyles.whyUpgradeIcon}>🔊</div>
                            <h3>{t('pricing.whyUpgrade.audio.title')}</h3>
                            <p>{t('pricing.whyUpgrade.audio.desc')}</p>
                        </div>
                        <div className={pricingStyles.whyUpgradeCard}>
                            <div className={pricingStyles.whyUpgradeIcon}>📷</div>
                            <h3>{t('pricing.whyUpgrade.image.title')}</h3>
                            <p>{t('pricing.whyUpgrade.image.desc')}</p>
                        </div>
                    </div>
                </section>

                {/* Reviews / Social Proof */}
                <section className={pricingStyles.reviewsSection}>
                    <div className={pricingStyles.reviewBubbles}>
                        {REVIEWS.map((review, index) => (
                            <div key={index} className={pricingStyles.reviewBubble}>
                                <div className={pricingStyles.reviewStars}>
                                    {renderStars(review.rating)}
                                </div>
                                <p className={pricingStyles.reviewText}>"{review.text}"</p>
                                <p className={pricingStyles.reviewAuthor}>{review.name}</p>
                            </div>
                        ))}
                    </div>
                </section>

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
                                    {item.question}
                                    <span className={pricingStyles.faqToggle}>{openFaqIndex === index ? '−' : '+'}</span>
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

                {/* Final CTA / Footer Replacement */}
                <section className={pricingStyles.finalCtaSection}>
                    <div className={pricingStyles.finalCtaContent}>
                        <h2>{t('pricing.finalCta.title')}</h2>
                        <button 
                            className={pricingStyles.finalCtaButton}
                            onClick={() => document.getElementById('pricing-plans').scrollIntoView({ behavior: 'smooth' })}
                        >
                            {t('pricing.finalCta.button')}
                        </button>
                    </div>
                </section>

            </div>
            <Footer />
        </ContentPage>
    );
};

export default Pricing;

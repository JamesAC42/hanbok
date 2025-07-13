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

const Pricing = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isYearly, setIsYearly] = useState(true); // Default to yearly for better conversions
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

        const currentPrice = isYearly ? pricing.yearly : pricing.monthly;
        const monthlyEquivalent = isYearly ? pricing.yearly / 12 : pricing.monthly;
        const savings = isYearly ? (pricing.monthly * 12) - pricing.yearly : 0;
        const discountPercentage = isYearly ? Math.round((savings / (pricing.monthly * 12)) * 100) : 0;

        return {
            price: currentPrice,
            monthlyEquivalent,
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

    return (
        <ContentPage>
            <div className={pricingStyles.pricingPage}>
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
                <section className={pricingStyles.mainPlansSection}>
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
                            {isYearly && (
                                <div className={pricingStyles.discountBadge}>
                                    {t('pricing.badges.save')} {getPriceInfo('basic')?.discountPercentage}%
                                </div>
                            )}
                            <div className={pricingStyles.planHeader}>
                                <h3 className={pricingStyles.planName}>{t('pricing.plans.basic')}</h3>
                                <div className={pricingStyles.planPrice}>
                                    <span className={pricingStyles.currency}>{t('pricing.pricing.currency')}</span>
                                    <span className={pricingStyles.amount}>
                                        {isYearly ? (getPriceInfo('basic')?.monthlyEquivalent.toFixed(2)) : getPriceInfo('basic')?.price.toFixed(2)}
                                    </span>
                                    <span className={pricingStyles.period}>
                                        {isYearly ? t('pricing.pricing.perMonthBilled') : t('pricing.pricing.perMonth')}
                                    </span>
                                </div>
                                {isYearly && (
                                    <div className={pricingStyles.billingInfo}>
                                        {t('pricing.billing.billedAs')} {t('pricing.pricing.currency')}{getPriceInfo('basic')?.price} {t('pricing.billing.annually')}
                                    </div>
                                )}
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
                                {t('pricing.buttons.subscribe')}
                            </button>
                        </div>

                        {/* Plus Plan */}
                        <div className={`${pricingStyles.planCard} ${pricingStyles.plusPlan}`}>
                            <div className={pricingStyles.popularBadge}>{t('pricing.badges.mostPopular')}</div>
                            {isYearly && (
                                <div className={pricingStyles.discountBadge}>
                                    {t('pricing.badges.save')} {getPriceInfo('plus')?.discountPercentage}%
                                </div>
                            )}
                            <div className={pricingStyles.planHeader}>
                                <h3 className={pricingStyles.planName}>{t('pricing.plans.plus')}</h3>
                                <div className={pricingStyles.planPrice}>
                                    <span className={pricingStyles.currency}>{t('pricing.pricing.currency')}</span>
                                    <span className={pricingStyles.amount}>
                                        {isYearly ? (getPriceInfo('plus')?.monthlyEquivalent.toFixed(2)) : getPriceInfo('plus')?.price.toFixed(2)}
                                    </span>
                                    <span className={pricingStyles.period}>
                                        {isYearly ? t('pricing.pricing.perMonthBilled') : t('pricing.pricing.perMonth')}
                                    </span>
                                </div>
                                {isYearly && (
                                    <div className={pricingStyles.billingInfo}>
                                        {t('pricing.billing.billedAs')} {t('pricing.pricing.currency')}{getPriceInfo('plus')?.price} {t('pricing.billing.annually')}
                                    </div>
                                )}
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
                                {t('pricing.buttons.subscribe')}
                            </button>
                        </div>
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

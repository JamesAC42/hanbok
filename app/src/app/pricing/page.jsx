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
    MONTHLY_SUB: 'price_1QtBf2Dv6kE7Gatasq6pq1Tc',
    IMAGE_PACK: 'price_1QxXiXDv6kE7GataLRxt8hrj',
    MORE_SENTENCES: 'price_1R5e8hDv6kE7Gata5CKPAu0Z',
    BASIC_SUBSCRIPTION: 'price_1R94kODv6kE7Gata9Zwzvvom'
};

//test
// const PRICE_IDS = {
//     BASIC_UPGRADE: 'price_1QtEdrDv6kE7GatabIZ21Odt',
//     AUDIO_PACK: 'price_1QtEdODv6kE7GataOemGLYiK',
//     MONTHLY_SUB: 'price_1QtEcWDv6kE7Gata4QDYmETm'
// };

const Pricing = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
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

    return (
        <ContentPage>
            <div className={pricingStyles.pricingPage}>
                <div className={pricingStyles.pricingHero}>
                    <h1 className={pricingStyles.heroTitle}>{t('pricing.title')}</h1>
                    <p className={pricingStyles.heroSubtitle}>Choose the perfect plan for your Korean learning journey</p>
                </div>

                {/* Main Subscription Plans */}
                <section className={pricingStyles.mainPlansSection}>
                    <div className={pricingStyles.mainPlansContainer}>
                        
                        {/* Free Plan */}
                        <div className={`${pricingStyles.planCard} ${pricingStyles.freePlan}`}>
                            <div className={pricingStyles.planHeader}>
                                <h3 className={pricingStyles.planName}>Free</h3>
                                <div className={pricingStyles.planPrice}>
                                    <span className={pricingStyles.currency}>$</span>
                                    <span className={pricingStyles.amount}>0</span>
                                    <span className={pricingStyles.period}>forever</span>
                                </div>
                            </div>
                            <ul className={pricingStyles.planFeatures}>
                                <li>30 sentence analyses per day</li>
                                <li>60 word lookups per day</li>
                                <li>Basic grammar insights</li>
                                <li>Community support</li>
                            </ul>
                            <button className={`${pricingStyles.planButton} ${pricingStyles.freeButton}`} onClick={() => router.push('/analyze')}>
                                Get Started Free
                            </button>
                        </div>

                        {/* Basic Plan */}
                        <div className={`${pricingStyles.planCard} ${pricingStyles.basicPlan}`}>
                            <div className={pricingStyles.planHeader}>
                                <h3 className={pricingStyles.planName}>Basic</h3>
                                <div className={pricingStyles.planPrice}>
                                    <span className={pricingStyles.currency}>$</span>
                                    <span className={pricingStyles.amount}>4</span>
                                    <span className={pricingStyles.period}>per month</span>
                                </div>
                            </div>
                            <ul className={pricingStyles.planFeatures}>
                                <li>Unlimited sentence analyses</li>
                                <li>Unlimited word lookups</li>
                                <li>Advanced grammar insights</li>
                                <li>Priority support</li>
                                <li>Progress tracking</li>
                            </ul>
                            <button 
                                className={`${pricingStyles.planButton} ${pricingStyles.basicButton}`}
                                onClick={() => handlePurchase(PRICE_IDS.BASIC_SUBSCRIPTION)}
                                disabled={loading}
                            >
                                {t('pricing.buttons.subscribe')}
                            </button>
                        </div>

                        {/* Plus Plan */}
                        <div className={`${pricingStyles.planCard} ${pricingStyles.plusPlan}`}>
                            <div className={pricingStyles.popularBadge}>Most Popular</div>
                            <div className={pricingStyles.planHeader}>
                                <h3 className={pricingStyles.planName}>Plus</h3>
                                <div className={pricingStyles.planPrice}>
                                    <span className={pricingStyles.currency}>$</span>
                                    <span className={pricingStyles.amount}>10</span>
                                    <span className={pricingStyles.period}>per month</span>
                                </div>
                            </div>
                            <ul className={pricingStyles.planFeatures}>
                                <li>Everything in Basic</li>
                                <li>Unlimited image text extraction</li>
                                <li>Unlimited audio generation</li>
                                <li>Advanced analytics & insights</li>
                                <li>Premium support</li>
                                <li>Early access to new features</li>
                            </ul>
                            <button 
                                className={`${pricingStyles.planButton} ${pricingStyles.plusButton}`}
                                onClick={() => handlePurchase(PRICE_IDS.MONTHLY_SUB)}
                                disabled={loading}
                            >
                                {t('pricing.buttons.subscribe')}
                            </button>
                        </div>
                    </div>
                </section>

                {/* One-time Purchases */}
                <section className={pricingStyles.oneTimeSection}>
                    <h2 className={pricingStyles.oneTimeTitle}>Boost Your Experience</h2>
                    <p className={pricingStyles.oneTimeSubtitle}>Need extra credits or features? Get them with these one-time purchases.</p>
                    
                    <div className={pricingStyles.oneTimeGrid}>
                        <div className={pricingStyles.oneTimeCard}>
                            <h4>Extra Sentences</h4>
                            <div className={pricingStyles.oneTimePrice}>$1</div>
                            <p>100 additional sentence analyses</p>
                            <button 
                                className={pricingStyles.oneTimeButton}
                                onClick={() => handlePurchase(PRICE_IDS.MORE_SENTENCES)}
                                disabled={loading}
                            >
                                {t('pricing.buttons.buyNow')}
                            </button>
                        </div>

                        <div className={pricingStyles.oneTimeCard}>
                            <div className={pricingStyles.limitedOffer}>Limited Offer</div>
                            <h4>Basic Upgrade</h4>
                            <div className={pricingStyles.oneTimePrice}>$4</div>
                            <p>Increase daily limits: 30→150 sentences, 60→200 words</p>
                            <button 
                                className={pricingStyles.oneTimeButton}
                                onClick={() => handlePurchase(PRICE_IDS.BASIC_UPGRADE)}
                                disabled={loading}
                            >
                                {t('pricing.buttons.buyNow')}
                            </button>
                        </div>

                        <div className={pricingStyles.oneTimeCard}>
                            <div className={pricingStyles.limitedOffer}>Limited Offer</div>
                            <h4>Audio Pack</h4>
                            <div className={pricingStyles.oneTimePrice}>$6</div>
                            <p>50 additional audio generations for pronunciation practice</p>
                            <button 
                                className={pricingStyles.oneTimeButton}
                                onClick={() => handlePurchase(PRICE_IDS.AUDIO_PACK)}
                                disabled={loading}
                            >
                                {t('pricing.buttons.buyNow')}
                            </button>
                        </div>

                        <div className={pricingStyles.oneTimeCard}>
                            <div className={pricingStyles.limitedOffer}>Limited Offer</div>
                            <h4>Image Pack</h4>
                            <div className={pricingStyles.oneTimePrice}>$5</div>
                            <p>150 image text extractions for learning from real content</p>
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
                        <h2>Support the Project</h2>
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

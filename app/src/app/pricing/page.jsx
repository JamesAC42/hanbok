'use client';
import Image from 'next/image';
import styles from '@/styles/components/pagelayout.module.scss';
import pricingStyles from '@/styles/components/pricing.module.scss';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import ContentPage from '@/components/ContentPage';


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
        <div className={styles.pageContainer}>
            <div className={styles.pageContent}>
                <div className={pricingStyles.pricingContent}>
                    <h1 className={styles.pageTitle}>{t('pricing.title')}</h1>
                    <section className={pricingStyles.section}>
                        <h2>{t('pricing.upgradeOptions')}</h2>

                        <div className={pricingStyles.options}>

                            <div className={`${pricingStyles.optionCard} ${pricingStyles.subscription}`}>
                                <h3>{t('pricing.monthlySubscriptionBasic')}</h3>
                                <p className={pricingStyles.price}>$4 {t('pricing.perMonth')}</p>
                                <ul className={pricingStyles.featuresList}>
                                    <li>{t('pricing.features.unlimited.analyses')}</li>
                                    <li>{t('pricing.features.unlimited.sentences')}</li>
                                    <li>{t('pricing.features.unlimited.words')}</li>
                                </ul>
                                <button 
                                    className={pricingStyles.purchaseButton}
                                    onClick={() => handlePurchase(PRICE_IDS.BASIC_SUBSCRIPTION)}
                                    disabled={loading}
                                >
                                    {t('pricing.buttons.subscribe')}
                                </button>
                            </div>
                            <div className={`${pricingStyles.optionCard} ${pricingStyles.subscription}`}>
                                <div className={pricingStyles.bestValue}>{t('pricing.bestValue')}</div>
                                <h3>{t('pricing.monthlySubscriptionPlus')}</h3>
                                <p className={pricingStyles.price}>$10 {t('pricing.perMonth')}</p>
                                <ul className={pricingStyles.featuresList}>
                                    <li>{t('pricing.features.unlimited.analyses')}</li>
                                    <li>{t('pricing.features.unlimited.sentences')}</li>
                                    <li>{t('pricing.features.unlimited.images')}</li>
                                    <li>{t('pricing.features.unlimited.words')}</li>
                                    <li>{t('pricing.features.unlimited.audio')}</li>
                                    <li>{t('pricing.features.unlimited.insights')}</li>
                                </ul>
                                <button 
                                    className={pricingStyles.purchaseButton}
                                    onClick={() => handlePurchase(PRICE_IDS.MONTHLY_SUB)}
                                    disabled={loading}
                                >
                                    {t('pricing.buttons.subscribe')}
                                </button>
                            </div>
                            <div className={`${pricingStyles.optionCard} ${pricingStyles.oneTime}`}>
                                <h3>{t('pricing.oneTimePurchase')}</h3>
                                <p className={pricingStyles.price}>$1</p>
                                <ul className={pricingStyles.featuresList}>
                                    <li>
                                        <strong>100</strong> {t('pricing.features.moreSentences')}
                                    </li>
                                </ul>
                                <button 
                                    className={pricingStyles.purchaseButton}
                                    onClick={() => handlePurchase(PRICE_IDS.MORE_SENTENCES)}
                                    disabled={loading}
                                >
                                    {t('pricing.buttons.buyNow')}
                                </button>
                            </div>
                            <div className={`${pricingStyles.optionCard} ${pricingStyles.oneTime}`}>
                                <div className={pricingStyles.badge}>{t('pricing.limitedTimeOffer')}</div>
                                <h3>{t('pricing.oneTimePurchase')}</h3>
                                <p className={pricingStyles.price}>$4</p>
                                <ul className={pricingStyles.featuresList}>
                                    <li>
                                        {t('pricing.features.increaseSentences')} <strong>30</strong> {t('pricing.features.to')} <strong>150</strong>
                                    </li>
                                    <li>
                                        {t('pricing.features.increaseWords')} <strong>60</strong> {t('pricing.features.to')} <strong>200</strong>
                                    </li>
                                </ul>
                                <button 
                                    className={pricingStyles.purchaseButton}
                                    onClick={() => handlePurchase(PRICE_IDS.BASIC_UPGRADE)}
                                    disabled={loading}
                                >
                                    {t('pricing.buttons.buyNow')}
                                </button>
                            </div>
                            <div className={`${pricingStyles.optionCard} ${pricingStyles.oneTime}`}>
                                <div className={pricingStyles.badge}>{t('pricing.limitedTimeOffer')}</div>
                                <h3>{t('pricing.oneTimePurchase')}</h3>
                                <p className={pricingStyles.price}>$6</p>
                                <ul className={pricingStyles.featuresList}>
                                    <li>
                                        {t('pricing.features.additionalAudio')} <strong>50</strong> {t('pricing.features.audioGenerations')}
                                    </li>
                                </ul>
                                <button 
                                    className={pricingStyles.purchaseButton}
                                    onClick={() => handlePurchase(PRICE_IDS.AUDIO_PACK)}
                                    disabled={loading}
                                >
                                    {t('pricing.buttons.buyNow')}
                                </button>
                            </div>
                            <div className={`${pricingStyles.optionCard} ${pricingStyles.oneTime}`}>
                                <div className={pricingStyles.badge}>{t('pricing.limitedTimeOffer')}</div>
                                <h3>{t('pricing.oneTimePurchase')}</h3>
                                <p className={pricingStyles.price}>$5</p>
                                <ul className={pricingStyles.featuresList}>
                                    <li>
                                        <strong>150</strong> {t('pricing.features.imageExtractions')}
                                    </li>
                                </ul>
                                <button 
                                    className={pricingStyles.purchaseButton}
                                    onClick={() => handlePurchase(PRICE_IDS.IMAGE_PACK)}
                                    disabled={loading}
                                >
                                    {t('pricing.buttons.buyNow')}
                                </button>
                            </div>
                        </div>
                        <div className={pricingStyles.kofi}>
                            <div className={pricingStyles.kofiText}>
                                {t('pricing.donate.text')}
                            </div>
                            <a href='https://ko-fi.com/U7U21B323R' target='_blank'>
                                <img 
                                    height='36' 
                                    style={{border:"0px", height: "40px"}} 
                                    src='https://storage.ko-fi.com/cdn/kofi5.png?v=6' 
                                    border='0' 
                                    alt='Buy Me a Coffee at ko-fi.com' 
                                />
                            </a>
                        </div>
                    </section>
                </div>
                <div className={pricingStyles.girl}>
                    <Image
                        src="/images/hanbokgirl.png"
                        alt="girl"
                        width={1024}
                        height={1536}
                        priority
                    />
                </div>
            </div>
        </div>
        </ContentPage>
    );
};

export default Pricing;

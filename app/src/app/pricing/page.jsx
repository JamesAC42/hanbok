'use client';
import Image from 'next/image';
import styles from '@/styles/components/pagelayout.module.scss';
import pricingStyles from '@/styles/components/pricing.module.scss';

const Pricing = () => {
    return (
        <div className={styles.pageContainer}>
            <div className={styles.pageContent}>
                <div className={pricingStyles.pricingContent}>
                    <h1 className={styles.pageTitle}>Pricing</h1>
                    <section className={pricingStyles.section}>
                        <h2>Upgrade Options</h2>
                        <div className={pricingStyles.options}>
                            <div className={`${pricingStyles.optionCard} ${pricingStyles.oneTime}`}>
                                <div className={pricingStyles.badge}>Limited Time Only - 50% OFF</div>
                                <h3>One-Time Purchase</h3>
                                <p className={pricingStyles.price}>$6</p>
                                <ul className={pricingStyles.featuresList}>
                                    <li>Increase saved sentence limit from <strong>50</strong> to <strong>150</strong></li>
                                    <li>Increase saved words limit from <strong>100</strong> to <strong>200</strong></li>
                                    <li>An additional <strong>50 audio generations</strong></li>
                                </ul>
                                <button className={pricingStyles.purchaseButton}>Buy Now</button>
                            </div>
                            <div className={`${pricingStyles.optionCard} ${pricingStyles.subscription}`}>
                                <h3>Monthly Subscription</h3>
                                <p className={pricingStyles.price}>$10 / month</p>
                                <ul className={pricingStyles.featuresList}>
                                    <li><strong>Unlimited</strong> sentences saved</li>
                                    <li><strong>Unlimited</strong> saved words</li>
                                    <li><strong>Unlimited</strong> audio generations</li>
                                </ul>
                                <button className={pricingStyles.purchaseButton}>Subscribe</button>
                            </div>
                        </div>
                    </section>
                </div>
                <div className={pricingStyles.girl}>
                    <Image
                        src="/images/girl1.png"
                        alt="girl"
                        width={1249}
                        height={637}
                        priority
                    />
                </div>
            </div>
        </div>
    );
};

export default Pricing;

'use client';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from '@/styles/components/popups/promoPopup.module.scss';
import Mascot from '@/components/Mascot';

const BENEFITS = [
    'Unlimited sentence analyses',
    'Unlimited flashcards',
    'Higher tutor limits - chat without a sentence',
    'Audio generation',
    'Priority support',
];

const PromoPopup = ({ onClose }) => {
    const { t, language } = useLanguage();

    const handleUpgradeClick = () => {
        // Navigate to pricing page or handle upgrade logic
        window.location.href = '/pricing';
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div
                className={styles.popup}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="promo-popup-title"
            >
                <button className={styles.closeButton} onClick={onClose} aria-label="Close">
                    ×
                </button>
                
                <div className={styles.content}>
                    <div className={styles.header}>
                        <div className={styles.art}>
                            <Mascot pose="hero" size={96} />
                        </div>
                        <h2 id="promo-popup-title">Are you enjoying Hanbok?</h2>
                        <div className={styles.subtitle}>
                            Get unlimited access to analyses, flashcards, and more benefits
                        </div>
                    </div>

                    <ul className={styles.benefits}>
                        {BENEFITS.map((benefit) => (
                            <li key={benefit} className={styles.benefitItem}>
                                <span className={styles.checkmark} aria-hidden="true">✓</span>
                                {benefit}
                            </li>
                        ))}
                    </ul>

                    <div className={styles.pricing}>
                        <div className={styles.startingPrice}>
                            Starting at <span className={styles.price}>$4/month</span>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button 
                            className={styles.upgradeButton}
                            onClick={handleUpgradeClick}
                        >
                            View Plans
                        </button>
                        <button 
                            className={styles.laterButton}
                            onClick={onClose}
                        >
                            Maybe Later
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PromoPopup; 
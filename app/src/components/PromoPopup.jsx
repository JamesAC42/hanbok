'use client';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from '@/styles/components/popups/promoPopup.module.scss';

const PromoPopup = ({ onClose }) => {
    const { t, language } = useLanguage();

    const handleUpgradeClick = () => {
        // Navigate to pricing page or handle upgrade logic
        window.location.href = '/pricing';
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose}>
                    ×
                </button>
                
                <div className={styles.content}>
                    <div className={styles.header}>
                        <h2>Are you enjoying Hanbok?</h2>
                        <div className={styles.subtitle}>
                            Get unlimited access to analyses, flashcards, and more benefits
                        </div>
                    </div>

                    <div className={styles.pricing}>
                        <div className={styles.startingPrice}>
                            Starting at <span className={styles.price}>$4/month</span>
                        </div>
                    </div>

                    <div className={styles.benefits}>
                        <div className={styles.benefitItem}>
                            <span className={styles.checkmark}>✓</span>
                            Unlimited sentence analyses
                        </div>
                        <div className={styles.benefitItem}>
                            <span className={styles.checkmark}>✓</span>
                            Unlimited flashcards
                        </div>
                        <div className={styles.benefitItem}>
                            <span className={styles.checkmark}>✓</span>
                            Higher tutor limits - chat without a sentence
                        </div>
                        <div className={styles.benefitItem}>
                            <span className={styles.checkmark}>✓</span>
                            Audio generation
                        </div>
                        <div className={styles.benefitItem}>
                            <span className={styles.checkmark}>✓</span>
                            Priority support
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
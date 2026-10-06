import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from '@/styles/components/announcementpopup.module.scss'; // Reusing styles for now
import { LogosDiscord } from '@/components/icons/DiscordLogo'; // Import Discord Logo
import Mascot from '@/components/Mascot';

const SubscriptionPromptPopup = ({ onClose }) => {
    const router = useRouter();
    const { t } = useLanguage();

    const handlePricingClick = () => {
        router.push('/pricing');
        onClose();
    };

    // Add handlers from AnnouncementPopup
    const handleFeedbackClick = () => {
        router.push('/feedback');
        onClose();
    };

    const handleDiscordClick = () => {
        window.open('https://discord.gg/EQVvphzctc', '_blank');
        // Keep the prompt open when they click Discord
        // onClose(); 
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div 
                className={`${styles.popup} ${styles.wide}`} 
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="subscription-prompt-title"
            >
                <button className={styles.closeButton} onClick={onClose} aria-label={t('common.close')}>×</button>
                <div className={styles.header}>
                    <div className={styles.art}>
                        <Mascot pose="celebrate" size={92} />
                    </div>
                    <h2 id="subscription-prompt-title">{t('subscriptionPrompt.title')}</h2>
                </div>
                
                <div className={styles.content}>
                    {/* Lead with what each plan gives you. */}
                    <div className={styles.tiers}>
                        <section className={`${styles.tier} ${styles.tierBasic}`}>
                            <h3 className={styles.highlight}>{t('subscriptionPrompt.basicTierTitle')}</h3>
                            <p>{t('subscriptionPrompt.basicTierDesc')}</p>
                        </section>
                        <section className={`${styles.tier} ${styles.tierPlus}`}>
                            <h3 className={styles.highlight}>{t('subscriptionPrompt.plusTierTitle')}</h3>
                            <p>{t('subscriptionPrompt.plusTierDesc')}</p>
                        </section>
                    </div>

                    <p className={styles.note}>{t('subscriptionPrompt.description')}</p>
                    <p className={styles.note}><strong>{t('subscriptionPrompt.callToAction')}</strong></p>
                    
                    <div className={`${styles.buttons} ${styles.stackedButtons}`}>
                        <button 
                            className={styles.ctaButton}
                            onClick={handlePricingClick}
                            aria-label={t('subscriptionPrompt.viewPricing')}
                        >
                            <span className={styles.buttonText}>{t('subscriptionPrompt.viewPricing')}</span>
                        </button>
                        <button 
                            className={styles.secondaryButton}
                            onClick={onClose}
                            aria-label={t('subscriptionPrompt.maybeLater')}
                        >
                            <span className={styles.buttonText}>{t('subscriptionPrompt.maybeLater')}</span>
                        </button>
                    </div>

                    <div className={styles.communitySection}>
                        <h3>{t('announcement.communityTitle')}</h3>
                        <p>{t('announcement.communityDesc')}</p>
                        
                        <div className={styles.discordPromo}>
                            <div className={styles.discordLogoContainer}>
                                <LogosDiscord className={styles.discordLogo} />
                            </div>
                            <p className={styles.discordMessage}>{t('announcement.discordInvite')}</p>
                        </div>
                        
                        <div className={styles.buttonRow}>
                            <button 
                                className={styles.discordButton}
                                onClick={handleDiscordClick}
                                aria-label={t('announcement.joinDiscord')}
                            >
                                <span className={styles.buttonText}>{t('announcement.joinDiscord')}</span>
                            </button>
                            <button 
                                className={styles.feedbackButton}
                                onClick={handleFeedbackClick}
                                aria-label={t('announcement.leaveFeedback')}
                            >
                                <span className={styles.buttonText}>{t('announcement.leaveFeedback')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionPromptPopup; 
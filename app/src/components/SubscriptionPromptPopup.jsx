import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from '@/styles/components/announcementpopup.module.scss'; // Reusing styles for now
import { LogosDiscord } from '@/components/icons/DiscordLogo'; // Import Discord Logo

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
                className={styles.popup} 
                onClick={e => e.stopPropagation()}
                // Add specific style/class if needed later
            >
                <button className={styles.closeButton} onClick={onClose} aria-label={t('common.close')}>×</button>
                <div className={styles.header}>
                    <h2>{t('subscriptionPrompt.title')}</h2>
                </div>
                
                <div className={styles.content}>
                    <p>{t('subscriptionPrompt.description')}</p>
                    
                    <h3 className={styles.highlight}>{t('subscriptionPrompt.basicTierTitle')}</h3>
                    <p>{t('subscriptionPrompt.basicTierDesc')}</p>

                    <h3 className={styles.highlight}>{t('subscriptionPrompt.plusTierTitle')}</h3>
                    <p>{t('subscriptionPrompt.plusTierDesc')}</p>

                    <p>{t('subscriptionPrompt.callToAction')}</p>
                    
                    <div className={`${styles.buttons} ${styles.centeredButtons}`}> {/* Add a centered style if needed */}
                        <button 
                            className={styles.ctaButton} // Use a prominent style
                            onClick={handlePricingClick}
                            aria-label={t('subscriptionPrompt.viewPricing')}
                        >
                            <span className={styles.buttonText}>{t('subscriptionPrompt.viewPricing')}</span>
                        </button>
                        <button 
                            className={styles.secondaryButton} // Maybe a less prominent style
                            onClick={onClose}
                            aria-label={t('subscriptionPrompt.maybeLater')}
                        >
                            <span className={styles.buttonText}>{t('subscriptionPrompt.maybeLater')}</span>
                        </button>
                    </div>

                    {/* Add community section from AnnouncementPopup */}
                    <div className={styles.communitySection}>
                        <h3>{t('announcement.communityTitle')}</h3>
                        <p>{t('announcement.communityDesc')}</p>
                        
                        <div className={styles.discordPromo}>
                            <p className={styles.discordMessage}>{t('announcement.discordInvite')}</p>
                            <div className={styles.discordLogoContainer}>
                                <LogosDiscord className={styles.discordLogo} />
                            </div>
                        </div>
                        
                        <div className={styles.buttons}>
                            <button 
                                className={styles.discordButton}
                                onClick={handleDiscordClick}
                                aria-label={t('announcement.joinDiscord')}
                            >
                                <span className={styles.buttonText}>{t('announcement.joinDiscord')}</span>
                            </button>
                            {/* Share button might not be relevant here? Let's keep feedback */}
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
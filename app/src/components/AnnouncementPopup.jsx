import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from '@/styles/components/announcementpopup.module.scss';
import { LogosDiscord } from '@/components/icons/DiscordLogo';

const AnnouncementPopup = ({ onClose, announcementId, content }) => {
    const router = useRouter();
    const { t } = useLanguage();

    const handleFeedbackClick = () => {
        router.push('/feedback');
        onClose();
    };

    const handleDiscordClick = () => {
        window.open('https://discord.gg/EQVvphzctc', '_blank');
        onClose();
    };

    const handleShareClick = () => {
        if (navigator.share) {
            navigator.share({
                title: 'Hanbok - Korean Learning Tool',
                text: 'Check out this amazing language learning tool!',
                url: window.location.origin,
            })
            .catch((error) => console.log('Error sharing:', error));
        } else {
            navigator.clipboard.writeText(window.location.origin)
                .then(() => alert(t('announcement.linkCopied')))
                .catch((err) => console.error('Could not copy text: ', err));
        }
    };

    const handleFlashcardsClick = () => {
        router.push('/cards');
        onClose();
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div 
                className={styles.popup} 
                onClick={e => e.stopPropagation()}
            >
                <button className={styles.closeButton} onClick={onClose} aria-label={t('common.close')}>×</button>
                <div className={styles.header}>
                    <h2>{t('announcement.newFeatures')}</h2>
                    <div className={styles.badge}>{t('announcement.new')}</div>
                </div>
                
                <div className={styles.content}>
                    <h3>{t('announcement.lyricsPageTitle')}</h3>
                    <p>{t('announcement.lyricsPageDesc')}</p>
                    <p>{t('announcement.lyricsPageFeatures')}</p>
                    <button 
                        className={styles.lyricsButton}
                        onClick={() => {
                            router.push('/lyrics');
                            onClose();
                        }}
                        aria-label={t('announcement.viewLyrics')}
                    >
                        <span className={styles.buttonText}>{t('announcement.viewLyrics')}</span>
                    </button>
                    
                    <h3 className={styles.highlight}>{t('announcement.newSubscription')}</h3>
                    <p className={styles.highlight}>{t('announcement.newSubscriptionDesc')}</p>
                    
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
                            <button 
                                className={styles.shareButton}
                                onClick={handleShareClick}
                                aria-label={t('announcement.shareWebsite')}
                            >
                                <span className={styles.buttonText}>{t('announcement.shareWebsite')}</span>
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

export default AnnouncementPopup; 
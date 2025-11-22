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
                    <h3 className={styles.highlight}>{t('announcement.extendedTextTitle')}</h3>
                    <p>{t('announcement.extendedTextDesc')}</p>
                    <p>{t('announcement.extendedTextFeatures')}</p>
                    <button 
                        className={styles.lyricsButton}
                        onClick={() => {
                            router.push('/extended-text');
                            onClose();
                        }}
                        aria-label={t('announcement.tryExtendedText')}
                    >
                        <span className={styles.buttonText}>{t('announcement.tryExtendedText')}</span>
                    </button>

                    <h3>{t('announcement.themesTitle')}</h3>
                    <p>{t('announcement.themesDesc')}</p>
                    <p>{t('announcement.themesHint')}</p>
                    <button 
                        className={styles.lyricsButton}
                        onClick={() => {
                            router.push('/');
                            onClose();
                        }}
                        aria-label={t('announcement.pickTheme')}
                    >
                        <span className={styles.buttonText}>{t('announcement.pickTheme')}</span>
                    </button>

                    <h3>{t('announcement.upcomingTitle')}</h3>
                    <ul className={styles.featureList}>
                        <li>{t('announcement.upcomingGrammar')}</li>
                        <li>{t('announcement.upcomingQuizzes')}</li>
                    </ul>

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

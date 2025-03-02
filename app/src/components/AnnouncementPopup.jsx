import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from '@/styles/components/announcementpopup.module.scss';

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

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div 
                className={styles.popup} 
                onClick={e => e.stopPropagation()}
            >
                <button className={styles.closeButton} onClick={onClose}>×</button>
                <div className={styles.header}>
                    <h2>{t('announcement.newFeatures')}</h2>
                    <div className={styles.badge}>{t('announcement.new')}</div>
                </div>
                
                <div className={styles.content}>
                    <h3>{t('announcement.newLanguagesTitle')}</h3>
                    <p>{t('announcement.newLanguagesDesc')}</p>
                    
                    <h3>{t('announcement.imageExtractionTitle')}</h3>
                    <p>{t('announcement.imageExtractionDesc')}</p>
                    
                    <div className={styles.communitySection}>
                        <h3>{t('announcement.communityTitle')}</h3>
                        <p>{t('announcement.communityDesc')}</p>
                        
                        <div className={styles.buttons}>
                            <button 
                                className={styles.feedbackButton}
                                onClick={handleFeedbackClick}
                            >
                                {t('announcement.leaveFeedback')}
                            </button>
                            <button 
                                className={styles.discordButton}
                                onClick={handleDiscordClick}
                            >
                                {t('announcement.joinDiscord')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnnouncementPopup; 
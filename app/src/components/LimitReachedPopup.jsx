import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from '@/styles/components/limitreachedpopup.module.scss';

const LimitReachedPopup = ({ onClose, type = 'words' }) => {
    const router = useRouter();
    const { t } = useLanguage();

    const getMessage = () => {
        switch (type) {
            case 'related-words':
                return {
                    title: t('limitReached.plusFeatureTitle'),
                    message: t('limitReached.relatedWordsMessage')
                };
            default:
                return {
                    title: t('limitReached.storageTitle'),
                    message: t('limitReached.storageMessage').replace('{type}', type)
                };
        }
    };

    const handleUpgradeClick = () => {
        router.push('/pricing');
        onClose();
    };

    const { title, message } = getMessage();

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div 
                className={styles.popup} 
                onClick={e => e.stopPropagation()}
            >
                <button className={styles.closeButton} onClick={onClose}>×</button>
                <h2>{title}</h2>
                <p>{message}</p>
                <div className={styles.buttons}>
                    <button 
                        className={styles.upgradeButton}
                        onClick={handleUpgradeClick}
                    >
                        {t('limitReached.viewPricing')}
                    </button>
                    <button 
                        className={styles.cancelButton}
                        onClick={onClose}
                    >
                        {t('limitReached.maybeLater')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LimitReachedPopup; 
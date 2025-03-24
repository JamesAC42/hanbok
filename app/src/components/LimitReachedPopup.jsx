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
            case 'image-extracts':
                return {
                    title: t('limitReached.imageExtractsTitle'),
                    message: t('limitReached.imageExtractsMessage')
                };
            case 'sentence-analyses':
                return {
                    title: t('limitReached.sentenceAnalysesTitle') || 'Weekly Sentence Analysis Limit Reached',
                    message: t('limitReached.sentenceAnalysesMessage') || 'You have used all 30 of your free weekly sentence analyses. Upgrade to Premium for unlimited analyses, or purchase an additional 100 analyses for just $1.'
                };
            case 'first-five-used':
                return {
                    title: t('limitReached.firstFiveUsedTitle') || 'Weekly Sentence Analysis Usage',
                    message: t('limitReached.firstFiveUsedMessage') || 'You have used 5 out of your 30 free weekly sentence analyses. Consider upgrading to Premium for unlimited analyses.'
                };
            case 'fifteen-remaining':
                return {
                    title: t('limitReached.fifteenRemainingTitle') || 'Weekly Sentence Analysis Update',
                    message: t('limitReached.fifteenRemainingMessage') || 'You have 15 sentence analyses remaining for this week. Upgrade to Premium for unlimited analyses.'
                };
            case 'five-remaining':
                return {
                    title: t('limitReached.fiveRemainingTitle') || 'Weekly Sentence Analysis Alert',
                    message: t('limitReached.fiveRemainingMessage') || 'You only have 5 sentence analyses remaining for this week. Upgrade to Premium or purchase additional analyses.'
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
import { useRouter } from 'next/navigation';
import styles from '@/styles/components/limitreachedpopup.module.scss';

const LimitReachedPopup = ({ onClose, type = 'words' }) => {
    const router = useRouter();

    const getMessage = () => {
        switch (type) {
            case 'related-words':
                return {
                    title: 'Plus Feature',
                    message: 'Viewing related words is a Plus feature. Upgrade your account to see synonyms, antonyms, and expand your vocabulary!'
                };
            default:
                return {
                    title: 'Storage Limit Reached',
                    message: `You've reached the maximum number of saved ${type} for your current plan.`
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
                        View Pricing
                    </button>
                    <button 
                        className={styles.cancelButton}
                        onClick={onClose}
                    >
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LimitReachedPopup; 
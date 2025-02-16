import { useRouter } from 'next/navigation';
import styles from '@/styles/components/limitreachedpopup.module.scss';

const LimitReachedPopup = ({ onClose, type = 'words' }) => {
    const router = useRouter();

    const handleUpgradeClick = () => {
        router.push('/pricing');
        onClose();
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div 
                className={styles.popup} 
                onClick={e => e.stopPropagation()}
            >
                <button className={styles.closeButton} onClick={onClose}>×</button>
                <h2>Storage Limit Reached</h2>
                <p>
                    You've reached the maximum number of saved {type} for your current plan.
                </p>
                <p>
                    Upgrade your account to save more {type} and unlock additional features!
                </p>
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
import { useRouter } from 'next/navigation';
import styles from '@/styles/components/limitreachedpopup.module.scss';

const LoginRequiredPopup = ({ onClose, type = 'words' }) => {
    const router = useRouter();

    const handleLoginClick = () => {
        router.push('/login');
        onClose();
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div 
                className={styles.popup} 
                onClick={e => e.stopPropagation()}
            >
                <button className={styles.closeButton} onClick={onClose}>×</button>
                <h2>Login Required</h2>
                <p>
                    Create a free account to start saving {type} and track your learning progress!
                </p>
                <p>
                    Join thousands of Korean learners using Hanbok to improve their language skills.
                </p>
                <div className={styles.buttons}>
                    <button 
                        className={styles.upgradeButton}
                        onClick={handleLoginClick}
                    >
                        Create Account
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

export default LoginRequiredPopup; 
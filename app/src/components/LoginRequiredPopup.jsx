import { useRouter } from 'next/navigation';
import styles from '@/styles/components/limitreachedpopup.module.scss';

const LoginRequiredPopup = ({ onClose, type = 'words' }) => {
    const router = useRouter();

    const getMessage = () => {
        switch (type) {
            case 'related-words':
                return {
                    title: 'Login Required',
                    message: 'Create a free account to access word relationships and expand your vocabulary!',
                    subMessage: 'Join thousands of Korean learners using Hanbok to improve their language skills.'
                };
            case 'audio':
                return {
                    title: 'Login Required',
                    message: 'Create a free account to generate audio and hear native pronunciation!',
                    subMessage: 'Join thousands of Korean learners using Hanbok to improve their speaking and listening.'
                };
            default:
                return {
                    title: 'Login Required',
                    message: `Create a free account to start saving ${type} and track your learning progress!`,
                    subMessage: 'Join thousands of Korean learners using Hanbok to improve their language skills.'
                };
        }
    };

    const handleLoginClick = () => {
        router.push('/login');
        onClose();
    };

    const { title, message, subMessage } = getMessage();

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div 
                className={styles.popup} 
                onClick={e => e.stopPropagation()}
            >
                <button className={styles.closeButton} onClick={onClose}>×</button>
                <h2>{title}</h2>
                <p>{message}</p>
                <p>{subMessage}</p>
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
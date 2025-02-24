import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from '@/styles/components/limitreachedpopup.module.scss';

const LoginRequiredPopup = ({ onClose, type = 'words' }) => {
    const router = useRouter();
    const { t } = useLanguage();

    const getMessage = () => {
        const messages = t('loginRequired.messages')[type] || t('loginRequired.messages.default');
        return {
            title: t('loginRequired.title'),
            message: messages.main.replace('{type}', type),
            subMessage: messages.sub
        };
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
                        {t('loginRequired.createAccount')}
                    </button>
                    <button 
                        className={styles.cancelButton}
                        onClick={onClose}
                    >
                        {t('loginRequired.maybeLater')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginRequiredPopup; 
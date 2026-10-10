import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import { loginHref } from '@/lib/anonSentences';
import styles from '@/styles/components/limitreachedpopup.module.scss';
import Mascot from '@/components/Mascot';

const LoginRequiredPopup = ({ onClose, type = 'words' }) => {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const { t } = useLanguage();
    // The sign-up wall offers Google right here so the visitor stays on their sentence.
    const inlineSignup = type === 'sentence-analyses';

    useEffect(() => {
        if (isAuthenticated) onClose();
    }, [isAuthenticated, onClose]);

    const getMessage = () => {
        switch (type) {
            case 'related-words':
                return {
                    title: t('loginRequired.title'),
                    message: t('loginRequired.messages.related-words.main'),
                    subMessage: t('loginRequired.messages.related-words.sub')
                };
            case 'audio':
                return {
                    title: t('loginRequired.title'),
                    message: t('loginRequired.messages.audio.main'),
                    subMessage: t('loginRequired.messages.audio.sub')
                };
            case 'sentence-analyses':
                return {
                    title: t('loginRequired.messages.sentence-analyses.title'),
                    message: t('loginRequired.messages.sentence-analyses.main'),
                    subMessage: t('loginRequired.messages.sentence-analyses.sub')
                };
            case 'image-extracts':
                return {
                    title: t('loginRequired.title'),
                    message: t('loginRequired.messages.image-extracts.main'),
                    subMessage: t('loginRequired.messages.image-extracts.sub')
                };
            default:
                return {
                    title: t('loginRequired.title'),
                    message: t('loginRequired.messages.default.main').replace('{type}', type),
                    subMessage: t('loginRequired.messages.default.sub')
                };
        }
    };

    const handleLoginClick = () => {
        router.push(loginHref(true));
        onClose();
    };

    const { title, message, subMessage } = getMessage();

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div 
                className={styles.popup} 
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="login-popup-title"
            >
                <button className={styles.closeButton} onClick={onClose} aria-label={t('common.close')}>×</button>
                <div className={`${styles.art} ${styles.read}`}>
                    <Mascot pose="wave" size={96} />
                </div>
                <h2 id="login-popup-title">{title}</h2>
                <p>{message}</p>
                <p className={styles.subText}>{subMessage}</p>
                {inlineSignup && (
                    <div className={styles.google}>
                        <GoogleSignInButton text="signup_with" />
                    </div>
                )}
                <div className={styles.buttons}>
                    <button 
                        className={inlineSignup ? styles.cancelButton : styles.primaryButton}
                        onClick={handleLoginClick}
                    >
                        {inlineSignup ? t('loginRequired.signUpWithEmail') : t('loginRequired.createAccount')}
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
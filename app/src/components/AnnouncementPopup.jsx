import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from '@/styles/components/announcementpopup.module.scss';

// One-time "Speak is here" note. PopupContext decides who sees it and when;
// the full story is the /updates/speak post.
const AnnouncementPopup = ({ onClose }) => {
    const { t } = useLanguage();

    const highlights = [
        { tone: styles.dotRead, text: t('announcement.speakRolePlay') },
        { tone: styles.dotUnd, text: t('announcement.speakHelp') },
        { tone: styles.dotKeep, text: t('announcement.speakWords') },
    ];

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div
                className={`${styles.popup} ${styles.news}`}
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="announcement-title"
            >
                <button className={styles.closeButton} onClick={onClose} aria-label={t('common.close')}>×</button>
                <div className={styles.speakArt} aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/speak/horang/happy.webp" alt="" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/speak/sora/happy.webp" alt="" />
                </div>
                <div className={styles.badge}>{t('announcement.speakBadge')}</div>
                <h2 id="announcement-title">{t('announcement.speakTitle')}</h2>
                <p>{t('announcement.speakBody')}</p>

                <ul className={styles.highlights}>
                    {highlights.map(h => (
                        <li key={h.text}><span className={`${styles.dot} ${h.tone}`} aria-hidden="true" />{h.text}</li>
                    ))}
                </ul>

                <div className={styles.buttons}>
                    <Link href="/speak" className={styles.primaryButton} onClick={onClose}>
                        {t('announcement.speakCta')}
                    </Link>
                    <button className={styles.cancelButton} onClick={onClose}>
                        {t('announcement.speakDismiss')}
                    </button>
                </div>
                <p className={styles.feedbackNote}>
                    <Link href="/updates/speak" onClick={onClose}>{t('announcement.speakReadMore')}</Link>
                </p>
            </div>
        </div>
    );
};

export default AnnouncementPopup;

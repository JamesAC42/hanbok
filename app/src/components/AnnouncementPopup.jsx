import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from '@/styles/components/announcementpopup.module.scss';
import Mascot from '@/components/Mascot';

// One-time "Hanbok has a new look" note for people who used the old design.
// PopupContext decides who sees it; the full story is the /updates post.
const AnnouncementPopup = ({ onClose }) => {
    const { t } = useLanguage();

    const highlights = [
        { tone: styles.dotUnd, text: t('announcement.redesignPath') },
        { tone: styles.dotRev, text: t('announcement.redesignReview') },
        { tone: styles.dotKeep, text: t('announcement.redesignLibrary') },
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
                <div className={`${styles.art} ${styles.und}`}>
                    <Mascot pose="celebrate" size={96} />
                </div>
                <div className={styles.badge}>{t('announcement.redesignBadge')}</div>
                <h2 id="announcement-title">{t('announcement.redesignTitle')}</h2>
                <p>{t('announcement.redesignBody')}</p>

                <ul className={styles.highlights}>
                    {highlights.map(h => (
                        <li key={h.text}><span className={`${styles.dot} ${h.tone}`} aria-hidden="true" />{h.text}</li>
                    ))}
                </ul>

                <div className={styles.buttons}>
                    <Link href="/updates/new-hanbok" className={styles.primaryButton} onClick={onClose}>
                        {t('announcement.redesignCta')}
                    </Link>
                    <button className={styles.cancelButton} onClick={onClose}>
                        {t('announcement.redesignDismiss')}
                    </button>
                </div>
                <p className={styles.feedbackNote}>
                    {t('announcement.redesignFeedback')}{' '}
                    <Link href="/feedback" onClick={onClose}>{t('announcement.redesignFeedbackLink')}</Link>
                </p>
            </div>
        </div>
    );
};

export default AnnouncementPopup;

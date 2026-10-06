import Link from 'next/link';
import Mascot from '@/components/Mascot';
import styles from '@/styles/components/statusscreen.module.scss';

// Full-page message used by not-found, error and loading screens:
// Kkachi, a short title, one sentence and the next step.
const StatusScreen = ({ pose = 'think', title, text, children, live = false }) => (
    <main className={styles.screen} aria-live={live ? 'polite' : undefined}>
        <Link href="/" className={styles.logo} aria-label="Hanbok home">hanbok</Link>
        <div className={styles.card}>
            <Mascot pose={pose} size={120} motion="bob" className={styles.mascot} />
            {title && <h1 className={styles.title}>{title}</h1>}
            {text && <p className={styles.text}>{text}</p>}
            {children && <div className={styles.actions}>{children}</div>}
        </div>
    </main>
);

export const LoadingScreen = () => (
    <div className={styles.loading} role="status" aria-live="polite">
        <Mascot pose="think" size={84} motion="bob" />
        <span className={styles.loadingText}>
            Loading
            <span className={styles.dots} aria-hidden="true"><i /><i /><i /></span>
        </span>
    </div>
);

export default StatusScreen;

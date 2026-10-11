'use client';
import { useEffect, useRef } from 'react';
import styles from '@/styles/components/interstitials.module.scss';

// Full-screen shell for the popups in this folder: covers the page, closes on
// Escape, the close button or a click outside the card, and locks scrolling.
const InterstitialFrame = ({ labelledBy, onClose, tone = 'read', children }) => {
    const cardRef = useRef(null);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        const overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        cardRef.current?.focus();
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = overflow;
        };
    }, [onClose]);

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div
                ref={cardRef}
                tabIndex={-1}
                className={`${styles.card} ${styles[`tone_${tone}`] || ''}`}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby={labelledBy}
            >
                <button type="button" className={styles.close} onClick={onClose} aria-label="Close">×</button>
                {children}
            </div>
        </div>
    );
};

export default InterstitialFrame;

'use client';
import { useEffect, useRef, useState } from 'react';
import styles from '@/styles/pages/landing.module.scss';
import { track } from '@/lib/analytics';

// The 36-second tour. Nothing downloads until it scrolls into view; then it
// plays muted and loops, and the visitor can take over with the controls.
export default function PromoVideo() {
    const ref = useRef(null);
    const [seen, setSeen] = useState(false);

    useEffect(() => {
        const video = ref.current;
        if (!video || !('IntersectionObserver' in window)) return undefined;
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        const io = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                if (!seen) { setSeen(true); track('promo_view'); }
                if (!reduce) video.play().catch(() => {});
            } else {
                video.pause();
            }
        }, { threshold: 0.4 });
        io.observe(video);
        return () => io.disconnect();
    }, [seen]);

    return (
        <div className={styles.promo}>
            <video ref={ref} className={styles.promoVideo} muted loop playsInline controls preload="none"
                poster="/videos/hanbok-promo-poster.jpg" aria-label="A 36-second tour of Hanbok">
                <source src="/videos/hanbok-promo.webm" type="video/webm" />
                <source src="/videos/hanbok-promo.mp4" type="video/mp4" />
            </video>
        </div>
    );
}

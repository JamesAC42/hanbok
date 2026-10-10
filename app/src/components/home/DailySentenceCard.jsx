'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { track } from '@/lib/analytics';
import styles from '@/styles/home/dashboardhome.module.scss';

// One Korean line a day. Breaking it down is free and counts for the streak.
const DailySentenceCard = ({ streak }) => {
    const router = useRouter();
    const { language } = useLanguage();
    const [sentence, setSentence] = useState(null);

    useEffect(() => {
        if (language !== 'ko') return;
        let cancelled = false;
        fetch('/api/daily-sentence')
            .then((res) => res.json())
            .then((data) => { if (!cancelled && data?.success) setSentence(data); })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [language]);

    if (language !== 'ko' || !sentence) return null;

    const breakDown = () => {
        track('daily_sentence', { streak: streak?.current || 0 });
        // The analyze page picks this up and runs it right away.
        localStorage.setItem('pendingAnalysis', sentence.text);
        localStorage.setItem('pendingAnalysisRun', '1');
        router.push('/analyze');
    };

    const keepsStreak = streak?.current && !streak.activeToday;

    return (
        <section className={`${styles.card} ${styles.dailyCard}`} aria-labelledby="daily-heading">
            <h2 id="daily-heading" className={styles.cardTitle}>Sentence of the day</h2>
            <p className={styles.dailyText} lang="ko">{sentence.text}</p>
            <p className={styles.dailyGist}>{sentence.gist}</p>
            <div className={styles.dailyBar}>
                <span className={styles.muted}>
                    {keepsStreak ? 'Free, and it keeps your streak going.' : 'Free, and it counts for your streak.'}
                </span>
                <button type="button" className={`${styles.pressButton} ${styles.press_read}`} onClick={breakDown}>
                    Break it down
                </button>
            </div>
        </section>
    );
};

export default DailySentenceCard;

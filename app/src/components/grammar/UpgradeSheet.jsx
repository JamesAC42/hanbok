'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import Tiger from '@/components/Tiger';
import { track } from '@/lib/analytics';
import styles from '@/styles/components/grammar.module.scss';

// Shown when a free account reaches a grammar limit. Review of saved grammar
// never locks, so the sheet always says so.
const COPY = {
    quiz: {
        title: "That was today's free practice",
        body: 'Horangi has more questions ready, built from your saved words. Basic unlocks unlimited grammar practice.',
    },
    lesson: {
        title: "You've used this week's free lessons",
        body: 'Basic unlocks unlimited Horangi lessons for every grammar point you save.',
    },
    save: {
        title: 'Your grammar path is full',
        body: 'Free accounts keep 20 grammar points. Basic saves as many as you like.',
    },
};

const UpgradeSheet = ({ reason = 'quiz', onClose }) => {
    const copy = COPY[reason] || COPY.quiz;

    useEffect(() => {
        track('grammar_paywall_shown', { reason });
        const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [reason, onClose]);

    return (
        <div className={styles.backdrop} role="dialog" aria-modal="true" aria-labelledby="grammar-upgrade-title" onClick={onClose}>
            <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
                <Tiger pose="think" size={110} />
                <h2 id="grammar-upgrade-title">{copy.title}</h2>
                <p className={styles.muted}>{copy.body}</p>
                <Link href="/pricing" className={`${styles.pressRead} ${styles.wide}`} onClick={() => track('grammar_paywall_click', { reason })}>
                    See plans
                </Link>
                <p className={styles.muted} style={{ fontSize: '.88rem' }}>Reviewing the grammar you saved stays free.</p>
                <button type="button" className={styles.removeButton} style={{ alignSelf: 'center' }} onClick={onClose}>Not now</button>
            </div>
        </div>
    );
};

export default UpgradeSheet;

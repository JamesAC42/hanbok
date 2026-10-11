'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { speakEvent } from '@/lib/speakEvents';
import InterstitialFrame from './InterstitialFrame';
import styles from '@/styles/components/interstitials.module.scss';

const POINTS = [
    'Role-play real scenes out loud: a café, a taxi, a new friend in Seoul',
    'Get help in English whenever you get stuck',
    'Afterwards, read the whole conversation with translations and save the grammar',
];

// One-time announcement of Speak for signed-in learners.
const SpeakInterstitial = ({ onClose, onAction, free }) => {
    useEffect(() => { speakEvent('announcement_view', { where: 'interstitial' }); }, []);
    const close = () => { speakEvent('announcement_dismiss'); onClose(); };
    const go = (action) => () => { speakEvent('announcement_click', { where: action }); onAction(action); onClose(); };

    return (
        <InterstitialFrame labelledBy="speak-interstitial-title" onClose={close} tone="speak">
            <div className={styles.split}>
                <div className={styles.splitText}>
                    <span className={`${styles.pill} ${styles.pillSpeak}`}>New</span>
                    <h2 id="speak-interstitial-title" className={styles.title}>Practice speaking with Horang and Sora</h2>
                    <p className={styles.subtitle}>
                        Have real conversations in Korean, out loud, with two characters who are happy to help.
                    </p>
                    <ul className={styles.points}>
                        {POINTS.map((point) => (
                            <li key={point}><span aria-hidden="true">✓</span>{point}</li>
                        ))}
                    </ul>
                    <div className={styles.actions}>
                        <Link href="/speak?from=announcement" className={styles.primary} onClick={go('try')}>
                            Try a free call
                        </Link>
                        <Link href="/updates/speak" className={styles.secondary} onClick={go('read_more')}>
                            See how it works
                        </Link>
                    </div>
                    {free && <p className={styles.speakFine}>Free accounts get 5 speaking minutes every week.</p>}
                </div>
                <div className={styles.speakArt} aria-hidden="true">
                    <img className={styles.speakBg} src="/images/speak/bg/cafe.webp" alt="" />
                    <img className={styles.speakSora} src="/images/speak/sora/happy.webp" alt="" />
                    <img className={styles.speakHorang} src="/images/speak/horang/happy.webp" alt="" />
                </div>
            </div>
        </InterstitialFrame>
    );
};

export default SpeakInterstitial;

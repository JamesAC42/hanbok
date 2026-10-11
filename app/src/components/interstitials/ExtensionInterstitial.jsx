'use client';
import Link from 'next/link';
import { CHROME_EXTENSION_URL } from '@/lib/extension';
import InterstitialFrame from './InterstitialFrame';
import styles from '@/styles/components/interstitials.module.scss';

const POINTS = [
    'Select a sentence on any website to see its translation, words and grammar',
    'Save words to your deck in one click',
    'Words you saved light up in gold everywhere you read',
];

// One-time announcement of the Chrome extension, for desktop Chrome users who
// don't have it yet.
const ExtensionInterstitial = ({ onClose, onAction }) => (
    <InterstitialFrame labelledBy="extension-interstitial-title" onClose={onClose} tone="read">
        <div className={styles.split}>
            <div className={styles.splitText}>
                <span className={`${styles.pill} ${styles.pillRead}`}>New</span>
                <h2 id="extension-interstitial-title" className={styles.title}>Hanbok is now in Chrome</h2>
                <p className={styles.subtitle}>
                    Study the pages you already read. Free with your Hanbok account.
                </p>
                <ul className={styles.points}>
                    {POINTS.map((point) => (
                        <li key={point}><span aria-hidden="true">✓</span>{point}</li>
                    ))}
                </ul>
                <div className={styles.actions}>
                    <a
                        href={CHROME_EXTENSION_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.primary}
                        onClick={() => { onAction('install'); onClose(); }}
                    >
                        Add to Chrome
                    </a>
                    <Link href="/extension" className={styles.secondary} onClick={() => { onAction('learn_more'); onClose(); }}>
                        Learn more
                    </Link>
                </div>
            </div>
            <img
                className={styles.shot}
                src="/images/updates/extension-analyze.webp"
                alt="The Hanbok extension breaking down a Korean sentence on a web page"
                width={700}
                height={720}
            />
        </div>
    </InterstitialFrame>
);

export default ExtensionInterstitial;

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import Mascot from '@/components/Mascot';
import { track } from '@/lib/analytics';
import styles from '@/styles/pages/learn.module.scss';

// "Try it on your own sentence": hands the text to the analyzer. With `run`,
// the analyzer starts the breakdown right away instead of only filling its input.
const TryIt = ({ lang = 'ko', placeholder, title = 'Try it on a sentence you saw today', run = false, source, id = 'learn-try-it' }) => {
    const router = useRouter();
    const { setLanguage } = useLanguage();
    const [text, setText] = useState('');

    const submit = (e) => {
        e.preventDefault();
        const value = text.trim();
        if (!value) return;
        setLanguage(lang);
        // The analyze page picks this up and fills its input.
        try {
            localStorage.setItem('pendingAnalysis', value);
            if (run) localStorage.setItem('pendingAnalysisRun', '1');
        } catch { /* private mode: the analyzer just opens empty */ }
        if (source) track('seo_try', { source });
        router.push('/analyze');
    };

    return (
        <form className={styles.tryIt} onSubmit={submit}>
            <Mascot pose="teach" size={84} />
            <div className={styles.tryItBody}>
                <label htmlFor={id} className={styles.tryItTitle}>{title}</label>
                <p>Paste a line from a song, a drama or a text message. Hanbok marks every particle and explains each word.</p>
                <div className={styles.tryItRow}>
                    <input
                        id={id}
                        lang={lang}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={placeholder}
                        className={styles.tryItInput}
                    />
                    <button type="submit" className={styles.primaryButton} disabled={!text.trim()}>Break it down</button>
                </div>
            </div>
        </form>
    );
};

export default TryIt;

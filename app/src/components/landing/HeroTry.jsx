'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/pages/landing.module.scss';
import { track } from '@/lib/analytics';
import { useLanguage } from '@/contexts/LanguageContext';

const EXAMPLES = [
    { text: '보고 싶어요', lang: 'ko', label: 'I miss you' },
    { text: '今日はいい天気ですね', lang: 'ja', label: 'Nice weather today' },
    { text: '你吃饭了吗？', lang: 'zh', label: 'Have you eaten?' },
];

// Pick the study language from the script, so a Japanese line isn't read as Korean.
const guessLanguage = (text) => {
    if (/[\uac00-\ud7af\u1100-\u11ff\u3130-\u318f]/.test(text)) return 'ko';
    if (/[\u3040-\u30ff]/.test(text)) return 'ja';
    if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
    return null;
};

// The hero's "try it now" box. It hands the sentence to the analyzer, the same
// way the signed-in Home and the Learn articles do, and starts the breakdown.
export default function HeroTry() {
    const router = useRouter();
    const [text, setText] = useState('');
    const { setLanguage } = useLanguage();

    const go = (value, source) => {
        const sentence = value.trim();
        if (!sentence) return;
        const lang = guessLanguage(sentence);
        if (lang) setLanguage(lang);
        try {
            localStorage.setItem('pendingAnalysis', sentence);
            localStorage.setItem('pendingAnalysisRun', '1');
        } catch { /* private mode: the analyzer just opens empty */ }
        track('landing_try', { source, language: lang || 'other' });
        router.push('/analyze');
    };

    return (
        <div className={styles.try}>
            <form className={styles.tryForm} onSubmit={(e) => { e.preventDefault(); go(text, 'typed'); }}>
                <label htmlFor="landing-try" className={styles.srOnly}>Paste a sentence to break down</label>
                <input id="landing-try" value={text} onChange={(e) => setText(e.target.value)}
                    placeholder="Paste a Korean, Japanese or Chinese sentence" autoComplete="off" />
                <button type="submit" className={styles.tryButton} data-cta="hero">Break it down</button>
            </form>
            <div className={styles.tryExamples}>
                <span>Or try</span>
                {EXAMPLES.map((ex) => (
                    <button key={ex.text} type="button" lang={ex.lang} title={ex.label} onClick={() => go(ex.text, `example_${ex.lang}`)}>
                        {ex.text}
                    </button>
                ))}
            </div>
        </div>
    );
}

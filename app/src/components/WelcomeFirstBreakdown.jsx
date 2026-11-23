'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Mascot from '@/components/Mascot';
import InterstitialFrame from '@/components/interstitials/InterstitialFrame';
import { track } from '@/lib/analytics';
import { readContextSentence, takeNewSignup } from '@/lib/firstBreakdown';
import styles from '@/styles/components/interstitials.module.scss';

// Half of new accounts never run a single breakdown, and few of them ever open
// /home where the first-breakdown card lives (most sign up in place, on a phrase
// page or a popup). So right after sign-up, offer one: the line they were just
// reading if there is one, else a short example. One tap runs it.
const FALLBACK = {
    ko: { text: '보고 싶어요', en: 'I miss you' },
    ja: { text: 'また会いたいです', en: 'I want to see you again' },
    zh: { text: '你吃饭了吗？', en: 'Have you eaten?' },
};

// Already analyzing, or on the way to pay: leave them be.
const SKIP_PATHS = ['/analyze', '/sentence', '/pricing', '/extended-text'];

export default function WelcomeFirstBreakdown() {
    const { user } = useAuth();
    const { language, setLanguage } = useLanguage();
    const pathname = usePathname() || '';
    const router = useRouter();
    const [offer, setOffer] = useState(null);

    useEffect(() => {
        if (!user?.userId) return;
        if (!takeNewSignup()) return;
        if (SKIP_PATHS.some((p) => pathname.startsWith(p))) return;
        try { if (localStorage.getItem('hanbok_pending_checkout')) return; } catch {}
        const ctx = readContextSentence();
        const lang = ctx?.lang || language || 'ko';
        const fallback = FALLBACK[lang] || FALLBACK.ko;
        const next = ctx
            ? { text: ctx.text, lang, source: ctx.source || 'context', trialDays: user.plusTrialWaitingDays || 0 }
            : { text: fallback.text, en: fallback.en, lang, source: 'example', trialDays: user.plusTrialWaitingDays || 0 };
        // Let the sign-in toasts land first.
        const timer = setTimeout(() => {
            setOffer(next);
            track('welcome_breakdown_view', { source: next.source });
        }, 800);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.userId]);

    if (!offer) return null;

    const run = () => {
        track('welcome_breakdown_run', { source: offer.source });
        if (offer.lang && offer.lang !== language) setLanguage(offer.lang);
        try {
            localStorage.setItem('pendingAnalysis', offer.text);
            localStorage.setItem('pendingAnalysisRun', '1');
        } catch { /* private mode: the analyzer just opens empty */ }
        setOffer(null);
        router.push('/analyze');
    };
    const close = () => {
        track('welcome_breakdown_dismiss', { source: offer.source });
        setOffer(null);
    };

    return (
        <InterstitialFrame labelledBy="welcome-breakdown-title" onClose={close}>
            <div className={styles.welcome}>
                <Mascot pose="celebrate" size={88} />
                <span className={styles.pill}>You&apos;re in</span>
                <h2 id="welcome-breakdown-title" className={styles.title}>Now see how Hanbok reads a sentence</h2>
                <p className={styles.subtitle}>
                    {offer.source === 'example'
                        ? 'One tap and every word, ending and grammar point gets explained, with audio.'
                        : 'Here is the line you were just reading. One tap and every word, ending and grammar point gets explained, with audio.'}
                </p>
                <div className={styles.welcomeSentence} lang={offer.lang}>
                    <strong>{offer.text}</strong>
                    {offer.en && <span>{offer.en}</span>}
                </div>
                {offer.trialDays > 0 && (
                    <p className={styles.welcomeTrial}>Your first breakdown also unlocks {offer.trialDays} days of Plus, free. No card needed.</p>
                )}
                <div className={styles.actions}>
                    <button type="button" className={styles.primary} onClick={run} autoFocus>Break it down</button>
                    <button type="button" className={styles.secondary} onClick={close}>Maybe later</button>
                </div>
            </div>
        </InterstitialFrame>
    );
}

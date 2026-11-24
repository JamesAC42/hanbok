'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Mascot from '@/components/Mascot';
import InterstitialFrame from '@/components/interstitials/InterstitialFrame';
import { startCheckout, PRICE_IDS } from '@/lib/checkout';
import { track } from '@/lib/analytics';
import styles from '@/styles/components/interstitials.module.scss';

// Card-required trial (no-card trial off): a few seconds after a breakdown
// finishes, offer free days of Plus through Stripe Checkout. The card is taken
// there and charged when the trial ends. Shown at most 3 times, 3 days apart.
const KEY = 'hanbok_card_trial_offer';
const MAX_SHOWS = 3;
const GAP_MS = 3 * 24 * 60 * 60 * 1000;
const DELAY_MS = 6000;

const PERKS = [
    'Unlimited sentence breakdowns',
    'Audio for every sentence, slow and normal speed',
    'Unlimited flashcards and grammar practice',
    'Read text from photos and screenshots',
];

const readState = () => {
    try { return JSON.parse(localStorage.getItem(KEY)) || { count: 0, last: 0 }; } catch { return { count: 0, last: 0 }; }
};

const chargeDate = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

export default function CardTrialOffer() {
    const { user } = useAuth();
    const days = user?.plusCardTrialDays || 0;
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!days) return;
        let timer = null;
        const onDone = () => {
            const state = readState();
            if (state.count >= MAX_SHOWS || Date.now() - state.last < GAP_MS) return;
            clearTimeout(timer);
            timer = setTimeout(() => {
                // Another popup is up: try again after the next breakdown.
                if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
                try { localStorage.setItem(KEY, JSON.stringify({ count: state.count + 1, last: Date.now() })); } catch {}
                track('card_trial_view', { shown: state.count + 1 });
                setOpen(true);
            }, DELAY_MS);
        };
        window.addEventListener('hanbok:breakdown-done', onDone);
        return () => { window.removeEventListener('hanbok:breakdown-done', onDone); clearTimeout(timer); };
    }, [days]);

    if (!open || !days) return null;

    const start = async () => {
        setBusy(true);
        track('card_trial_click', { days });
        const ok = await startCheckout(PRICE_IDS.PLUS_SUBSCRIPTION, { offer: 'cardTrial' });
        if (!ok) window.location.href = '/pricing';
    };
    const close = () => {
        track('card_trial_dismiss', { days });
        setOpen(false);
    };

    return (
        <InterstitialFrame labelledBy="card-trial-title" onClose={close}>
            <div className={styles.welcome}>
                <Mascot pose="point" size={84} />
                <span className={styles.pill}>{days} days free</span>
                <h2 id="card-trial-title" className={styles.title}>Try Plus free for {days} days</h2>
                <p className={styles.subtitle}>Everything Hanbok can do, on every sentence you read.</p>
                <ul className={styles.cardTrialPerks}>
                    {PERKS.map((perk) => <li key={perk}><span aria-hidden="true">✓</span>{perk}</li>)}
                </ul>
                <p className={styles.welcomeTrial}>
                    $0 today. Then $10 a month from {chargeDate(days)}, unless you cancel before then.
                </p>
                <div className={styles.actions}>
                    <button type="button" className={styles.primary} onClick={start} disabled={busy} autoFocus>
                        {busy ? 'Opening checkout…' : `Start my ${days} free days`}
                    </button>
                    <button type="button" className={styles.secondary} onClick={close}>Not now</button>
                </div>
                <p className={styles.cardTrialFine}>Cancel anytime from your profile.</p>
            </div>
        </InterstitialFrame>
    );
}

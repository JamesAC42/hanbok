'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { track } from '@/lib/analytics';
import Mascot from '@/components/Mascot';
import { PLAN_PRICES, dealYearlyPrice, formatPrice, dealAmountLabel, dealDurationLabel, dealEndsLabel } from '@/lib/plans';
import InterstitialFrame from './InterstitialFrame';
import styles from '@/styles/components/interstitials.module.scss';

const PLANS = [
    {
        key: 'plus',
        name: 'Plus',
        perks: ['Unlimited sentence breakdowns', 'Unlimited flashcards and grammar practice', 'Audio for every sentence', 'Read text from photos'],
    },
    {
        key: 'basic',
        name: 'Basic',
        perks: ['Unlimited sentence breakdowns', '50 tutor chats a month', 'Unlimited saved words'],
    },
];

// Asked once when someone closes the trial-ended popup without keeping Plus.
// Saved by server/controllers/trialFeedback.js, shown on the admin Surveys tab.
const WHY = [
    { value: 'price', label: "It's too expensive for me" },
    { value: 'notEnoughUse', label: "I didn't use it enough" },
    { value: 'missing', label: "It's missing something I need" },
    { value: 'didntNotice', label: "I didn't know I had Plus" },
    { value: 'other', label: 'Something else' },
];

const sendWhy = (reason, note) => fetch('/api/trial-feedback', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason, note }),
}).catch(() => {});

const WhyStep = ({ onClose }) => {
    const [reason, setReason] = useState(null);
    const [note, setNote] = useState('');
    const [sent, setSent] = useState(false);

    useEffect(() => {
        if (!sent) return;
        const timer = setTimeout(onClose, 1800);
        return () => clearTimeout(timer);
    }, [sent, onClose]);

    const submit = () => {
        if (!reason) return;
        sendWhy(reason, note);
        track('trial_feedback', { reason, note: !!note.trim() });
        setSent(true);
    };
    const skip = () => {
        track('trial_feedback_skip');
        onClose();
    };

    return (
        <InterstitialFrame labelledBy="trial-why-title" onClose={skip} tone="read">
            <div className={styles.hero}>
                <Mascot pose={sent ? 'celebrate' : 'think'} size={88} />
                <h2 id="trial-why-title" className={styles.title}>{sent ? 'Thank you!' : 'One quick question'}</h2>
                <p className={styles.subtitle}>
                    {sent
                        ? 'I read every answer, and it decides what we fix next.'
                        : 'What stopped you from keeping Plus? Pick one, it takes two seconds.'}
                </p>
            </div>
            {!sent && (
                <>
                    <div className={styles.whyOptions} role="radiogroup" aria-labelledby="trial-why-title">
                        {WHY.map((o) => (
                            <button key={o.value} type="button" role="radio" aria-checked={reason === o.value}
                                className={`${styles.whyOption} ${reason === o.value ? styles.whyOptionOn : ''}`}
                                onClick={() => setReason(o.value)}>
                                {o.label}
                            </button>
                        ))}
                    </div>
                    {reason && (
                        <textarea className={styles.whyNote} rows={3} maxLength={500} value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder={reason === 'missing' ? 'What would you need? (optional)' : 'Anything else? (optional)'} />
                    )}
                    <div className={styles.actions}>
                        <button type="button" className={styles.primary} disabled={!reason} onClick={submit}>Send</button>
                        <button type="button" className={styles.secondary} onClick={skip}>Skip</button>
                    </div>
                </>
            )}
        </InterstitialFrame>
    );
};

const perMonth = (yearly) => formatPrice(Math.round(yearly / 12 * 100) / 100);

// Full-screen plans pitch. With a deal (YEARLY_DEAL_COUPON_ID) it leads with
// the discount; every number comes from the coupon or the real list prices.
const PlansInterstitial = ({ deal, trial, trialEnded = false, onClose, onAction }) => {
    const [asking, setAsking] = useState(false);
    const ends = dealEndsLabel(deal);
    const plusDeal = dealYearlyPrice('plus', deal);

    const title = trialEnded
        ? 'Your free week of Plus is over'
        : deal ? `${dealAmountLabel(deal)} a year of Hanbok` : 'Study without limits';
    const subtitle = trialEnded && deal
        ? `You're back on the free plan, with 5 breakdowns a week. As a thank-you for trying Plus, keep it for ${formatPrice(plusDeal)} ${dealDurationLabel(deal)} instead of ${formatPrice(PLAN_PRICES.plus.yearly)}.`
        : trialEnded
        ? `You're back on the free plan, with 5 breakdowns a week. Keep Plus from ${perMonth(PLAN_PRICES.plus.yearly)} a month on a yearly plan, and everything you saved stays put.`
        : deal
        ? `Get Plus for ${formatPrice(plusDeal)} ${dealDurationLabel(deal)} instead of ${formatPrice(PLAN_PRICES.plus.yearly)}.`
        : trial
            ? `Try Plus free for ${trial.days} days. Cancel before it ends and you pay nothing.`
            : `Unlimited breakdowns, flashcards and audio, from ${perMonth(PLAN_PRICES.basic.yearly)} a month on a yearly plan.`;
    const cta = trialEnded ? 'Keep Plus' : deal ? 'Get the deal' : trial ? 'Try Plus free' : 'See plans';
    const pill = trialEnded
        ? (deal ? 'Trial-end offer' : 'Hanbok Plus')
        : deal ? (ends ? 'Limited-time deal' : 'Yearly deal') : 'Hanbok Plus';

    if (asking) return <WhyStep onClose={onClose} />;

    return (
        <InterstitialFrame labelledBy="plans-interstitial-title" onClose={onClose} tone={deal ? 'rev' : 'read'}>
            <div className={styles.hero}>
                <Mascot pose="celebrate" size={104} />
                <span className={`${styles.pill} ${deal ? styles.pillRev : styles.pillRead}`}>
                    {pill}
                </span>
                <h2 id="plans-interstitial-title" className={styles.title}>{title}</h2>
                <p className={styles.subtitle}>{subtitle}</p>
                {ends && <p className={styles.ends}>{ends}</p>}
            </div>

            <div className={styles.plans}>
                {PLANS.map((plan) => {
                    const list = PLAN_PRICES[plan.key].yearly;
                    const price = deal ? dealYearlyPrice(plan.key, deal) : list;
                    return (
                        <section key={plan.key} className={`${styles.plan} ${plan.key === 'plus' ? styles.planFeatured : ''}`}>
                            {plan.key === 'plus' && <span className={styles.planBadge}>Most popular</span>}
                            <h3>{plan.name}</h3>
                            <p className={styles.planPrice}>
                                {deal && <s>{formatPrice(list)}</s>}
                                <strong>{formatPrice(price)}</strong>
                                <span>/year</span>
                            </p>
                            <p className={styles.planMonthly}>{perMonth(price)} a month, billed yearly</p>
                            <ul>
                                {plan.perks.map((perk) => (
                                    <li key={perk}><span aria-hidden="true">✓</span>{perk}</li>
                                ))}
                            </ul>
                        </section>
                    );
                })}
            </div>

            <div className={styles.actions}>
                <Link href="/pricing" className={styles.primary} onClick={() => { onAction('pricing'); onClose(); }}>
                    {cta}
                </Link>
                <button type="button" className={styles.secondary} onClick={() => { onAction('dismiss'); if (trialEnded) setAsking(true); else onClose(); }}>
                    Not now
                </button>
            </div>
            <p className={styles.fine}>
                {deal ? 'Applied automatically at checkout. ' : ''}Cancel anytime from your profile.
            </p>
        </InterstitialFrame>
    );
};

export default PlansInterstitial;

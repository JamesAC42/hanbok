'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Mascot from '@/components/Mascot';
import { track } from '@/lib/analytics';
import { PRICE_IDS, startCheckout } from '@/lib/checkout';
import { PLAN_PRICES, dealYearlyPrice, formatPrice, dealAmountLabel, dealEndsLabel } from '@/lib/plans';
import styles from '@/styles/components/limitreachedpopup.module.scss';

const perMonth = (yearly) => formatPrice(Math.round(yearly / 12 * 100) / 100);

// The server resets the free week on Sunday at midnight (server time, UTC).
const resetLabel = (now = new Date()) => {
    const days = (7 - now.getUTCDay()) % 7 || 7;
    return days === 1 ? 'tomorrow' : 'on Sunday';
};

// Free accounts that used all 5 breakdowns this week. The one moment someone
// is already asking for more, so each option goes straight to Stripe Checkout
// instead of through the pricing page. Prices come from lib/plans and, when a
// deal or trial-end offer is running, from /api/pricing/offer.
const WeeklyLimitPopup = ({ onClose }) => {
    const [deal, setDeal] = useState(null);
    const [busy, setBusy] = useState(null);

    useEffect(() => {
        track('limit_hit', { type: 'sentence-analyses' });
        let cancelled = false;
        fetch('/api/pricing/offer', { credentials: 'include' })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => { if (!cancelled && data?.deal?.eligible) setDeal(data.deal); })
            .catch(() => {});
        return () => { cancelled = true; };
    }, []);

    const buy = async (option, priceId) => {
        if (busy) return;
        setBusy(option);
        track('limit_upgrade_click', { type: 'sentence-analyses', option });
        const ok = await startCheckout(priceId, { from: 'weekly_limit' });
        if (!ok) window.location.href = '/pricing';
    };

    const basic = deal ? dealYearlyPrice('basic', deal) : PLAN_PRICES.basic.yearly;
    const plus = deal ? dealYearlyPrice('plus', deal) : PLAN_PRICES.plus.yearly;
    const ends = dealEndsLabel(deal);

    const options = [
        {
            key: 'basic_yearly',
            priceId: PRICE_IDS.BASIC_SUBSCRIPTION_YEARLY,
            title: 'Basic',
            price: <>{deal && <s>{formatPrice(PLAN_PRICES.basic.yearly)}</s>} {formatPrice(basic)} a year</>,
            note: `Unlimited breakdowns. That's ${perMonth(basic)} a month.`,
        },
        {
            key: 'plus_yearly',
            priceId: PRICE_IDS.PLUS_SUBSCRIPTION_YEARLY,
            title: 'Plus',
            price: <>{deal && <s>{formatPrice(PLAN_PRICES.plus.yearly)}</s>} {formatPrice(plus)} a year</>,
            note: 'Everything: audio, practice, the full sentence layers and 120 Speak minutes a month.',
            featured: true,
        },
        {
            key: 'more_sentences',
            priceId: PRICE_IDS.MORE_SENTENCES,
            title: 'Not ready for a plan?',
            price: <>$1 once</>,
            note: '100 extra breakdowns, no subscription.',
        },
    ];

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div
                className={`${styles.popup} ${styles.wide}`}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="limit-popup-title"
            >
                <button className={styles.closeButton} onClick={onClose} aria-label="Close">×</button>
                <div className={styles.art}>
                    <Mascot pose="think" size={96} />
                </div>
                <h2 id="limit-popup-title">You've used this week's 5 free breakdowns</h2>
                <p className={styles.subText}>
                    They come back {resetLabel()}. Want to keep going now?
                    {deal && <> <strong className={styles.dealLine}>{dealAmountLabel(deal)} yearly plans{ends ? `, ${ends.replace(/^Ends/, 'ends')}` : ''}.</strong></>}
                </p>
                <div className={styles.options}>
                    {options.map((o) => (
                        <button
                            key={o.key}
                            type="button"
                            className={`${styles.option} ${o.featured ? styles.optionFeatured : ''}`}
                            onClick={() => buy(o.key, o.priceId)}
                            disabled={!!busy}
                        >
                            <span className={styles.optionHead}>
                                <b>{o.title}</b>
                                <span>{busy === o.key ? 'Opening checkout…' : o.price}</span>
                            </span>
                            <span className={styles.optionNote}>{o.note}</span>
                        </button>
                    ))}
                </div>
                <p className={styles.fine}>
                    Cancel anytime. 30-day money-back guarantee.{' '}
                    <Link href="/pricing" onClick={() => { track('limit_upgrade_click', { type: 'sentence-analyses', option: 'pricing' }); onClose(); }}>
                        Compare plans
                    </Link>
                </p>
                <button type="button" className={styles.cancelButton} onClick={onClose}>
                    I'll wait
                </button>
            </div>
        </div>
    );
};

export default WeeklyLimitPopup;

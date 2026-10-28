'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { track } from '@/lib/analytics';
import { PLAN_PRICES, dealYearlyPrice, formatPrice, dealAmountLabel } from '@/lib/plans';
import styles from '@/styles/components/trialbanner.module.scss';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const DISMISS_KEY = 'hanbokTrialBannerHidden';
// How long after a trial ends we still check for the trial-end offer.
const OFFER_LOOKUP_DAYS = 14;
// Matches the server's carry-over rule (utils/autoTrial): with 2+ days left,
// a plan bought now starts billing when the trial ends.
const CARRY_OVER_MS = 49 * HOUR;
const HIDDEN_ON = /^\/(admin|pricing|success|login)(\/|$)/;

const perMonth = (yearly) => formatPrice(Math.round(yearly / 12 * 100) / 100);

// "3 days left", "1 day left", "ends today"
const timeLeft = (endsAt, now) => {
    const ms = new Date(endsAt).getTime() - now;
    if (ms < DAY) return ms < 2 * HOUR ? 'ends within the hour' : `ends in ${Math.ceil(ms / HOUR)} hours`;
    const days = Math.ceil(ms / DAY);
    return `${days} day${days === 1 ? '' : 's'} left`;
};

// Dismissing hides the strip until tomorrow, so it's never nagging but the
// countdown still shows up every day of the trial.
const dismissedToday = () => {
    try {
        return localStorage.getItem(DISMISS_KEY) === new Date().toDateString();
    } catch {
        return false;
    }
};

// Slim strip across the top of every page for no-card trial users ("Plus
// trial: 3 days left") and, after the trial ends, for anyone whose personal
// trial-end offer is still running. Without it the trial is invisible.
const TrialBanner = () => {
    const { user } = useAuth();
    const pathname = usePathname() || '';
    const [offer, setOffer] = useState(null);
    const [hidden, setHidden] = useState(true);
    const [now, setNow] = useState(() => Date.now());

    const onTrial = !!user?.plusTrialEndsAt;
    const endedAt = user?.plusTrialEndedAt ? new Date(user.plusTrialEndedAt).getTime() : 0;
    const recentlyEnded = !onTrial && endedAt && Date.now() - endedAt < OFFER_LOOKUP_DAYS * DAY;

    useEffect(() => {
        setHidden(dismissedToday());
        const timer = setInterval(() => setNow(Date.now()), 60 * 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        setOffer(null);
        if (!recentlyEnded) return;
        let cancelled = false;
        fetch('/api/pricing/offer', { credentials: 'include' })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (!cancelled && data?.deal?.eligible && data.deal.kind === 'trialEnd') setOffer(data.deal);
            })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [user?.userId, recentlyEnded]);

    const offerLive = offer && new Date(offer.endsAt).getTime() > now;
    const show = !hidden && !HIDDEN_ON.test(pathname) && (onTrial || offerLive);

    useEffect(() => {
        if (show) track('trial_banner_view', { kind: onTrial ? 'trial' : 'offer' });
    }, [show, onTrial]);

    if (!show) return null;

    const dismiss = () => {
        try { localStorage.setItem(DISMISS_KEY, new Date().toDateString()); } catch {}
        setHidden(true);
        track('trial_banner_dismiss', { kind: onTrial ? 'trial' : 'offer' });
    };

    const kind = onTrial ? 'trial' : 'offer';
    const message = onTrial
        ? <>You're on <strong>Hanbok Plus free</strong>: {timeLeft(user.plusTrialEndsAt, now)}. Keep it from {perMonth(PLAN_PRICES.plus.yearly)} a month{
            new Date(user.plusTrialEndsAt).getTime() - now >= CARRY_OVER_MS ? ', and pay nothing until the trial ends' : ''}.</>
        : <>Your trial-end offer: <strong>{dealAmountLabel(offer)} yearly plans</strong>, Plus for {formatPrice(dealYearlyPrice('plus', offer))}. Offer {timeLeft(offer.endsAt, now)}.</>;

    return (
        <div className={`${styles.banner} ${onTrial ? styles.trial : styles.offer}`} role="status">
            <p className={styles.text}>{message}</p>
            <Link
                href="/pricing"
                className={styles.cta}
                onClick={() => track('trial_banner_click', { kind })}
            >
                {onTrial ? 'Keep Plus' : 'Get the offer'}
            </Link>
            <button type="button" className={styles.close} onClick={dismiss} aria-label="Hide until tomorrow">×</button>
        </div>
    );
};

export default TrialBanner;

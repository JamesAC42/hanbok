'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { track } from '@/lib/analytics';
import { CHROME_EXTENSION_URL, isDesktopChrome } from '@/lib/extension';
import {
    INTERSTITIAL_PAGES, canShowInterstitial, lastShown, noteInterstitialShown, noteVisit, skipThisSession,
} from '@/lib/interstitials';
import PlansInterstitial from './PlansInterstitial';
import ExtensionInterstitial from './ExtensionInterstitial';

const DAY = 24 * 60 * 60 * 1000;
const DELAY_MS = 6000;
// The plain plans pitch (no deal running) comes back at most this often.
const PLANS_EVERY_DAYS = 7;
// A new id shows the extension announcement once more.
const EXTENSION_ID = 'extension-2026-10';

// Paying = a real subscription, not the no-card trial.
const isPayingUser = (user) => !!user && user.tier > 0 && !user.plusTrialEndsAt;

const dealId = (deal) => `deal:${deal.percentOff || deal.amountOff}:${deal.endsAt || 'open'}`;

// Someone is in the middle of something on this page: another popup is open,
// they're typing, or a breakdown is about to run.
const busy = () => {
    if (document.querySelector('[aria-modal="true"]')) return 'popup';
    // The analyze box is focused on load, so only count it once there's text in it.
    const active = document.activeElement;
    if (active?.isContentEditable && active.textContent.trim()) return 'typing';
    if ([...document.querySelectorAll('textarea, input[type="text"], input:not([type])')].some(el => el.value.trim())) return 'typing';
    try {
        if (sessionStorage.getItem('pendingAnalysisRun')) return 'analysis';
    } catch {}
    if (new URLSearchParams(window.location.search).get('text')) return 'analysis';
    return null;
};

const loadOffer = async () => {
    try {
        const res = await fetch('/api/pricing/offer', { credentials: 'include' });
        return res.ok ? await res.json() : null;
    } catch {
        return null;
    }
};

// Picks at most one popup for this page load, highest priority first:
// 1. a running yearly deal, once per deal (free and signed-out only)
// 2. one-time announcements (the Chrome extension, for desktop Chrome without it)
// 3. the plans pitch, every PLANS_EVERY_DAYS (free and signed-out only)
// lib/interstitials.js keeps the shared budget across all of them.
const pickInterstitial = async (user) => {
    const paying = isPayingUser(user);
    const offer = paying ? null : await loadOffer();
    const deal = offer?.deal?.eligible ? offer.deal : null;

    if (deal && !lastShown(dealId(deal))) {
        return { id: dealId(deal), kind: 'plans', deal, trial: null };
    }
    const hasExtension = !!document.documentElement.dataset.hanbokExtension;
    if (CHROME_EXTENSION_URL && isDesktopChrome() && !hasExtension && !lastShown(EXTENSION_ID)) {
        return { id: EXTENSION_ID, kind: 'extension' };
    }
    if (!paying && offer && Date.now() - lastShown('plans') > PLANS_EVERY_DAYS * DAY) {
        const trial = offer.trial?.eligible && offer.trial.days > 0 ? offer.trial : null;
        return { id: 'plans', kind: 'plans', deal, trial };
    }
    return null;
};

const Interstitials = () => {
    const { user, loading } = useAuth();
    const pathname = usePathname();
    const [current, setCurrent] = useState(null);

    useEffect(() => {
        noteVisit();
    }, []);

    useEffect(() => {
        if (loading || current) return;
        if (!INTERSTITIAL_PAGES.test(pathname || '')) return;
        if (!canShowInterstitial()) return;

        let cancelled = false;
        const timer = setTimeout(async () => {
            if (busy() === 'popup') {
                skipThisSession();
                return;
            }
            if (busy()) return;
            const picked = await pickInterstitial(user);
            // Re-check: they may have started something while the offer loaded.
            if (cancelled || !picked || busy() || !canShowInterstitial()) return;
            noteInterstitialShown(picked.id);
            if (picked.kind === 'plans' && picked.deal) noteInterstitialShown('plans');
            track('interstitial_view', { id: picked.id, loggedIn: !!user });
            setCurrent(picked);
        }, DELAY_MS);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [loading, user?.userId, pathname, current]);

    if (!current) return null;
    const close = () => setCurrent(null);
    const onAction = (action) => track('interstitial_click', { id: current.id, action });

    if (current.kind === 'extension') {
        return <ExtensionInterstitial onClose={close} onAction={onAction} />;
    }
    return (
        <PlansInterstitial
            deal={current.deal}
            trial={current.trial}
            signedIn={!!user}
            onClose={close}
            onAction={onAction}
        />
    );
};

export default Interstitials;

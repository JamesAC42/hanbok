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
import SpeakInterstitial from './SpeakInterstitial';
import AppSurveyCard from './AppSurveyCard';

const DAY = 24 * 60 * 60 * 1000;
const DELAY_MS = 6000;
// The plain plans pitch (no deal running) comes back at most this often.
const PLANS_EVERY_DAYS = 7;
// A new id shows the extension announcement once more.
const EXTENSION_ID = 'extension-2026-10';
// The Speak announcement. Matches the id the old one-off popup stored in
// seenAnnouncements, so people who saw that one don't see this one.
const SPEAK_ID = '2026-10-speak';
// "Would you use a phone app?" card, once per browser. A new id asks again.
const APP_SURVEY_ID = 'app-survey-2026-10';

// Signed-in learners who haven't seen the Speak announcement or opened Speak.
const wantsSpeakAnnouncement = (user) => {
    if (!user || lastShown(SPEAK_ID)) return false;
    try {
        if (JSON.parse(localStorage.getItem('seenAnnouncements') || '{}')[SPEAK_ID]) return false;
        if (localStorage.getItem('speakVisited')) return false;
    } catch {}
    return true;
};

// Paying = a real subscription, not the no-card trial.
const isPayingUser = (user) => !!user && user.tier > 0 && !user.plusTrialEndsAt;

// Trial users whose no-card Plus trial ended in the last week: one popup that
// says so (with their trial-end offer if it's running). Unlike the others it
// skips the gap between popups, since it only makes sense right after the end.
const TRIAL_ENDED_WINDOW_DAYS = 7;
const trialEndedId = (user) => `trial-ended:${user.plusTrialEndedAt}`;
const wantsTrialEnded = (user) => {
    if (!user?.plusTrialEndedAt || user.tier > 0) return false;
    if (Date.now() - new Date(user.plusTrialEndedAt).getTime() > TRIAL_ENDED_WINDOW_DAYS * DAY) return false;
    return !lastShown(trialEndedId(user));
};

const dealId = (deal) => `deal:${deal.percentOff || deal.amountOff}:${deal.endsAt || 'open'}`;

// Someone is in the middle of something on this page: another popup is open,
// they're typing, or a breakdown is about to run.
const busy = () => {
    // Full-screen popups, and corner cards like "How did you find Hanbok?".
    if (document.querySelector('[aria-modal="true"], [data-corner-card]')) return 'popup';
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
// 0. "Your Plus trial ended", once, just after a no-card trial ends
// 1. a running yearly deal, once per deal (free and signed-out only)
// 2. one-time announcements: Speak (signed-in learners who haven't tried it),
//    then the Chrome extension (desktop Chrome without it)
// 3. the "would you use a phone app?" corner card, once (everyone)
// 4. the plans pitch, every PLANS_EVERY_DAYS (free and signed-out only)
// lib/interstitials.js keeps the shared budget across all of them.
const pickInterstitial = async (user) => {
    const paying = isPayingUser(user);
    const offer = paying ? null : await loadOffer();
    const deal = offer?.deal?.eligible ? offer.deal : null;

    if (wantsTrialEnded(user)) {
        return { id: trialEndedId(user), kind: 'plans', deal, trial: null, trialEnded: true };
    }
    if (deal && !lastShown(dealId(deal))) {
        return { id: dealId(deal), kind: 'plans', deal, trial: null };
    }
    if (wantsSpeakAnnouncement(user)) {
        return { id: SPEAK_ID, kind: 'speak' };
    }
    const hasExtension = !!document.documentElement.dataset.hanbokExtension;
    if (CHROME_EXTENSION_URL && isDesktopChrome() && !hasExtension && !lastShown(EXTENSION_ID)) {
        return { id: EXTENSION_ID, kind: 'extension' };
    }
    if (!lastShown(APP_SURVEY_ID)) {
        return { id: APP_SURVEY_ID, kind: 'appSurvey' };
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
        const allowed = () => wantsTrialEnded(user) || canShowInterstitial();
        if (!allowed()) return;

        let cancelled = false;
        const timer = setTimeout(async () => {
            if (busy() === 'popup') {
                skipThisSession();
                return;
            }
            if (busy()) return;
            const picked = await pickInterstitial(user);
            // Re-check: they may have started something while the offer loaded.
            if (cancelled || !picked || busy() || !(picked.trialEnded || canShowInterstitial())) return;
            noteInterstitialShown(picked.id);
            if (picked.kind === 'plans' && picked.deal) noteInterstitialShown('plans');
            if (picked.trialEnded && picked.deal) noteInterstitialShown(dealId(picked.deal));
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

    if (current.kind === 'speak') {
        return <SpeakInterstitial onClose={close} onAction={onAction} free={!isPayingUser(user)} />;
    }
    if (current.kind === 'appSurvey') {
        return <AppSurveyCard onClose={close} />;
    }
    if (current.kind === 'extension') {
        return <ExtensionInterstitial onClose={close} onAction={onAction} />;
    }
    return (
        <PlansInterstitial
            deal={current.deal}
            trial={current.trial}
            trialEnded={!!current.trialEnded}
            signedIn={!!user}
            onClose={close}
            onAction={onAction}
        />
    );
};

export default Interstitials;

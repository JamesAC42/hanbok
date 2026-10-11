// One budget for the full-screen popups that open on their own (the plans and
// deal popup, feature announcements). Rules:
// - never on someone's first visit
// - at most one per browser session
// - at least GAP_DAYS between any two
// - only on pages where nothing is in progress (see INTERSTITIAL_PAGES)
// Popups a person triggers themselves (limit reached, sign in) don't count.
// A new announcement should register as a candidate in
// components/interstitials/Interstitials.jsx rather than open its own popup.

const STATE_KEY = 'hanbokInterstitials';
const SESSION_KEY = 'hanbokInterstitialSession';
export const GAP_DAYS = 3;
const DAY = 24 * 60 * 60 * 1000;

// Pages where a popup can open. Reading pages (learn, lyrics, phrases) are
// left alone because search visitors land there and Google penalizes
// interstitials over content; flows like review, speak and the tutor are left
// alone because they'd interrupt something.
export const INTERSTITIAL_PAGES = /^\/(home|analyze|library|history|bookmarks|saves|my-grammar|hangeul)\/?$/;

const read = () => {
    try {
        return JSON.parse(localStorage.getItem(STATE_KEY) || '{}') || {};
    } catch {
        return {};
    }
};

const write = (state) => {
    try {
        localStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch {}
};

const sessionGet = () => {
    try {
        return sessionStorage.getItem(SESSION_KEY);
    } catch {
        return 'unavailable';
    }
};

const sessionSet = (value) => {
    try {
        sessionStorage.setItem(SESSION_KEY, value);
    } catch {}
};

// Count browser sessions so we can tell a first visit from a return. Call once
// per page load; it only counts the first call in each session.
export const noteVisit = () => {
    if (typeof window === 'undefined' || sessionGet()) return;
    const state = read();
    if (state.visits === undefined) {
        // People who were here before this budget existed aren't new.
        try {
            if (localStorage.getItem('lastSubscriptionPromptTimestamp') || localStorage.getItem('promoAttemptCount')) state.visits = 1;
        } catch {}
    }
    state.visits = (state.visits || 0) + 1;
    write(state);
    sessionSet('visited');
};

// Whether any popup may open right now, ignoring which one.
export const canShowInterstitial = (now = Date.now()) => {
    if (typeof window === 'undefined') return false;
    if (sessionGet() === 'shown') return false;
    const state = read();
    if ((state.visits || 0) < 2) return false;
    if (state.lastShownAt && now - state.lastShownAt < GAP_DAYS * DAY) return false;
    return true;
};

// When an id was last shown (ms), or 0.
export const lastShown = (id) => read().seen?.[id] || 0;

export const noteInterstitialShown = (id, now = Date.now()) => {
    const state = read();
    state.lastShownAt = now;
    state.seen = { ...(state.seen || {}), [id]: now };
    write(state);
    sessionSet('shown');
};

// Something else is already on screen (another popup), so stand down for this
// session without starting the gap.
export const skipThisSession = () => sessionSet('shown');

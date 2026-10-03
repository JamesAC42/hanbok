// Thin wrapper around Umami custom events plus first-touch attribution capture.
// Every call is a no-op when Umami hasn't loaded (ad blockers, local dev).

const ATTRIBUTION_KEY = 'hanbokAttribution';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

export const track = (event, data) => {
    try {
        if (typeof window !== 'undefined' && window.umami?.track) {
            window.umami.track(event, data);
        }
    } catch (e) {
        // Analytics must never break the app
    }
};

// Stores the first UTM/referrer we see so it can be attached to the account at signup.
export const captureAttribution = () => {
    if (typeof window === 'undefined') return;
    try {
        if (localStorage.getItem(ATTRIBUTION_KEY)) return;
        const params = new URLSearchParams(window.location.search);
        const attribution = {};
        UTM_KEYS.forEach((key) => {
            const value = params.get(key);
            if (value) attribution[key] = value;
        });
        const referrer = document.referrer;
        if (referrer && !referrer.startsWith(window.location.origin)) {
            attribution.referrer = referrer;
        }
        attribution.landingPath = window.location.pathname;
        attribution.firstSeen = new Date().toISOString();
        localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
    } catch (e) {
        // localStorage can be unavailable (private mode); attribution is best-effort
    }
};

export const getAttribution = () => {
    if (typeof window === 'undefined') return null;
    try {
        const stored = localStorage.getItem(ATTRIBUTION_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch (e) {
        return null;
    }
};

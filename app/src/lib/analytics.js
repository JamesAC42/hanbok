// Thin wrapper around Umami custom events plus first-touch attribution capture.
// Every call is a no-op when Umami hasn't loaded (ad blockers, local dev).

const ATTRIBUTION_KEY = 'hanbokAttribution';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

// Umami loads with `defer`, so events fired on first render (e.g. pricing_view)
// would be lost. Queue them until the tracker appears, for up to 15 seconds.
const pending = [];
let flushTimer = null;

const umamiReady = () => typeof window !== 'undefined' && window.umami?.track;

const flush = () => {
    if (umamiReady()) {
        while (pending.length) {
            const [method, args] = pending.shift();
            try { window.umami[method]?.(...args); } catch (e) { /* never break the app */ }
        }
    }
    if (!pending.length || Date.now() - pending[0][2] > 15000) {
        pending.length = 0;
        clearInterval(flushTimer);
        flushTimer = null;
    }
};

const send = (method, args) => {
    if (typeof window === 'undefined') return;
    try {
        if (umamiReady() && !pending.length) {
            window.umami[method]?.(...args);
            return;
        }
        pending.push([method, args, Date.now()]);
        if (!flushTimer) flushTimer = setInterval(flush, 500);
    } catch (e) {
        // Analytics must never break the app
    }
};

export const track = (event, data) => send('track', data ? [event, data] : [event]);

// Tags the visitor's Umami session with their plan, so traffic can be split by
// signed-in and paying learners. Never sends names or emails.
const PLANS = ['Free', 'Basic', 'Plus'];
let identified = null;
export const identifyUser = (user) => {
    if (!user) return;
    const plan = PLANS[user.tier] || 'Free';
    if (identified === plan) return;
    identified = plan;
    send('identify', [{ plan, signedIn: true }]);
};

// Stores the first UTM/referrer we see so it can be attached to the account at signup.
export const captureAttribution = () => {
    if (typeof window === 'undefined') return;
    try {
        const params = new URLSearchParams(window.location.search);
        const stored = localStorage.getItem(ATTRIBUTION_KEY);
        if (stored) {
            // A creator's ?ref= link still counts for a visitor we've seen before,
            // as long as no other creator got there first.
            const ref = params.get('ref');
            const existing = JSON.parse(stored);
            if (ref && !existing.ref) {
                localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify({ ...existing, ref }));
            }
            return;
        }
        const attribution = {};
        UTM_KEYS.forEach((key) => {
            const value = params.get(key);
            if (value) attribution[key] = value;
        });
        if (params.get('ref')) attribution.ref = params.get('ref');
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

// Records the signup form's "How did you hear about us?" answer alongside the stored
// attribution, so it is sent with both email registration and Google sign-in.
export const setHeardFrom = (heardFrom) => {
    if (typeof window === 'undefined') return;
    try {
        const attribution = getAttribution() || {};
        if (heardFrom) attribution.heardFrom = heardFrom;
        else delete attribution.heardFrom;
        localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
    } catch (e) {
        // best-effort, same as captureAttribution
    }
};

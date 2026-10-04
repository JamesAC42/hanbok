// Sanitizes the first-touch attribution the client sends at signup so only
// known, short string fields are stored on the user document.
const ALLOWED_KEYS = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
    'referrer', 'landingPath', 'firstSeen'
];
const MAX_LENGTH = 200;
// Self-reported "How did you hear about us?" answer. Kept to a fixed list so it can be counted.
const HEARD_FROM_OPTIONS = [
    'tiktok', 'instagram', 'youtube', 'reddit', 'search', 'friend', 'discord', 'other'
];

const sanitizeAttribution = (raw) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const clean = {};
    for (const key of ALLOWED_KEYS) {
        const value = raw[key];
        if (typeof value === 'string' && value.trim()) {
            clean[key] = value.trim().slice(0, MAX_LENGTH);
        }
    }
    if (HEARD_FROM_OPTIONS.includes(raw.heardFrom)) {
        clean.heardFrom = raw.heardFrom;
    }
    return Object.keys(clean).length ? clean : null;
};

module.exports = { sanitizeAttribution, HEARD_FROM_OPTIONS };

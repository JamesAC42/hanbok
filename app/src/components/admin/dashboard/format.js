// Formatting and labels shared by the admin dashboard panels.

const numberFormat = new Intl.NumberFormat('en-US');
const compactFormat = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

export const fmt = (value) => (value === null || value === undefined ? '–' : numberFormat.format(Math.round(value)));
export const fmtCompact = (value) => (value >= 10000 ? compactFormat.format(value) : fmt(value));

export const fmtMoney = (cents, currency = 'usd', { exact = false } = {}) => {
    if (cents === null || cents === undefined) return '–';
    const amount = cents / 100;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
        maximumFractionDigits: exact || amount < 100 ? 2 : 0,
        minimumFractionDigits: exact || amount < 100 ? 2 : 0,
    }).format(amount);
};

export const pct = (part, whole, digits = 0) => {
    if (!whole) return '–';
    const value = (part / whole) * 100;
    if (value > 0 && value < 1 && digits === 0) return `${value.toFixed(1)}%`;
    return `${value.toFixed(digits)}%`;
};

// Change against the previous period, as { text, dir }.
export const delta = (value, prev) => {
    if (prev === null || prev === undefined) return null;
    if (!prev) return value ? { text: 'new', dir: 'up' } : null;
    const change = ((value - prev) / prev) * 100;
    if (Math.abs(change) < 0.5) return { text: 'same', dir: 'flat' };
    return { text: `${change > 0 ? '+' : ''}${Math.round(change)}%`, dir: change > 0 ? 'up' : 'down' };
};

export const fmtDate = (value, opts = { month: 'short', day: 'numeric' }) => {
    if (!value) return '–';
    const date = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
    return date.toLocaleDateString('en-US', opts);
};

export const fmtDateTime = (value) => (value ? new Date(value).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
}) : '–');

export const timeAgo = (value) => {
    if (!value) return '–';
    const seconds = Math.max(0, (Date.now() - new Date(value).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = seconds / 60;
    if (minutes < 60) return `${Math.floor(minutes)}m ago`;
    const hours = minutes / 60;
    if (hours < 24) return `${Math.floor(hours)}h ago`;
    const days = hours / 24;
    if (days < 30) return `${Math.floor(days)}d ago`;
    return fmtDate(value, { month: 'short', day: 'numeric', year: 'numeric' });
};

export const RANGES = [
    { days: 7, label: '7 days' },
    { days: 30, label: '30 days' },
    { days: 90, label: '90 days' },
    { days: 365, label: '1 year' },
];

export const TIERS = ['Free', 'Basic', 'Plus'];

export const SOURCE_LABELS = {
    tiktok: 'TikTok',
    instagram: 'Instagram',
    youtube: 'YouTube',
    reddit: 'Reddit',
    search: 'Search engine',
    friend: 'A friend',
    discord: 'Discord',
    other: 'Other',
};
export const sourceLabel = (key) => (key ? SOURCE_LABELS[key] || key : "Didn't say");

export const FUNNEL = {
    signedUp: { label: 'Signed up', color: 'var(--bp-gray)' },
    analyzed: { label: 'Analyzed a sentence', color: 'var(--bp-read)' },
    saved: { label: 'Saved a word or sentence', color: 'var(--bp-keep)' },
    reviewed: { label: 'Studied flashcards', color: 'var(--bp-rev)' },
    returned: { label: 'Came back another day', color: 'var(--bp-und)' },
    paid: { label: 'Upgraded to paid', color: 'var(--bp-purple)' },
};

export const STAGES = {
    read: { label: 'Read', color: 'var(--bp-read)' },
    understand: { label: 'Understand', color: 'var(--bp-und)' },
    keep: { label: 'Keep', color: 'var(--bp-keep)' },
    review: { label: 'Review', color: 'var(--bp-rev)' },
};

export const FEATURES = {
    analyze: { label: 'Sentence analysis', unit: 'sentences' },
    paragraphs: { label: 'Paragraph analysis', unit: 'paragraphs' },
    tutor: { label: 'Tutor chats', unit: 'chats' },
    savedSentences: { label: 'Saved sentences', unit: 'saved' },
    words: { label: 'Saved words', unit: 'saved' },
    flashcards: { label: 'Flashcards made', unit: 'cards' },
    reviews: { label: 'Flashcard reviews', unit: 'reviews' },
};

let languageNames;
export const languageLabel = (code) => {
    if (!code || code === 'unknown') return 'Unknown';
    try {
        languageNames = languageNames || new Intl.DisplayNames(['en'], { type: 'language' });
        return languageNames.of(code) || code;
    } catch {
        return code;
    }
};

// Umami custom events, in the order a visitor meets them.
export const EVENTS = {
    analyze: 'Analyzed a sentence',
    analyze_error: 'Analysis failed',
    limit_hit: 'Hit a free limit',
    limit_upgrade_click: 'Clicked upgrade on a limit',
    word_save: 'Saved a word',
    sentence_save: 'Saved a sentence',
    paragraph_submit: 'Analyzed a paragraph',
    landing_try: 'Tried a sentence on the homepage',
    tutor_start: 'Started a tutor chat',
    review_done: 'Finished a review session',
    signup: 'Signed up',
    pricing_view: 'Opened pricing',
    checkout_start: 'Started checkout',
    purchase: 'Paid',
    feedback_sent: 'Sent feedback',
};
export const eventLabel = (key) => EVENTS[key] || key.replace(/_/g, ' ');

let regionNames;
export const countryLabel = (code) => {
    if (!code) return 'Unknown';
    try {
        regionNames = regionNames || new Intl.DisplayNames(['en'], { type: 'region' });
        return regionNames.of(code) || code;
    } catch {
        return code;
    }
};

export const fmtDuration = (seconds) => {
    if (!seconds || !Number.isFinite(seconds)) return '–';
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return m ? `${m}m ${String(s).padStart(2, '0')}s` : `${s}s`;
};

// What people do around Speak, for the admin Speak tab. Calls themselves live
// in speak_sessions; this log holds everything else: page views, buttons in a
// call, the tools after a call, and the announcements and upsells.

// type -> where it happens. Anything else sent to /api/speak/event is dropped.
const EVENT_TYPES = {
    // Finding Speak
    announcement_view: 'promo',
    announcement_click: 'promo',
    announcement_dismiss: 'promo',
    promo_view: 'promo',
    promo_click: 'promo', // meta.where: home_card, sidebar, analysis, limit, updates, ...
    picker_view: 'picker',
    scene_click: 'picker',
    signup_click: 'picker',
    // During a call
    call_connected: 'call',
    mic_denied: 'call',
    connect_failed: 'call',
    assist_change: 'call',
    help_tap: 'call',
    script_open: 'call',
    english_toggle: 'call',
    slower_tap: 'call',
    hang_up: 'call',
    // After a call
    results_view: 'after',
    breakdown: 'after',
    breakdown_locked: 'after',
    translations_toggle: 'after',
    line_translate: 'after',
    grammar_save: 'after',
    phrase_save: 'after',
    play_again: 'after',
    more_scenes: 'after',
    history_list_view: 'after',
    history_view: 'after',
    // Money
    upsell_click: 'money', // meta.where
    limit_hit: 'money',
    // Logged by the server
    start_failed: 'server',
};

const META_KEYS = ['where', 'scene', 'assist', 'from', 'reason', 'on', 'left'];

const cleanMeta = (meta) => {
    if (!meta || typeof meta !== 'object') return undefined;
    const out = {};
    for (const key of META_KEYS) {
        const v = meta[key];
        if (typeof v === 'string' && v) out[key] = v.slice(0, 40);
        else if (typeof v === 'number' && Number.isFinite(v)) out[key] = v;
        else if (typeof v === 'boolean') out[key] = v;
    }
    return Object.keys(out).length ? out : undefined;
};

const cleanEvent = ({ type, sessionId, meta, userId, tier, visitorId }) => {
    if (!Object.prototype.hasOwnProperty.call(EVENT_TYPES, type)) return null;
    const doc = { type, at: new Date(), userId: Number.isInteger(userId) ? userId : null };
    if (typeof sessionId === 'string' && /^[a-f0-9]{8,40}$/.test(sessionId)) doc.sessionId = sessionId;
    if (Number.isInteger(tier)) doc.tier = tier;
    if (!doc.userId && typeof visitorId === 'string' && /^[\w-]{6,64}$/.test(visitorId)) doc.visitorId = visitorId;
    const m = cleanMeta(meta);
    if (m) doc.meta = m;
    return doc;
};

const logSpeakEvent = async (db, event) => {
    const doc = cleanEvent(event);
    if (!doc) return false;
    try {
        await db.collection('speak_events').insertOne(doc);
        return true;
    } catch (e) {
        console.error('speak event', e.message);
        return false;
    }
};

module.exports = { EVENT_TYPES, cleanEvent, logSpeakEvent };

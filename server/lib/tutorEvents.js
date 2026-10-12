// What people do around the Tutor (chat with Horang), for the admin Tutor tab.
// Conversations and messages live in conversations / conversation_messages;
// this log holds everything else: page views, limits, failed replies and the
// feedback buttons.

// type -> where it happens. Anything else sent to /api/tutor/event is dropped.
const EVENT_TYPES = {
    // On the Tutor page
    page_view: 'page', // meta.from: sentence, direct
    new_chat: 'page',
    conversation_open: 'page',
    conversation_delete: 'page',
    language_change: 'page',
    view_analysis: 'page',
    // Logged by the server
    chat_start: 'server', // meta.from: sentence, open; meta.on: language
    reply_failed: 'server', // meta.reason
    // Limits
    limit_hit: 'limit', // meta.reason: monthly, per_sentence, messages, free_blank
    // Feedback
    message_up: 'feedback', // logged by the server
    message_down: 'feedback', // logged by the server, meta.reason = picked reasons
    survey_view: 'feedback',
    survey_rating: 'feedback', // logged by the server, meta.reason = the 1-5 score
    survey_dismiss: 'feedback', // logged by the server
};

const META_KEYS = ['where', 'from', 'reason', 'on'];

const cleanMeta = (meta) => {
    if (!meta || typeof meta !== 'object') return undefined;
    const out = {};
    for (const key of META_KEYS) {
        const v = meta[key];
        if (typeof v === 'string' && v) out[key] = v.slice(0, 60);
        else if (typeof v === 'number' && Number.isFinite(v)) out[key] = v;
        else if (typeof v === 'boolean') out[key] = v;
    }
    return Object.keys(out).length ? out : undefined;
};

const cleanEvent = ({ type, conversationId, messageId, meta, userId, tier }) => {
    if (!Object.prototype.hasOwnProperty.call(EVENT_TYPES, type)) return null;
    const doc = { type, at: new Date(), userId: Number.isInteger(userId) ? userId : null };
    const conv = Number(conversationId);
    if (Number.isInteger(conv) && conv > 0) doc.conversationId = conv;
    const msg = Number(messageId);
    if (Number.isInteger(msg) && msg > 0) doc.messageId = msg;
    if (Number.isInteger(tier)) doc.tier = tier;
    const m = cleanMeta(meta);
    if (m) doc.meta = m;
    return doc;
};

const logTutorEvent = async (db, event) => {
    const doc = cleanEvent(event);
    if (!doc) return false;
    try {
        await db.collection('tutor_events').insertOne(doc);
        return true;
    } catch (e) {
        console.error('tutor event', e.message);
        return false;
    }
};

module.exports = { EVENT_TYPES, cleanEvent, logTutorEvent };

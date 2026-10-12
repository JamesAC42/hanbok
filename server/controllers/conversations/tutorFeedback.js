// Feedback on the Tutor: 👍/👎 on each of Horang's replies, an occasional
// "How is Horang helping?" 1-5 rating per conversation, and the event log
// behind the admin Tutor tab.
const { getDb } = require('../../database');
const { logTutorEvent } = require('../../lib/tutorEvents');

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// Why a reply got a 👎. Anything else is dropped.
const DOWN_REASONS = ['wrong', 'confusing', 'not_answered', 'too_long', 'too_short', 'language', 'other'];

// The rating comes up once a conversation has this many replies from Horang:
// on the learner's first such conversation, then one in every TUTOR_RATING_EVERY.
const RATING_AFTER_REPLIES = 2;
const RATING_EVERY = Math.max(1, parseInt(process.env.TUTOR_RATING_EVERY, 10) || 3);

// Pure: should this conversation ask, given the learner's earlier ratable ones
// (newest first)?
const ratingDue = (conversation, replies, earlier) => {
    if (!conversation) return false;
    if (conversation.ratingAsked) return true;
    if (replies < RATING_AFTER_REPLIES) return false;
    if (RATING_EVERY === 1) return true;
    return !earlier.slice(0, RATING_EVERY - 1).some((c) => c.ratingAsked);
};

// Decides whether to ask for a rating after a reply, and remembers the answer.
const shouldAskRating = async (db, conversation) => {
    if (!conversation?.userId) return false;
    if (conversation.ratingAsked) return !conversation.feedback?.rating && !conversation.feedback?.dismissedAt;
    const replies = await db.collection('conversation_messages').countDocuments({ conversationId: conversation.conversationId, role: 'assistant' });
    if (replies < RATING_AFTER_REPLIES) return false;
    const earlier = await db.collection('conversations').find(
        { userId: conversation.userId, conversationId: { $ne: conversation.conversationId }, dateCreated: { $lt: conversation.dateCreated }, userMessageCount: { $gte: RATING_AFTER_REPLIES } },
        { projection: { ratingAsked: 1 }, sort: { dateCreated: -1 }, limit: RATING_EVERY - 1 },
    ).toArray();
    if (!ratingDue(conversation, replies, earlier)) return false;
    await db.collection('conversations').updateOne({ conversationId: conversation.conversationId }, { $set: { ratingAsked: true } });
    return true;
};

const tierOf = async (db, userId) => (await db.collection('users').findOne({ userId }, { projection: { tier: 1 } }))?.tier || 0;

const findOwn = (db, req) => db.collection('conversations').findOne(
    { conversationId: parseInt(req.params.conversationId, 10), userId: req.session.user.userId },
    { projection: { conversationId: 1, userId: 1, sentenceId: 1, targetLanguage: 1 } },
);

// POST /api/conversations/:conversationId/messages/:messageId/feedback
// { vote: 'up' | 'down' | null, reasons, note }. null takes the vote back.
const messageFeedback = async (req, res) => {
    try {
        const db = getDb();
        const conversation = await findOwn(db, req);
        if (!conversation) return res.status(404).json({ success: false, error: 'Not found' });
        const messageId = parseInt(req.params.messageId, 10);
        const vote = ['up', 'down'].includes(req.body?.vote) ? req.body.vote : null;
        if (vote === null && req.body?.vote !== null) return res.status(400).json({ success: false, error: 'Nothing to save' });
        const reasons = vote === 'down' ? [...new Set((Array.isArray(req.body?.reasons) ? req.body.reasons : []).filter((r) => DOWN_REASONS.includes(r)))] : [];
        const note = vote === 'down' ? str(req.body?.note, 1000) : '';
        const update = vote
            ? { $set: { feedback: { vote, reasons, note, at: new Date() } } }
            : { $unset: { feedback: '' } };
        const result = await db.collection('conversation_messages').updateOne(
            { conversationId: conversation.conversationId, messageId, role: 'assistant' },
            update,
        );
        if (!result.matchedCount) return res.status(404).json({ success: false, error: 'Not found' });
        const userId = req.session.user.userId;
        if (vote) {
            logTutorEvent(db, {
                type: vote === 'up' ? 'message_up' : 'message_down',
                conversationId: conversation.conversationId,
                messageId,
                userId,
                tier: await tierOf(db, userId),
                meta: reasons.length ? { reason: reasons.join(',') } : undefined,
            });
        }
        res.json({ success: true, feedback: vote ? { vote, reasons, note } : null });
    } catch (e) {
        console.error('tutor message feedback', e);
        res.status(500).json({ success: false, error: 'Could not save that' });
    }
};

// POST /api/conversations/:conversationId/feedback
// { rating, comment } for "How is Horang helping?", or { dismiss: true } for "Not now".
const conversationFeedback = async (req, res) => {
    try {
        const db = getDb();
        const conversation = await findOwn(db, req);
        if (!conversation) return res.status(404).json({ success: false, error: 'Not found' });
        const rating = Number.isInteger(req.body?.rating) && req.body.rating >= 1 && req.body.rating <= 5 ? req.body.rating : null;
        const comment = rating ? str(req.body?.comment, 1000) : '';
        const dismiss = !rating && req.body?.dismiss === true;
        if (!rating && !dismiss) return res.status(400).json({ success: false, error: 'Nothing to save' });
        await db.collection('conversations').updateOne({ conversationId: conversation.conversationId }, {
            $set: rating
                ? { 'feedback.rating': rating, 'feedback.ratedAt': new Date(), ...(comment ? { 'feedback.comment': comment } : {}) }
                : { 'feedback.dismissedAt': new Date() },
        });
        const userId = req.session.user.userId;
        logTutorEvent(db, {
            type: rating ? 'survey_rating' : 'survey_dismiss',
            conversationId: conversation.conversationId,
            userId,
            tier: await tierOf(db, userId),
            meta: rating ? { reason: String(rating) } : undefined,
        });
        res.json({ success: true });
    } catch (e) {
        console.error('tutor conversation feedback', e);
        res.status(500).json({ success: false, error: 'Could not save that' });
    }
};

// POST /api/tutor/event { type, conversationId, meta }. A few a minute per person.
const eventCounts = new Map();
const event = async (req, res) => {
    const userId = req.session.user.userId;
    const minute = Math.floor(Date.now() / 60000);
    const key = `${userId}:${minute}`;
    const n = (eventCounts.get(key) || 0) + 1;
    eventCounts.set(key, n);
    if (eventCounts.size > 5000) for (const k of eventCounts.keys()) if (!k.endsWith(`:${minute}`)) eventCounts.delete(k);
    if (n > 60) return res.status(429).json({ success: false });
    // Feedback and server events only come from the endpoints above or the server.
    const type = req.body?.type;
    if (!['page_view', 'new_chat', 'conversation_open', 'conversation_delete', 'language_change', 'view_analysis', 'limit_hit', 'survey_view'].includes(type)) {
        return res.status(400).json({ success: false });
    }
    const db = getDb();
    const ok = await logTutorEvent(db, {
        type, conversationId: req.body?.conversationId, meta: req.body?.meta, userId, tier: await tierOf(db, userId).catch(() => undefined),
    });
    res.status(ok ? 200 : 400).json({ success: ok });
};

module.exports = { tierOf, messageFeedback, conversationFeedback, event, shouldAskRating, ratingDue, DOWN_REASONS, RATING_AFTER_REPLIES };

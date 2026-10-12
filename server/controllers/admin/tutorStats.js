// The admin Tutor tab: who chats with Horang, how much, what they ask, whether
// the conversations go anywhere, and what people say about his answers.
// Conversations and messages come from conversations / conversation_messages,
// everything else from tutor_events.
const { getDb } = require('../../database');
const { createTtlCache } = require('../../lib/ttlCache');
const { EVENT_TYPES } = require('../../lib/tutorEvents');
const { TIER_LIMITS } = require('../../lib/tutorLimits');

const DAY = 24 * 60 * 60 * 1000;
const RANGE_DAYS = [7, 30, 90, 365];
// A conversation counts as a real back-and-forth once the learner has asked this many times.
const REAL_QUESTIONS = 3;

const parseDays = (value) => {
    const days = parseInt(value, 10);
    return RANGE_DAYS.includes(days) ? days : 30;
};

const parseTimeZone = (value) => {
    if (typeof value !== 'string' || !value || value.length > 64) return 'UTC';
    try {
        new Intl.DateTimeFormat('en-US', { timeZone: value });
        return value;
    } catch {
        return 'UTC';
    }
};

const dayFormat = (tz) => new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });

const listDays = (from, to, tz) => {
    const format = dayFormat(tz);
    const keys = new Set();
    for (let t = from.getTime(); t < to.getTime(); t += DAY / 2) keys.add(format.format(new Date(t)));
    keys.add(format.format(new Date(to.getTime() - 1)));
    return [...keys];
};

const rate = (part, whole) => (whole ? part / whole : null);
const avg = (list, f) => (list.length ? list.reduce((n, x) => n + f(x), 0) / list.length : null);
const percentile = (values, p) => {
    if (!values.length) return null;
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
};
const inRange = (date, from, to) => date && new Date(date) >= from && new Date(date) < to;
const capOf = (tier) => (TIER_LIMITS[tier] || TIER_LIMITS[0]).maxUserMessages;
const sourceOf = (c) => (c.sentenceId ? 'sentence' : 'open');
const PLANS = ['Free', 'Basic', 'Plus'];

const depthBucket = (n) => (n <= 1 ? '1' : n === 2 ? '2' : n <= 5 ? '3-5' : n <= 10 ? '6-10' : '11+');
const DEPTHS = ['1', '2', '3-5', '6-10', '11+'];

// Counts and people per event type, for one group of types.
const eventTable = (events, group) => {
    const rows = new Map();
    for (const e of events) {
        if (EVENT_TYPES[e.type] !== group) continue;
        if (!rows.has(e.type)) rows.set(e.type, { key: e.type, uses: 0, people: new Set() });
        const row = rows.get(e.type);
        row.uses += 1;
        row.people.add(e.userId ?? 'anon');
    }
    return [...rows.values()].map((r) => ({ key: r.key, uses: r.uses, people: r.people.size })).sort((a, b) => b.uses - a.uses);
};

const countByMeta = (events, type, field, split = false) => {
    const map = new Map();
    for (const e of events) {
        if (e.type !== type) continue;
        const keys = split ? String(e.meta?.[field] || 'none picked').split(',') : [e.meta?.[field] || 'other'];
        for (const key of keys) map.set(key, (map.get(key) || 0) + 1);
    }
    return [...map.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
};

// Everything the tab shows, from rows already loaded. Pure, so the tests can
// feed it rows directly.
// - conversations: active in the period (lastUpdated >= from), with userMessageCount etc.
// - messages: messages sent in the period (no content, except `content` on 👎 replies)
// - questionFor: Map(messageId of a reply -> the learner's question before it)
// - firstQuestions: Map(conversationId -> the learner's first message)
const summarizeTutor = ({
    conversations, messages, prevConversations = [], prevMessages = [], prevRatings = [], events, users = [],
    firstChatTier = new Map(), questionFor = new Map(), firstQuestions = new Map(), from, to, tz = 'UTC',
}) => {
    const fmtDay = dayFormat(tz);
    const convById = new Map(conversations.map((c) => [c.conversationId, c]));
    const userInfo = new Map(users.map((u) => [u.userId, u]));
    const tierNow = (userId) => userInfo.get(userId)?.tier || 0;
    const nameOf = (userId) => userInfo.get(userId)?.name || `User ${userId}`;

    const questions = messages.filter((m) => m.role === 'user');
    const replies = messages.filter((m) => m.role === 'assistant');
    const userOfMessage = (m) => convById.get(m.conversationId)?.userId;
    const chatters = new Set(questions.map(userOfMessage).filter((id) => id !== undefined && id !== null));

    const started = conversations.filter((c) => inRange(c.dateCreated, from, to));
    const prevById = new Map(prevConversations.map((c) => [c.conversationId, c]));
    const prevStarted = prevConversations.filter((c) => inRange(c.dateCreated, new Date(from.getTime() - (to - from)), from));
    const prevChatters = new Set(prevMessages.filter((m) => m.role === 'user').map((m) => prevById.get(m.conversationId)?.userId).filter((id) => id !== undefined && id !== null));
    const followUp = (list) => rate(list.filter((c) => (c.userMessageCount || 0) >= 2).length, list.length);

    // Days each person asked something, to find who came back.
    const daysByUser = new Map();
    for (const m of questions) {
        const userId = userOfMessage(m);
        if (userId === undefined || userId === null) continue;
        if (!daysByUser.has(userId)) daysByUser.set(userId, new Set());
        daysByUser.get(userId).add(fmtDay.format(new Date(m.timestamp)));
    }
    const returning = [...daysByUser.values()].filter((d) => d.size >= 2).length;

    // 👍/👎 on replies sent in the period.
    const voted = replies.filter((m) => m.feedback?.vote);
    const ups = voted.filter((m) => m.feedback.vote === 'up');
    const downs = voted.filter((m) => m.feedback.vote === 'down');

    const replyMs = replies.map((m) => m.replyMs).filter((n) => Number.isFinite(n));
    const firstChunk = replies.map((m) => m.firstChunkMs).filter((n) => Number.isFinite(n));
    const failures = events.filter((e) => e.type === 'reply_failed');

    const rated = conversations.filter((c) => c.feedback?.rating && inRange(c.feedback.ratedAt, from, to));
    const hitCap = (c) => (c.userMessageCount || 0) >= capOf(c.tier ?? tierNow(c.userId));

    const tiles = {
        chatters: { value: chatters.size, prev: prevChatters.size },
        conversations: { value: started.length, prev: prevStarted.length },
        questions: { value: questions.length, prev: prevMessages.filter((m) => m.role === 'user').length },
        followUpRate: { value: followUp(started), prev: followUp(prevStarted) },
        avgQuestions: avg(started, (c) => c.userMessageCount || 0),
        upRate: { value: rate(ups.length, voted.length), votes: voted.length },
        rating: { value: avg(rated, (c) => c.feedback.rating), prev: avg(prevRatings, (c) => c.feedback.rating), count: rated.length },
        replySeconds: { median: percentile(replyMs, 0.5) === null ? null : percentile(replyMs, 0.5) / 1000, p90: percentile(replyMs, 0.9) === null ? null : percentile(replyMs, 0.9) / 1000 },
        failures: failures.length,
        returning,
    };

    // The path from opening the Tutor to coming back, in people.
    const eventUsers = (types) => new Set(events.filter((e) => types.includes(e.type) && e.userId).map((e) => e.userId));
    const opened = eventUsers(['page_view']);
    for (const id of chatters) opened.add(id);
    const startedPeople = new Set(started.map((c) => c.userId));
    const repliedConvs = new Set(replies.map((m) => m.conversationId));
    const peopleWhere = (pred) => new Set(conversations.filter(pred).map((c) => c.userId));
    const feedbackPeople = new Set([
        ...voted.map(userOfMessage),
        ...rated.map((c) => c.userId),
    ].filter((id) => id !== undefined && id !== null));
    const funnel = [
        { key: 'opened', label: 'Opened the Tutor', people: opened.size },
        { key: 'started', label: 'Started a conversation', people: startedPeople.size },
        { key: 'replied', label: 'Got an answer from Horang', people: peopleWhere((c) => repliedConvs.has(c.conversationId)).size },
        { key: 'followup', label: 'Asked a follow-up', people: peopleWhere((c) => (c.userMessageCount || 0) >= 2 && repliedConvs.has(c.conversationId)).size },
        { key: 'real', label: `Kept going (${REAL_QUESTIONS}+ questions)`, people: peopleWhere((c) => (c.userMessageCount || 0) >= REAL_QUESTIONS && repliedConvs.has(c.conversationId)).size },
        { key: 'feedback', label: 'Rated an answer or the Tutor', people: feedbackPeople.size },
        { key: 'returned', label: 'Came back another day', people: returning },
    ];

    const days = listDays(from, to, tz);
    const byDay = new Map(days.map((d) => [d, { key: d, questions: 0, conversations: 0, chatters: new Set() }]));
    for (const m of questions) {
        const row = byDay.get(fmtDay.format(new Date(m.timestamp)));
        if (!row) continue;
        row.questions += 1;
        const userId = userOfMessage(m);
        if (userId !== undefined && userId !== null) row.chatters.add(userId);
    }
    for (const c of started) {
        const row = byDay.get(fmtDay.format(new Date(c.dateCreated)));
        if (row) row.conversations += 1;
    }
    const daily = [...byDay.values()].map((r) => ({ key: r.key, questions: r.questions, conversations: r.conversations, chatters: r.chatters.size }));

    // How far conversations started in the period went.
    const depthCounts = new Map(DEPTHS.map((d) => [d, 0]));
    for (const c of started) depthCounts.set(depthBucket(c.userMessageCount || 0), depthCounts.get(depthBucket(c.userMessageCount || 0)) + 1);
    const depth = DEPTHS.map((key) => ({ key, count: depthCounts.get(key) }));

    // Splits over conversations active in the period.
    const votesByConv = new Map();
    for (const m of voted) {
        if (!votesByConv.has(m.conversationId)) votesByConv.set(m.conversationId, { up: 0, down: 0 });
        votesByConv.get(m.conversationId)[m.feedback.vote] += 1;
    }
    const groupStats = (keyOf) => {
        const groups = new Map();
        for (const c of started) {
            const key = keyOf(c) ?? 'unknown';
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(c);
        }
        return [...groups.entries()].map(([key, list]) => {
            const v = list.reduce((acc, c) => {
                const x = votesByConv.get(c.conversationId);
                return x ? { up: acc.up + x.up, down: acc.down + x.down } : acc;
            }, { up: 0, down: 0 });
            const r = list.filter((c) => c.feedback?.rating);
            return {
                key: String(key),
                conversations: list.length,
                people: new Set(list.map((c) => c.userId)).size,
                followUpRate: followUp(list),
                avgQuestions: avg(list, (c) => c.userMessageCount || 0),
                upRate: rate(v.up, v.up + v.down),
                rating: avg(r, (c) => c.feedback.rating),
            };
        }).sort((a, b) => b.conversations - a.conversations);
    };

    // Money: who pays among chatters, who upgraded after chatting free, and limits.
    const paidChatters = [...chatters].filter((id) => tierNow(id) > 0).length;
    const upgraded = [...chatters].filter((id) => firstChatTier.get(id) === 0 && tierNow(id) > 0).length;
    const limitPeople = new Set(events.filter((e) => e.type === 'limit_hit' && e.userId).map((e) => e.userId)).size;

    // People, most questions first.
    const qByUser = new Map();
    for (const m of questions) {
        const userId = userOfMessage(m);
        if (userId === undefined || userId === null) continue;
        qByUser.set(userId, (qByUser.get(userId) || 0) + 1);
    }
    const topLearners = [...qByUser.entries()].map(([userId, count]) => {
        const own = conversations.filter((c) => c.userId === userId);
        const v = own.reduce((acc, c) => {
            const x = votesByConv.get(c.conversationId);
            return x ? { up: acc.up + x.up, down: acc.down + x.down } : acc;
        }, { up: 0, down: 0 });
        const u = userInfo.get(userId) || {};
        return {
            userId,
            name: u.name || `User ${userId}`,
            email: u.email || '',
            tier: u.tier || 0,
            conversations: own.length,
            questions: count,
            days: daysByUser.get(userId)?.size || 0,
            up: v.up,
            down: v.down,
            capped: own.filter(hitCap).length,
            last: own.reduce((a, c) => (new Date(c.lastUpdated) > new Date(a) ? c.lastUpdated : a), own[0]?.lastUpdated || null),
        };
    }).sort((a, b) => b.questions - a.questions).slice(0, 25);

    const convRow = (c) => {
        const v = votesByConv.get(c.conversationId) || { up: 0, down: 0 };
        return {
            conversationId: c.conversationId,
            userId: c.userId,
            name: nameOf(c.userId),
            tier: c.tier ?? tierNow(c.userId),
            question: firstQuestions.get(c.conversationId) || c.title || '',
            source: sourceOf(c),
            language: c.targetLanguage || null,
            started: c.dateCreated,
            lastUpdated: c.lastUpdated,
            questions: c.userMessageCount || 0,
            up: v.up,
            down: v.down,
            rating: c.feedback?.rating || null,
            capped: hitCap(c),
            deleted: !!c.isDeleted,
        };
    };
    const recent = [...conversations].sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated)).slice(0, 40).map(convRow);

    // 👎 answers, newest first, with the question that got them.
    const reasons = new Map();
    for (const m of downs) for (const r of (m.feedback.reasons?.length ? m.feedback.reasons : ['none picked'])) reasons.set(r, (reasons.get(r) || 0) + 1);
    const votes = {
        up: ups.length,
        down: downs.length,
        reasons: [...reasons.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count),
        list: [...downs].sort((a, b) => new Date(b.feedback.at || b.timestamp) - new Date(a.feedback.at || a.timestamp)).slice(0, 30).map((m) => ({
            conversationId: m.conversationId,
            messageId: m.messageId,
            userId: userOfMessage(m),
            name: nameOf(userOfMessage(m)),
            at: m.feedback.at || m.timestamp,
            reasons: m.feedback.reasons || [],
            note: m.feedback.note || '',
            question: questionFor.get(m.messageId) || '',
            answer: m.content || '',
        })),
    };

    const ratingGroups = (keyOf) => {
        const groups = new Map();
        for (const c of rated) {
            const key = keyOf(c) ?? 'unknown';
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(c.feedback.rating);
        }
        return [...groups.entries()].map(([key, list]) => ({ key: String(key), ratings: list.length, average: list.reduce((n, r) => n + r, 0) / list.length }))
            .sort((a, b) => b.ratings - a.ratings);
    };
    const ratings = {
        asked: conversations.filter((c) => c.ratingAsked).length,
        dismissed: conversations.filter((c) => c.feedback?.dismissedAt && !c.feedback?.rating).length,
        rated: rated.length,
        average: tiles.rating.value,
        prevAverage: tiles.rating.prev,
        scores: [5, 4, 3, 2, 1].map((score) => ({ score, count: rated.filter((c) => c.feedback.rating === score).length })),
        source: ratingGroups(sourceOf),
        plan: ratingGroups((c) => PLANS[c.tier ?? tierNow(c.userId)] || 'Free'),
        list: [...rated].sort((a, b) => new Date(b.feedback.ratedAt) - new Date(a.feedback.ratedAt)).slice(0, 40).map((c) => ({
            ...convRow(c),
            at: c.feedback.ratedAt,
            comment: c.feedback.comment || '',
        })),
    };

    return {
        tiles,
        funnel,
        daily,
        depth,
        capped: started.filter(hitCap).length,
        splits: {
            source: groupStats(sourceOf),
            language: groupStats((c) => c.targetLanguage || 'unknown'),
            plan: groupStats((c) => PLANS[c.tier ?? tierNow(c.userId)] || 'Free'),
        },
        page: eventTable(events, 'page'),
        pageFrom: countByMeta(events, 'page_view', 'from'),
        limits: {
            where: countByMeta(events, 'limit_hit', 'reason'),
            people: limitPeople,
        },
        money: { paidChatters, upgradedAfterChatting: upgraded },
        health: {
            failures: failures.length,
            failureReasons: countByMeta(events, 'reply_failed', 'reason'),
            replySeconds: tiles.replySeconds,
            firstWordsSeconds: percentile(firstChunk, 0.5) === null ? null : percentile(firstChunk, 0.5) / 1000,
            noReply: started.filter((c) => !repliedConvs.has(c.conversationId) && (c.messageCount || 0) <= 1).length,
            deleted: conversations.filter((c) => c.isDeleted).length,
        },
        topLearners,
        recent,
        votes,
        ratings,
    };
};

const CONV_PROJECTION = {
    _id: 0, conversationId: 1, userId: 1, title: 1, sentenceId: 1, dateCreated: 1, lastUpdated: 1, messageCount: 1,
    userMessageCount: 1, isDeleted: 1, targetLanguage: 1, tier: 1, feedback: 1, ratingAsked: 1,
};

const buildTutor = async (db, { days, tz }) => {
    const to = new Date();
    const from = new Date(to.getTime() - days * DAY);
    const prevFrom = new Date(from.getTime() - days * DAY);
    const convs = db.collection('conversations');
    const msgs = db.collection('conversation_messages');
    const messageProjection = {
        _id: 0, messageId: 1, conversationId: 1, role: 1, timestamp: 1, feedback: 1, replyMs: 1, firstChunkMs: 1,
        content: { $cond: [{ $eq: ['$feedback.vote', 'down'] }, { $substrCP: ['$content', 0, 1500] }, '$$REMOVE'] },
    };
    const [conversations, messages, prevConversations, prevMessages, events] = await Promise.all([
        convs.find({ lastUpdated: { $gte: from }, dateCreated: { $lt: to } }, { projection: CONV_PROJECTION }).limit(50000).toArray(),
        msgs.aggregate([{ $match: { timestamp: { $gte: from, $lt: to } } }, { $project: messageProjection }], { allowDiskUse: true }).toArray(),
        convs.find({ lastUpdated: { $gte: prevFrom }, dateCreated: { $lt: from } }, { projection: { _id: 0, conversationId: 1, userId: 1, dateCreated: 1, userMessageCount: 1, feedback: 1 } }).limit(50000).toArray(),
        msgs.find({ timestamp: { $gte: prevFrom, $lt: from }, role: 'user' }, { projection: { _id: 0, conversationId: 1, role: 1 } }).toArray(),
        db.collection('tutor_events').find({ at: { $gte: from, $lt: to } }, { projection: { _id: 0 } }).limit(200000).toArray(),
    ]);
    const prevRatings = prevConversations.filter((c) => c.feedback?.rating && inRange(c.feedback.ratedAt, prevFrom, from));

    const userIds = [...new Set(conversations.map((c) => c.userId).filter((id) => id !== null && id !== undefined))];
    // The learner's question before each 👎 reply, and the first question of recent conversations.
    const downs = messages.filter((m) => m.feedback?.vote === 'down');
    const recentIds = [...conversations].sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated)).slice(0, 40).map((c) => c.conversationId);
    const ratedIds = conversations.filter((c) => c.feedback?.rating).map((c) => c.conversationId);
    const firstIds = [...new Set([...recentIds, ...ratedIds])];
    const [users, firsts, downContext, firstRows] = await Promise.all([
        db.collection('users').find({ userId: { $in: userIds } }, { projection: { _id: 0, userId: 1, name: 1, email: 1, tier: 1 } }).toArray(),
        convs.aggregate([
            { $match: { userId: { $in: userIds }, tier: { $exists: true } } },
            { $sort: { dateCreated: 1 } },
            { $group: { _id: '$userId', tier: { $first: '$tier' } } },
        ]).toArray(),
        downs.length ? msgs.find(
            { conversationId: { $in: [...new Set(downs.map((m) => m.conversationId))] }, role: 'user' },
            { projection: { _id: 0, conversationId: 1, timestamp: 1, content: 1 } },
        ).sort({ timestamp: 1 }).limit(5000).toArray() : [],
        firstIds.length ? msgs.aggregate([
            { $match: { conversationId: { $in: firstIds }, role: 'user' } },
            { $sort: { timestamp: 1 } },
            { $group: { _id: '$conversationId', content: { $first: { $substrCP: ['$content', 0, 300] } } } },
        ]).toArray() : [],
    ]);
    const questionFor = new Map();
    for (const m of downs) {
        const before = downContext.filter((q) => q.conversationId === m.conversationId && new Date(q.timestamp) <= new Date(m.timestamp));
        if (before.length) questionFor.set(m.messageId, String(before[before.length - 1].content || '').slice(0, 600));
    }
    return summarizeTutor({
        conversations, messages, prevConversations, prevMessages, prevRatings, events, users,
        firstChatTier: new Map(firsts.map((r) => [r._id, r.tier || 0])),
        questionFor,
        firstQuestions: new Map(firstRows.map((r) => [r._id, r.content])),
        from, to, tz,
    });
};

// One conversation for the admin: every message with its 👍/👎, the rating, and what happened around it.
const buildTutorConversation = async (db, conversationId) => {
    const c = await db.collection('conversations').findOne({ conversationId }, { projection: { _id: 0 } });
    if (!c) return null;
    const [user, messages, events, sentence] = await Promise.all([
        c.userId ? db.collection('users').findOne({ userId: c.userId }, { projection: { _id: 0, userId: 1, name: 1, email: 1, tier: 1 } }) : null,
        db.collection('conversation_messages').find({ conversationId }, { projection: { _id: 0, messageId: 1, role: 1, content: 1, timestamp: 1, feedback: 1, replyMs: 1 } }).sort({ timestamp: 1 }).limit(500).toArray(),
        db.collection('tutor_events').find({ conversationId }, { projection: { _id: 0, type: 1, at: 1, meta: 1, messageId: 1 } }).sort({ at: 1 }).limit(200).toArray(),
        c.sentenceId ? db.collection('sentences').findOne({ sentenceId: c.sentenceId }, { projection: { _id: 0, text: 1, publicId: 1, 'analysis.translation': 1 } }) : null,
    ]);
    return {
        conversation: { ...c, capped: (c.userMessageCount || 0) >= capOf(c.tier ?? user?.tier ?? 0), sentence },
        user,
        messages,
        events,
    };
};

const cache = createTtlCache(5 * 60 * 1000);

const getTutorStats = async (req, res) => {
    try {
        const days = parseDays(req.query.days);
        const tz = parseTimeZone(req.query.tz);
        const { value, cachedAt } = await cache.get(`${days}:${tz}`, () => buildTutor(getDb(), { days, tz }), { fresh: req.query.fresh === '1' });
        res.json({ success: true, cachedAt: new Date(cachedAt), days, ...value });
    } catch (error) {
        console.error('Admin tutor stats failed:', error);
        res.status(500).json({ success: false, error: 'Failed to load Tutor stats' });
    }
};

const getTutorConversation = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ success: false, error: 'Invalid conversation id' });
        const detail = await buildTutorConversation(getDb(), id);
        if (!detail) return res.status(404).json({ success: false, error: 'Conversation not found' });
        res.json({ success: true, ...detail });
    } catch (error) {
        console.error('Admin tutor conversation failed:', error);
        res.status(500).json({ success: false, error: 'Failed to load conversation' });
    }
};

module.exports = { getTutorStats, getTutorConversation, summarizeTutor, buildTutor, REAL_QUESTIONS };

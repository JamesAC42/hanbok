// The admin Speak tab: who talks to Horang and Sora, how much, whether the
// calls are real conversations, what they do afterwards, and how people find
// Speak. Calls come from speak_sessions, everything else from speak_events.
const { getDb } = require('../../database');
const { createTtlCache } = require('../../lib/ttlCache');
const { EVENT_TYPES } = require('../../lib/speakEvents');
const { SCENARIOS, findScenario } = require('../../speak/scenarios');

const DAY = 24 * 60 * 60 * 1000;
const RANGE_DAYS = [7, 30, 90, 365];
// A call counts as a real conversation once the learner has said this many lines.
const REAL_LINES = 3;
// Rough cost per billed minute: GPT-Live plus the per-line coach, or the Realtime API.
const COST_PER_MIN = { live: 0.06, realtime: 0.1 };

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

// One call, flattened for counting.
const SESSION_PROJECTION = {
    _id: 0, sessionId: 1, userId: 1, scenarioId: 1, character: 1, level: 1, assist: 1, engine: 1, tier: 1,
    startedAt: 1, endedAt: 1, billedSeconds: 1, endReason: 1, fellBack: 1, goals: 1, goalsDone: 1,
    savedWordsUsed: 1, summary: 1,
    youLines: { $size: { $filter: { input: { $ifNull: ['$transcript', []] }, cond: { $eq: ['$$this.who', 'you'] } } } },
    charLines: { $size: { $filter: { input: { $ifNull: ['$transcript', []] }, cond: { $ne: ['$$this.who', 'you'] } } } },
    phrases: { $size: { $ifNull: ['$phrases', []] } },
    tips: { $size: { $ifNull: ['$tips', []] } },
    hasRecap: { $gt: ['$recap', null] },
    hasLineNotes: { $gt: ['$lineNotes', null] },
};

const callFacts = (s) => {
    const total = findScenario(s.scenarioId)?.goals.length || 0;
    const done = Array.isArray(s.goals) ? s.goals.filter(Boolean).length : s.goalsDone || 0;
    return {
        ...s,
        goalsTotal: total,
        goalsDoneCount: done,
        spoke: (s.youLines || 0) > 0,
        real: (s.youLines || 0) >= REAL_LINES,
        cleared: total > 0 && done >= total,
        seconds: s.billedSeconds || 0,
        open: !s.endedAt,
    };
};

const groupStats = (calls, keyOf) => {
    const groups = new Map();
    for (const c of calls) {
        const key = keyOf(c) ?? 'unknown';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(c);
    }
    return [...groups.entries()].map(([key, list]) => ({
        key: String(key),
        calls: list.length,
        people: new Set(list.map((c) => c.userId)).size,
        realRate: rate(list.filter((c) => c.real).length, list.length),
        clearRate: rate(list.filter((c) => c.cleared).length, list.length),
        avgYouLines: avg(list, (c) => c.youLines || 0),
        avgSeconds: avg(list, (c) => c.seconds),
    })).sort((a, b) => b.calls - a.calls);
};

// Counts and people per event type, for one group of types.
const eventTable = (events, group) => {
    const rows = new Map();
    for (const e of events) {
        if (EVENT_TYPES[e.type] !== group) continue;
        if (!rows.has(e.type)) rows.set(e.type, { key: e.type, uses: 0, people: new Set() });
        const row = rows.get(e.type);
        row.uses += 1;
        row.people.add(e.userId ?? `v:${e.visitorId || 'anon'}`);
    }
    return [...rows.values()].map((r) => ({ key: r.key, uses: r.uses, people: r.people.size })).sort((a, b) => b.uses - a.uses);
};

const countByMeta = (events, type, field) => {
    const map = new Map();
    for (const e of events) {
        if (e.type !== type) continue;
        const key = e.meta?.[field] || 'other';
        map.set(key, (map.get(key) || 0) + 1);
    }
    return [...map.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
};

const AFTER_TOOLS = ['breakdown', 'breakdown_locked', 'translations_toggle', 'line_translate', 'grammar_save', 'phrase_save', 'play_again', 'history_view'];

// Everything the tab shows, from calls and events already loaded. Pure, so the
// tests can feed it rows directly.
const summarizeSpeak = ({ calls: rawCalls, prevCalls: rawPrev = [], events, users = [], firstCallTier = new Map(), from, to, tz = 'UTC' }) => {
    const calls = rawCalls.map(callFacts);
    const prev = rawPrev.map(callFacts);
    const fmtDay = dayFormat(tz);
    const people = (list) => new Set(list.map((c) => c.userId));
    const speakers = people(calls.filter((c) => c.spoke));
    const minutes = (list) => list.reduce((n, c) => n + c.seconds, 0) / 60;

    // Days each person talked, to find who came back.
    const daysByUser = new Map();
    for (const c of calls.filter((x) => x.spoke)) {
        if (!daysByUser.has(c.userId)) daysByUser.set(c.userId, new Set());
        daysByUser.get(c.userId).add(fmtDay.format(new Date(c.startedAt)));
    }
    const returning = [...daysByUser.values()].filter((d) => d.size >= 2).length;

    const real = calls.filter((c) => c.real);
    const cost = calls.reduce((n, c) => n + (c.seconds / 60) * (COST_PER_MIN[c.engine] || COST_PER_MIN.live), 0);

    const tiles = {
        speakers: { value: speakers.size, prev: people(prev.filter((c) => c.spoke)).size },
        calls: { value: calls.length, prev: prev.length },
        minutes: { value: minutes(calls), prev: minutes(prev) },
        realRate: { value: rate(real.length, calls.length), prev: rate(prev.filter((c) => c.real).length, prev.length) },
        clearRate: { value: rate(calls.filter((c) => c.cleared).length, calls.length), prev: rate(prev.filter((c) => c.cleared).length, prev.length) },
        avgRealSeconds: avg(real, (c) => c.seconds),
        avgYouLines: avg(calls.filter((c) => c.spoke), (c) => c.youLines),
        returning,
        cost,
    };

    // The path from seeing Speak to coming back, in people.
    const eventUsers = (types) => new Set(events.filter((e) => types.includes(e.type) && e.userId).map((e) => e.userId));
    const sawPage = eventUsers(['picker_view']);
    for (const id of people(calls)) sawPage.add(id);
    const usedAfter = eventUsers(AFTER_TOOLS);
    const funnel = [
        { key: 'saw', label: 'Opened the Speak page', people: sawPage.size },
        { key: 'started', label: 'Started a call', people: people(calls).size },
        { key: 'heard', label: 'Heard the character', people: people(calls.filter((c) => c.charLines > 0)).size },
        { key: 'spoke', label: 'Said something', people: speakers.size },
        { key: 'real', label: `Had a real conversation (${REAL_LINES}+ lines)`, people: people(real).size },
        { key: 'cleared', label: 'Cleared a scene', people: people(calls.filter((c) => c.cleared)).size },
        { key: 'after', label: 'Used the notes or transcript after', people: [...usedAfter].filter((id) => speakers.has(id)).length },
        { key: 'returned', label: 'Came back another day', people: returning },
    ];
    const anonVisitors = new Set(events.filter((e) => e.type === 'picker_view' && !e.userId && e.visitorId).map((e) => e.visitorId)).size;

    const days = listDays(from, to, tz);
    const byDay = new Map(days.map((d) => [d, { key: d, calls: 0, minutes: 0, speakers: new Set() }]));
    for (const c of calls) {
        const row = byDay.get(fmtDay.format(new Date(c.startedAt)));
        if (!row) continue;
        row.calls += 1;
        row.minutes += c.seconds / 60;
        if (c.spoke) row.speakers.add(c.userId);
    }
    const daily = [...byDay.values()].map((r) => ({ key: r.key, calls: r.calls, minutes: Math.round(r.minutes * 10) / 10, speakers: r.speakers.size }));

    const endReasons = new Map();
    for (const c of calls) {
        const reason = c.open ? 'still open' : (c.endReason || 'unknown').replace(/^dropped:.*/, 'dropped');
        endReasons.set(reason, (endReasons.get(reason) || 0) + 1);
    }

    const scenes = groupStats(calls, (c) => c.scenarioId).map((row) => {
        const scene = findScenario(row.key);
        return { ...row, title: scene?.title || row.key, character: scene?.character || 'horang' };
    });
    const unplayed = SCENARIOS.filter((s) => !scenes.some((r) => r.key === s.id)).map((s) => s.title);

    // Money: who is paying among speakers, and who upgraded after talking free.
    const tierOf = new Map(users.map((u) => [u.userId, u.tier || 0]));
    const upgraded = [...speakers].filter((id) => firstCallTier.get(id) === 0 && (tierOf.get(id) || 0) > 0).length;
    const paidSpeakers = [...speakers].filter((id) => (tierOf.get(id) || 0) > 0).length;

    // People, most talking first.
    const byUser = new Map();
    for (const c of calls) {
        if (!byUser.has(c.userId)) byUser.set(c.userId, []);
        byUser.get(c.userId).push(c);
    }
    const userInfo = new Map(users.map((u) => [u.userId, u]));
    const toolsByUser = new Map();
    for (const e of events) {
        if (!e.userId || !AFTER_TOOLS.includes(e.type)) continue;
        toolsByUser.set(e.userId, (toolsByUser.get(e.userId) || 0) + 1);
    }
    const topSpeakers = [...byUser.entries()].map(([userId, list]) => {
        const u = userInfo.get(userId) || {};
        return {
            userId,
            name: u.name || `User ${userId}`,
            email: u.email || '',
            tier: u.tier || 0,
            calls: list.length,
            seconds: list.reduce((n, c) => n + c.seconds, 0),
            real: list.filter((c) => c.real).length,
            cleared: list.filter((c) => c.cleared).length,
            youLines: list.reduce((n, c) => n + (c.youLines || 0), 0),
            tools: toolsByUser.get(userId) || 0,
            days: daysByUser.get(userId)?.size || 0,
            lastCall: list.reduce((a, c) => (new Date(c.startedAt) > new Date(a) ? c.startedAt : a), list[0].startedAt),
        };
    }).sort((a, b) => b.seconds - a.seconds || b.calls - a.calls).slice(0, 25);

    const toolsBySession = new Map();
    for (const e of events) {
        if (!e.sessionId || !AFTER_TOOLS.includes(e.type)) continue;
        toolsBySession.set(e.sessionId, (toolsBySession.get(e.sessionId) || 0) + 1);
    }
    const recent = [...calls].sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt)).slice(0, 40).map((c) => ({
        sessionId: c.sessionId,
        userId: c.userId,
        name: userInfo.get(c.userId)?.name || `User ${c.userId}`,
        tier: c.tier || 0,
        title: findScenario(c.scenarioId)?.title || c.scenarioId,
        character: c.character,
        level: c.level,
        assist: c.assist,
        engine: c.engine,
        fellBack: !!c.fellBack,
        startedAt: c.startedAt,
        seconds: c.seconds,
        youLines: c.youLines || 0,
        charLines: c.charLines || 0,
        goalsDone: c.goalsDoneCount,
        goalsTotal: c.goalsTotal,
        endReason: c.open ? 'still open' : c.endReason || 'unknown',
        tools: toolsBySession.get(c.sessionId) || 0,
        hasRecap: !!c.hasRecap,
    }));

    return {
        tiles,
        funnel,
        anonVisitors,
        daily,
        endReasons: [...endReasons.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count),
        scenes,
        unplayed,
        splits: {
            character: groupStats(calls, (c) => c.character),
            level: groupStats(calls, (c) => c.level),
            assist: groupStats(calls, (c) => c.assist),
            plan: groupStats(calls, (c) => ['Free', 'Basic', 'Plus'][c.tier || 0]),
            engine: groupStats(calls, (c) => (c.fellBack ? 'realtime (fallback)' : c.engine)),
        },
        inCall: eventTable(events, 'call'),
        after: eventTable(events, 'after'),
        afterCalls: {
            recapsMade: calls.filter((c) => c.hasRecap).length,
            transcriptsTranslated: calls.filter((c) => c.hasLineNotes).length,
            phrasesTaught: calls.reduce((n, c) => n + (c.phrases || 0), 0),
            tipsGiven: calls.reduce((n, c) => n + (c.tips || 0), 0),
            callsWithSavedWords: calls.filter((c) => (c.savedWordsUsed || 0) > 0).length,
        },
        promo: {
            events: eventTable(events, 'promo'),
            promoWhere: countByMeta(events, 'promo_click', 'where'),
            upsellWhere: countByMeta(events, 'upsell_click', 'where'),
            limitWhere: countByMeta(events, 'limit_hit', 'where'),
            picker: eventTable(events, 'picker'),
            pickerFrom: countByMeta(events, 'picker_view', 'from'),
        },
        money: {
            paidSpeakers,
            upgradedAfterSpeaking: upgraded,
            limitHitPeople: new Set(events.filter((e) => e.type === 'limit_hit' && e.userId).map((e) => e.userId)).size,
            upsellClicks: events.filter((e) => e.type === 'upsell_click').length,
        },
        health: {
            silentCalls: calls.filter((c) => !c.open && !c.spoke).length,
            neverHeard: calls.filter((c) => !c.open && c.charLines === 0).length,
            dropped: calls.filter((c) => /^dropped/.test(c.endReason || '')).length,
            fellBack: calls.filter((c) => c.fellBack).length,
            startFailed: countByMeta(events, 'start_failed', 'reason'),
            connectFailed: events.filter((e) => e.type === 'connect_failed').length,
            micDenied: events.filter((e) => e.type === 'mic_denied').length,
        },
        topSpeakers,
        recent,
    };
};

const buildSpeak = async (db, { days, tz }) => {
    const to = new Date();
    const from = new Date(to.getTime() - days * DAY);
    const prevFrom = new Date(from.getTime() - days * DAY);
    const sessions = db.collection('speak_sessions');
    const [calls, prevCalls, events] = await Promise.all([
        sessions.aggregate([{ $match: { startedAt: { $gte: from, $lt: to } } }, { $project: SESSION_PROJECTION }], { allowDiskUse: true }).toArray(),
        sessions.aggregate([
            { $match: { startedAt: { $gte: prevFrom, $lt: from } } },
            { $project: { _id: 0, userId: 1, scenarioId: 1, engine: 1, billedSeconds: 1, goals: 1, goalsDone: 1, endedAt: 1, youLines: SESSION_PROJECTION.youLines } },
        ], { allowDiskUse: true }).toArray(),
        db.collection('speak_events').find({ at: { $gte: from, $lt: to } }, { projection: { _id: 0 } }).limit(200000).toArray(),
    ]);
    const userIds = [...new Set(calls.map((c) => c.userId))];
    const [users, firsts] = await Promise.all([
        db.collection('users').find({ userId: { $in: userIds } }, { projection: { _id: 0, userId: 1, name: 1, email: 1, tier: 1 } }).toArray(),
        sessions.aggregate([
            { $match: { userId: { $in: userIds } } },
            { $sort: { startedAt: 1 } },
            { $group: { _id: '$userId', tier: { $first: '$tier' } } },
        ]).toArray(),
    ]);
    const firstCallTier = new Map(firsts.map((r) => [r._id, r.tier || 0]));
    return summarizeSpeak({ calls, prevCalls, events, users, firstCallTier, from, to, tz });
};

// One call for the admin: transcript, notes and what happened around it.
const buildSpeakCall = async (db, sessionId) => {
    const s = await db.collection('speak_sessions').findOne({ sessionId }, { projection: { _id: 0, callId: 0 } });
    if (!s) return null;
    const [user, events] = await Promise.all([
        db.collection('users').findOne({ userId: s.userId }, { projection: { _id: 0, userId: 1, name: 1, email: 1, tier: 1 } }),
        db.collection('speak_events').find({ sessionId }, { projection: { _id: 0, type: 1, at: 1, meta: 1 } }).sort({ at: 1 }).limit(200).toArray(),
    ]);
    const scene = findScenario(s.scenarioId);
    return {
        call: {
            ...callFacts(s),
            title: scene?.title || s.scenarioId,
            goalList: (scene?.goals || []).map((text, i) => ({ text, done: Array.isArray(s.goals) ? !!s.goals[i] : i < (s.goalsDone || 0) })),
            transcript: s.transcript || [],
            phrases: s.phrases || [],
            tips: s.tips || [],
            recap: s.recap || null,
        },
        user,
        events,
    };
};

const cache = createTtlCache(5 * 60 * 1000);

const getSpeakStats = async (req, res) => {
    try {
        const days = parseDays(req.query.days);
        const tz = parseTimeZone(req.query.tz);
        const { value, cachedAt } = await cache.get(`${days}:${tz}`, () => buildSpeak(getDb(), { days, tz }), { fresh: req.query.fresh === '1' });
        res.json({ success: true, cachedAt: new Date(cachedAt), days, ...value });
    } catch (error) {
        console.error('Admin speak stats failed:', error);
        res.status(500).json({ success: false, error: 'Failed to load Speak stats' });
    }
};

const getSpeakCall = async (req, res) => {
    try {
        const id = String(req.params.id || '');
        if (!/^[a-f0-9]{8,40}$/.test(id)) return res.status(400).json({ success: false, error: 'Invalid call id' });
        const detail = await buildSpeakCall(getDb(), id);
        if (!detail) return res.status(404).json({ success: false, error: 'Call not found' });
        res.json({ success: true, ...detail });
    } catch (error) {
        console.error('Admin speak call failed:', error);
        res.status(500).json({ success: false, error: 'Failed to load call' });
    }
};

module.exports = { getSpeakStats, getSpeakCall, summarizeSpeak, buildSpeak, REAL_LINES };

// Numbers for the admin dashboard. Every endpoint is cached in memory for a few
// minutes (pass ?fresh=1 to recompute) and only reads date-indexed ranges, so
// the page stays fast as the collections grow.
const { getDb } = require('../../database');
const { createTtlCache } = require('../../lib/ttlCache');

const DAY = 24 * 60 * 60 * 1000;
const WEEK = 7 * DAY;
const RANGE_DAYS = [7, 30, 90, 365];
const NUMBER_TYPES = ['int', 'long', 'double', 'decimal'];

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

const dayKey = (field, tz) => ({ $dateToString: { format: '%Y-%m-%d', date: `$${field}`, timezone: tz } });

// The local calendar days covered by [from, to), oldest first.
const listDays = (from, to, tz) => {
    const format = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
    const keys = new Set();
    for (let t = from.getTime(); t < to.getTime(); t += DAY / 2) keys.add(format.format(new Date(t)));
    keys.add(format.format(new Date(to.getTime() - 1)));
    return [...keys];
};

const change = (value, prev) => ({ value, prev });

// Anything a signed-in learner does that counts as being active that day.
const ACTIVITY_SOURCES = [
    { collection: 'sentences', field: 'dateCreated', match: { userId: { $type: 'number' } } },
    { collection: 'study_progress', field: 'date' },
    { collection: 'words', field: 'dateSaved' },
    { collection: 'savedSentences', field: 'dateSaved' },
    { collection: 'conversations', field: 'lastUpdated' },
    { collection: 'extended_texts', field: 'dateCreated' },
];

const activityMatch = (source, from, to, userIds) => ({
    [source.field]: { $gte: from, $lt: to },
    ...source.match,
    ...(userIds ? { userId: { $in: userIds } } : {}),
});

// Map of local day -> Set of active user ids.
const activeUsersByDay = async (db, from, to, tz) => {
    const results = await Promise.all(ACTIVITY_SOURCES.map((source) => db.collection(source.collection).aggregate([
        { $match: activityMatch(source, from, to) },
        { $group: { _id: { u: '$userId', d: dayKey(source.field, tz) } } },
    ], { allowDiskUse: true }).toArray()));

    const byDay = new Map();
    for (const rows of results) {
        for (const { _id } of rows) {
            if (!byDay.has(_id.d)) byDay.set(_id.d, new Set());
            byDay.get(_id.d).add(_id.u);
        }
    }
    return byDay;
};

const distinctActiveUsers = async (db, from, to, userIds) => {
    const results = await Promise.all(ACTIVITY_SOURCES.map((source) => db.collection(source.collection).aggregate([
        { $match: activityMatch(source, from, to, userIds) },
        { $group: { _id: '$userId' } },
    ]).toArray()));
    const users = new Set();
    for (const rows of results) for (const row of rows) users.add(row._id);
    return users;
};

const unionSize = (byDay) => {
    const all = new Set();
    for (const users of byDay.values()) for (const u of users) all.add(u);
    return all.size;
};

const countBy = (rows) => {
    const map = new Map();
    for (const key of rows) map.set(key, (map.get(key) || 0) + 1);
    return map;
};

const referrerHost = (referrer) => {
    if (!referrer) return null;
    try {
        return new URL(referrer).hostname.replace(/^www\./, '') || null;
    } catch {
        return null;
    }
};

const topEntries = (map, limit = 8) => [...map.entries()]
    .filter(([key]) => key)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => ({ key, count }));

// ---------- Overview ----------

const buildOverview = async (db, { days, tz }) => {
    const now = new Date();
    const from = new Date(now.getTime() - days * DAY);
    const prevFrom = new Date(now.getTime() - 2 * days * DAY);

    const [
        signupsByDay, prevSignups, sentencesByDay, prevSentences,
        activeByDay, prevActive, cohort, tiers, allSources, languages,
    ] = await Promise.all([
        db.collection('users').aggregate([
            { $match: { dateCreated: { $gte: from, $lt: now } } },
            { $group: { _id: dayKey('dateCreated', tz), count: { $sum: 1 } } },
        ]).toArray(),
        db.collection('users').countDocuments({ dateCreated: { $gte: prevFrom, $lt: from } }),
        db.collection('sentences').aggregate([
            { $match: { dateCreated: { $gte: from, $lt: now } } },
            { $group: {
                _id: dayKey('dateCreated', tz),
                count: { $sum: 1 },
                anon: { $sum: { $cond: [{ $in: [{ $type: '$userId' }, NUMBER_TYPES] }, 0, 1] } },
            } },
        ], { allowDiskUse: true }).toArray(),
        db.collection('sentences').countDocuments({ dateCreated: { $gte: prevFrom, $lt: from } }),
        activeUsersByDay(db, from, now, tz),
        distinctActiveUsers(db, prevFrom, from),
        db.collection('users')
            .find({ dateCreated: { $gte: from, $lt: now } }, { projection: { _id: 0, userId: 1, tier: 1, attribution: 1 } })
            .toArray(),
        db.collection('users').aggregate([{ $group: { _id: '$tier', count: { $sum: 1 } } }]).toArray(),
        db.collection('users').aggregate([
            { $group: {
                _id: { $ifNull: ['$attribution.heardFrom', null] },
                users: { $sum: 1 },
                paid: { $sum: { $cond: [{ $gt: ['$tier', 0] }, 1, 0] } },
            } },
        ]).toArray(),
        db.collection('sentences').aggregate([
            { $match: { dateCreated: { $gte: from, $lt: now } } },
            { $group: { _id: '$originalLanguage', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 8 },
        ]).toArray(),
    ]);

    // Daily series
    const signupMap = new Map(signupsByDay.map((row) => [row._id, row.count]));
    const sentenceMap = new Map(sentencesByDay.map((row) => [row._id, row]));
    const series = listDays(from, now, tz).map((date) => ({
        date,
        signups: signupMap.get(date) || 0,
        active: activeByDay.get(date)?.size || 0,
        sentences: sentenceMap.get(date)?.count || 0,
        anonSentences: sentenceMap.get(date)?.anon || 0,
    }));

    const signups = cohort.length;
    const sentences = sentencesByDay.reduce((sum, row) => sum + row.count, 0);
    const anonSentences = sentencesByDay.reduce((sum, row) => sum + row.anon, 0);

    // What the people who signed up in this range went on to do.
    const funnel = await buildFunnel(db, cohort);

    // Where they came from
    const heardFrom = countBy(cohort.map((u) => u.attribution?.heardFrom || null));
    const utm = countBy(cohort.map((u) => u.attribution?.utm_source || null));
    const referrers = countBy(cohort.map((u) => referrerHost(u.attribution?.referrer)));
    const paidFromCohort = cohort.filter((u) => u.tier > 0).length;

    const tierCount = (tier) => tiers.find((row) => row._id === tier)?.count || 0;

    return {
        range: { days, from, to: now, tz },
        kpis: {
            signups: change(signups, prevSignups),
            active: change(unionSize(activeByDay), prevActive.size),
            sentences: { ...change(sentences, prevSentences), anon: anonSentences },
            paidFromCohort,
            users: { total: tiers.reduce((sum, row) => sum + row.count, 0), free: tierCount(0), basic: tierCount(1), plus: tierCount(2) },
        },
        series,
        funnel,
        sources: {
            heardFrom: topEntries(heardFrom, 10),
            heardFromUnknown: heardFrom.get(null) || 0,
            utm: topEntries(utm),
            referrers: topEntries(referrers),
            allTime: allSources
                .map((row) => ({ key: row._id, users: row.users, paid: row.paid }))
                .sort((a, b) => b.users - a.users),
        },
        languages: languages.map((row) => ({ key: row._id || 'unknown', count: row.count })),
    };
};

const buildFunnel = async (db, cohort) => {
    const ids = cohort.map((u) => u.userId).filter((id) => typeof id === 'number');
    if (!ids.length) {
        return [
            { key: 'signedUp', users: 0 }, { key: 'analyzed', users: 0 }, { key: 'saved', users: 0 },
            { key: 'reviewed', users: 0 }, { key: 'returned', users: 0 }, { key: 'paid', users: 0 },
        ];
    }
    const inIds = { userId: { $in: ids } };
    const distinct = (collection, extra = {}) => db.collection(collection)
        .aggregate([{ $match: { ...inIds, ...extra } }, { $group: { _id: '$userId' } }]).toArray()
        .then((rows) => rows.map((row) => row._id));

    const [analyzed, paragraphs, words, savedSentences, reviewed, activeDays] = await Promise.all([
        distinct('sentences'),
        distinct('extended_texts'),
        distinct('words'),
        distinct('savedSentences'),
        distinct('study_progress'),
        // Days with any analysis or review, per user, to see who came back.
        Promise.all([
            db.collection('sentences').aggregate([
                { $match: inIds },
                { $group: { _id: { u: '$userId', d: { $dateToString: { format: '%Y-%m-%d', date: '$dateCreated' } } } } },
            ], { allowDiskUse: true }).toArray(),
            db.collection('study_progress').aggregate([
                { $match: inIds },
                { $group: { _id: { u: '$userId', d: { $dateToString: { format: '%Y-%m-%d', date: '$date' } } } } },
            ]).toArray(),
        ]),
    ]);

    const daysPerUser = new Map();
    for (const rows of activeDays) {
        for (const { _id } of rows) {
            if (!daysPerUser.has(_id.u)) daysPerUser.set(_id.u, new Set());
            daysPerUser.get(_id.u).add(_id.d);
        }
    }
    const returned = [...daysPerUser.values()].filter((set) => set.size >= 2).length;

    return [
        { key: 'signedUp', users: ids.length },
        { key: 'analyzed', users: new Set([...analyzed, ...paragraphs]).size },
        { key: 'saved', users: new Set([...words, ...savedSentences]).size },
        { key: 'reviewed', users: reviewed.length },
        { key: 'returned', users: returned },
        { key: 'paid', users: cohort.filter((u) => u.tier > 0).length },
    ];
};

// ---------- Engagement ----------

const buildEngagement = async (db, { days, tz }) => {
    const now = new Date();
    const from = new Date(now.getTime() - days * DAY);

    const [last30ByDay, active1, active7, features, retention, topLearners] = await Promise.all([
        activeUsersByDay(db, new Date(now.getTime() - 30 * DAY), now, tz),
        distinctActiveUsers(db, new Date(now.getTime() - DAY), now),
        distinctActiveUsers(db, new Date(now.getTime() - 7 * DAY), now),
        buildFeatureUse(db, from, now),
        buildRetention(db, now),
        buildTopLearners(db, from, now),
    ]);

    const mau = unionSize(last30ByDay);
    const dayTotals = [...last30ByDay.values()].map((set) => set.size);
    const avgDaily = dayTotals.length ? dayTotals.reduce((a, b) => a + b, 0) / 30 : 0;

    return {
        range: { days, from, to: now, tz },
        active: { day: active1.size, week: active7.size, month: mau, avgDaily: Math.round(avgDaily * 10) / 10 },
        features,
        retention,
        topLearners,
    };
};

const buildFeatureUse = async (db, from, to) => {
    const inRange = (field) => ({ [field]: { $gte: from, $lt: to } });
    const usersAndUses = (collection, field, extra = {}, uses = { $sum: 1 }) => db.collection(collection).aggregate([
        { $match: { ...inRange(field), ...extra } },
        { $group: { _id: '$userId', uses } },
        { $group: { _id: null, users: { $sum: 1 }, uses: { $sum: '$uses' } } },
    ], { allowDiskUse: true }).toArray().then((rows) => rows[0] || { users: 0, uses: 0 });

    const [analyze, paragraphs, tutor, savedSentences, words, flashcards, reviews, anon] = await Promise.all([
        usersAndUses('sentences', 'dateCreated', { userId: { $type: 'number' }, extendedTextId: { $in: [null] } }),
        usersAndUses('extended_texts', 'dateCreated'),
        usersAndUses('conversations', 'dateCreated'),
        usersAndUses('savedSentences', 'dateSaved'),
        usersAndUses('words', 'dateSaved'),
        usersAndUses('flashcards', 'dateCreated'),
        usersAndUses('study_progress', 'date', {}, { $sum: { $add: [{ $ifNull: ['$reviewsCompleted', 0] }, { $ifNull: ['$newCardsStudied', 0] }] } }),
        db.collection('sentences').countDocuments({ ...inRange('dateCreated'), userId: { $not: { $type: 'number' } } }),
    ]);

    return {
        list: [
            { key: 'analyze', stage: 'read', ...pick(analyze) },
            { key: 'paragraphs', stage: 'read', ...pick(paragraphs) },
            { key: 'tutor', stage: 'understand', ...pick(tutor) },
            { key: 'savedSentences', stage: 'keep', ...pick(savedSentences) },
            { key: 'words', stage: 'keep', ...pick(words) },
            { key: 'flashcards', stage: 'keep', ...pick(flashcards) },
            { key: 'reviews', stage: 'review', ...pick(reviews) },
        ],
        anonAnalyses: anon,
    };
};

const pick = ({ users, uses }) => ({ users: users || 0, uses: uses || 0 });

// Weekly signup cohorts: the share of each week's signups active in each later week.
const RETENTION_WEEKS = 10;
const buildRetention = async (db, now) => {
    const base = new Date(now.getTime() - RETENTION_WEEKS * WEEK);
    const users = await db.collection('users')
        .find({ dateCreated: { $gte: base, $lt: now } }, { projection: { _id: 0, userId: 1, dateCreated: 1 } })
        .toArray();
    const blockOf = (date) => Math.floor((date.getTime() - base.getTime()) / WEEK);

    const cohortOf = new Map();
    const sizes = new Array(RETENTION_WEEKS).fill(0);
    for (const u of users) {
        const block = blockOf(u.dateCreated);
        if (block < 0 || block >= RETENTION_WEEKS) continue;
        cohortOf.set(u.userId, block);
        sizes[block] += 1;
    }

    const ids = [...cohortOf.keys()];
    const activeIn = sizes.map((_, block) => new Array(RETENTION_WEEKS - block).fill(0));
    if (ids.length) {
        const results = await Promise.all(ACTIVITY_SOURCES.map((source) => db.collection(source.collection).aggregate([
            { $match: activityMatch(source, base, now, ids) },
            { $group: { _id: { u: '$userId', w: { $floor: { $divide: [{ $subtract: [`$${source.field}`, base] }, WEEK] } } } } },
        ], { allowDiskUse: true }).toArray()));

        const seen = new Set();
        for (const rows of results) {
            for (const { _id } of rows) {
                const cohort = cohortOf.get(_id.u);
                const offset = _id.w - cohort;
                const key = `${_id.u}:${offset}`;
                if (cohort === undefined || offset < 0 || offset >= activeIn[cohort].length || seen.has(key)) continue;
                seen.add(key);
                activeIn[cohort][offset] += 1;
            }
        }
    }

    return sizes.map((size, block) => ({
        weekStart: new Date(base.getTime() + block * WEEK),
        size,
        active: activeIn[block],
    })).reverse();
};

const buildTopLearners = async (db, from, to) => {
    const top = await db.collection('sentences').aggregate([
        { $match: { dateCreated: { $gte: from, $lt: to }, userId: { $type: 'number' } } },
        { $group: { _id: '$userId', sentences: { $sum: 1 }, lastActive: { $max: '$dateCreated' } } },
        { $sort: { sentences: -1 } },
        { $limit: 15 },
    ], { allowDiskUse: true }).toArray();
    const ids = top.map((row) => row._id);
    if (!ids.length) return [];

    const [users, reviews] = await Promise.all([
        db.collection('users').find({ userId: { $in: ids } }, { projection: { _id: 0, userId: 1, name: 1, email: 1, tier: 1, dateCreated: 1, 'attribution.heardFrom': 1 } }).toArray(),
        db.collection('study_progress').aggregate([
            { $match: { userId: { $in: ids }, date: { $gte: from, $lt: to } } },
            { $group: { _id: '$userId', reviews: { $sum: { $add: [{ $ifNull: ['$reviewsCompleted', 0] }, { $ifNull: ['$newCardsStudied', 0] }] } } } },
        ]).toArray(),
    ]);
    const userMap = new Map(users.map((u) => [u.userId, u]));
    const reviewMap = new Map(reviews.map((row) => [row._id, row.reviews]));

    return top.map((row) => {
        const u = userMap.get(row._id) || {};
        return {
            userId: row._id,
            name: u.name || 'Unknown',
            email: u.email || '',
            tier: u.tier || 0,
            heardFrom: u.attribution?.heardFrom || null,
            joined: u.dateCreated || null,
            sentences: row.sentences,
            reviews: reviewMap.get(row._id) || 0,
            lastActive: row.lastActive,
        };
    });
};

// ---------- Feed ----------

const buildFeed = async (db) => {
    const weekAgo = new Date(Date.now() - 7 * DAY);
    const [signups, feedback, pendingSuggestions, jobCounts, failedJobs] = await Promise.all([
        db.collection('users').find({}, {
            projection: { _id: 0, userId: 1, name: 1, email: 1, tier: 1, dateCreated: 1, googleId: 1, attribution: 1 },
        }).sort({ dateCreated: -1 }).limit(12).toArray(),
        db.collection('feedback').find({ parentId: { $in: [null] }, isDeleted: { $ne: true } }, {
            projection: { _id: 0, feedbackId: 1, userId: 1, text: 1, dateCreated: 1 },
        }).sort({ dateCreated: -1 }).limit(6).toArray(),
        db.collection('lyric_suggestions').countDocuments({ status: 'pending' }),
        db.collection('extended_text_jobs').aggregate([
            { $match: { createdAt: { $gte: weekAgo } } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]).toArray(),
        db.collection('extended_text_jobs').find({ status: 'failed', createdAt: { $gte: weekAgo } }, {
            projection: { _id: 0, jobId: 1, userId: 1, error: 1, createdAt: 1, sentenceCount: 1 },
        }).sort({ createdAt: -1 }).limit(5).toArray(),
    ]);

    const feedbackUsers = await db.collection('users')
        .find({ userId: { $in: feedback.map((f) => f.userId) } }, { projection: { _id: 0, userId: 1, name: 1 } })
        .toArray();
    const nameOf = new Map(feedbackUsers.map((u) => [u.userId, u.name]));

    return {
        signups: signups.map((u) => ({
            userId: u.userId,
            name: u.name,
            email: u.email,
            tier: u.tier || 0,
            dateCreated: u.dateCreated,
            method: u.googleId ? 'google' : 'email',
            heardFrom: u.attribution?.heardFrom || null,
            utmSource: u.attribution?.utm_source || null,
            referrer: referrerHost(u.attribution?.referrer),
            landingPath: u.attribution?.landingPath || null,
        })),
        feedback: feedback.map((f) => ({
            ...f,
            text: typeof f.text === 'string' ? f.text.slice(0, 280) : '',
            name: nameOf.get(f.userId) || 'Someone',
        })),
        pendingSuggestions,
        jobs: {
            counts: Object.fromEntries(jobCounts.map((row) => [row._id || 'unknown', row.count])),
            failed: failedJobs.map((job) => ({ ...job, error: typeof job.error === 'string' ? job.error.slice(0, 200) : null })),
        },
    };
};

// ---------- One user ----------

const buildUserDetail = async (db, userId) => {
    const user = await db.collection('users').findOne({ userId }, {
        projection: { _id: 0, password: 0 },
    });
    if (!user) return null;
    const { googleId, ...profile } = user;

    const by = { userId };
    const last = (collection, field) => db.collection(collection)
        .find(by, { projection: { _id: 0, [field]: 1 } }).sort({ [field]: -1 }).limit(1).toArray()
        .then((rows) => rows[0]?.[field] || null);

    const [sentences, paragraphs, words, savedSentences, flashcards, conversations, reviews, lastSentence, lastStudy, recent, featureUsage] = await Promise.all([
        db.collection('sentences').countDocuments(by),
        db.collection('extended_texts').countDocuments(by),
        db.collection('words').countDocuments(by),
        db.collection('savedSentences').countDocuments(by),
        db.collection('flashcards').countDocuments(by),
        db.collection('conversations').countDocuments(by),
        db.collection('study_progress').aggregate([
            { $match: by },
            { $group: { _id: null, total: { $sum: { $add: [{ $ifNull: ['$reviewsCompleted', 0] }, { $ifNull: ['$newCardsStudied', 0] }] } }, days: { $sum: 1 } } },
        ]).toArray(),
        last('sentences', 'dateCreated'),
        last('study_progress', 'date'),
        db.collection('sentences').find(by, { projection: { _id: 0, sentenceId: 1, text: 1, originalLanguage: 1, dateCreated: 1 } })
            .sort({ dateCreated: -1 }).limit(5).toArray(),
        db.collection('feature_usage').find(by, { projection: { _id: 0, feature: 1, count: 1, lastUsed: 1 } }).toArray(),
    ]);

    const lastActive = [lastSentence, lastStudy].filter(Boolean).sort((a, b) => b - a)[0] || null;

    return {
        user: { ...profile, method: googleId ? 'google' : 'email' },
        counts: {
            sentences, paragraphs, words, savedSentences, flashcards, conversations,
            reviews: reviews[0]?.total || 0,
            studyDays: reviews[0]?.days || 0,
        },
        lastActive,
        recent: recent.map((s) => ({ ...s, text: typeof s.text === 'string' ? s.text.slice(0, 160) : '' })),
        featureUsage,
    };
};

// ---------- Handlers ----------

const overviewCache = createTtlCache(5 * 60 * 1000);
const engagementCache = createTtlCache(10 * 60 * 1000);
const feedCache = createTtlCache(60 * 1000);

const respond = (cache, keyOf, build) => async (req, res) => {
    try {
        const days = parseDays(req.query.days);
        const tz = parseTimeZone(req.query.tz);
        const { value, cachedAt } = await cache.get(keyOf(days, tz), () => build(getDb(), { days, tz }), { fresh: req.query.fresh === '1' });
        res.json({ success: true, cachedAt: new Date(cachedAt), ...value });
    } catch (error) {
        console.error('Admin stats failed:', error);
        res.status(500).json({ success: false, error: 'Failed to load stats' });
    }
};

const getOverview = respond(overviewCache, (days, tz) => `${days}:${tz}`, buildOverview);
const getEngagement = respond(engagementCache, (days, tz) => `${days}:${tz}`, buildEngagement);
const getFeed = respond(feedCache, () => 'feed', (db) => buildFeed(db));

const getUserDetail = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId, 10);
        if (!Number.isInteger(userId)) {
            return res.status(400).json({ success: false, error: 'Invalid user id' });
        }
        const detail = await buildUserDetail(getDb(), userId);
        if (!detail) return res.status(404).json({ success: false, error: 'User not found' });
        res.json({ success: true, ...detail });
    } catch (error) {
        console.error('Admin user detail failed:', error);
        res.status(500).json({ success: false, error: 'Failed to load user' });
    }
};

module.exports = {
    getOverview,
    getEngagement,
    getFeed,
    getUserDetail,
    // exported for tests
    buildOverview,
    buildEngagement,
    buildFeed,
    buildUserDetail,
    parseDays,
    parseTimeZone,
    listDays,
};

// A daily growth snapshot for the scorecard: revenue, signups, the learner
// funnel, engagement, traffic and signup sources in one JSON document with no
// names or emails in it. A scheduled job outside the server fetches it with a
// shared token (METRICS_TOKEN in server/.env) and keeps the history.
const crypto = require('crypto');
const { getDb } = require('../../database');
const { createTtlCache } = require('../../lib/ttlCache');
const { buildOverview, buildEngagement } = require('./stats');
const { buildRevenue } = require('./revenue');
const { PAYING_EXPR } = require('../../utils/autoTrial');
const { buildTraffic, buildEventBreakdown, isConfigured: umamiConfigured } = require('./traffic');

const DAY = 24 * 60 * 60 * 1000;
const SCHEMA_VERSION = 1;
const SEARCH_ENGINES = /(^|\.)(google|bing|duckduckgo|yahoo|naver|daum|ecosia|yandex|baidu|brave|startpage|qwant)\./i;

const digest = (value) => crypto.createHash('sha256').update(String(value)).digest();

// Lets the request through only with `Authorization: Bearer <METRICS_TOKEN>`.
// Without METRICS_TOKEN set the endpoint does not exist.
const requireMetricsToken = (req, res, next) => {
    const expected = process.env.METRICS_TOKEN;
    if (!expected) return res.status(404).json({ success: false, error: 'Not found' });
    const header = req.get('authorization') || '';
    const given = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!given || !crypto.timingSafeEqual(digest(given), digest(expected))) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    next();
};

const sumWhere = (rows, test) => rows.filter((row) => test(row.label)).reduce((sum, row) => sum + row.value, 0);

const referrerHost = (label) => String(label || '').replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '');

// Search-driven traffic: visits arriving from search engines, and views of the
// pages SEO work targets (Learn articles and lyric study notes).
const seoFrom = (traffic) => ({
    searchReferrals: sumWhere(traffic.referrers, (label) => SEARCH_ENGINES.test(`${referrerHost(label)}.`)),
    learnViews: sumWhere(traffic.pages, (label) => label === '/learn' || label.startsWith('/learn/')),
    lyricsViews: sumWhere(traffic.pages, (label) => label === '/lyrics' || label.startsWith('/lyrics/')),
});

const periodFrom = (overview) => ({
    signups: overview.kpis.signups.value,
    signupsPrev: overview.kpis.signups.prev,
    active: overview.kpis.active.value,
    activePrev: overview.kpis.active.prev,
    sentences: overview.kpis.sentences.value,
    sentencesPrev: overview.kpis.sentences.prev,
    anonSentences: overview.kpis.sentences.anon,
    paidFromCohort: overview.kpis.paidFromCohort,
    funnel: overview.funnel,
    heardFrom: overview.sources.heardFrom,
    heardFromUnknown: overview.sources.heardFromUnknown,
    utm: overview.sources.utm,
    referrers: overview.sources.referrers,
    languages: overview.languages,
});

const revenueFrom = (week, month) => {
    if (!week.available) return { available: false, reason: week.reason };
    return {
        available: true,
        currency: week.currency,
        mrr: Math.round(week.mrr),
        mrrList: Math.round(week.mrrList ?? week.mrr),
        paying: week.subscribers.paying,
        trialing: week.subscribers.trialing,
        pastDue: week.subscribers.pastDue,
        cancelling: week.subscribers.cancelling,
        new7d: week.subscribers.newInRange,
        cancelled7d: week.subscribers.cancelledInRange,
        new30d: month.subscribers.newInRange,
        cancelled30d: month.subscribers.cancelledInRange,
        revenue7d: week.revenue.current,
        revenue30d: month.revenue.current,
        plans: week.plans.map((p) => ({ ...p, mrr: Math.round(p.mrr) })),
        mrrHistory: week.mrrHistory.map((m) => ({ ...m, mrr: Math.round(m.mrr) })),
    };
};

const trafficFrom = (traffic) => ({
    ...traffic.stats.current,
    prev: traffic.stats.prev,
    referrers: traffic.referrers,
    pages: traffic.pages.slice(0, 25),
    countries: traffic.countries,
    devices: traffic.devices,
    events: traffic.events,
    seo: seoFrom(traffic),
});

// Signups in the last 30 days by where they came from, with how many now pay.
const buildChannels = async (db, now) => {
    const rows = await db.collection('users').aggregate([
        { $match: { dateCreated: { $gte: new Date(now.getTime() - 30 * DAY), $lt: now } } },
        { $group: {
            _id: {
                source: { $ifNull: ['$attribution.utm_source', null] },
                campaign: { $ifNull: ['$attribution.utm_campaign', null] },
                // Outbox posts put the post id here, so signups can be joined to posts.csv.
                content: { $ifNull: ['$attribution.utm_content', null] },
                heardFrom: { $ifNull: ['$attribution.heardFrom', null] },
            },
            users: { $sum: 1 },
            paid: { $sum: { $cond: [PAYING_EXPR, 1, 0] } },
        } },
        { $sort: { users: -1 } },
    ]).toArray();
    return rows.map((row) => ({ ...row._id, users: row.users, paid: row.paid }));
};

// No-card Plus trials (AUTO_TRIAL_ENABLED): how many are running, how many
// ended in the last 30 days, and how many of those accounts now subscribe.
const buildAutoTrials = async (db, now) => {
    const users = db.collection('users');
    const since = new Date(now.getTime() - 30 * DAY);
    const subscribed = { 'subscription.stripeSubscriptionId': { $exists: true } };
    const returning = { 'autoTrial.source': 'returning' };
    const [active, started30d, converted30d, returningStarted30d, returningConverted30d] = await Promise.all([
        users.countDocuments({ 'autoTrial.endsAt': { $gt: now }, 'autoTrial.expiredAt': { $exists: false }, 'subscription.stripeSubscriptionId': { $exists: false } }),
        users.countDocuments({ 'autoTrial.startedAt': { $gte: since } }),
        users.countDocuments({ 'autoTrial.startedAt': { $gte: since }, ...subscribed, tier: { $gt: 0 } }),
        users.countDocuments({ 'autoTrial.startedAt': { $gte: since }, ...returning }),
        users.countDocuments({ 'autoTrial.startedAt': { $gte: since }, ...returning, ...subscribed, tier: { $gt: 0 } }),
    ]);
    // started30d/converted30d include the returning-user trials
    return { active, started30d, converted30d, returningStarted30d, returningConverted30d };
};

// How hard people lean on the free allowance, to tell whether the 10-a-week
// limit is ever felt. Pure part first so tests can feed it rows.
const USAGE_BUCKETS = [['1-2', 1, 2], ['3-5', 3, 5], ['6-9', 6, 9], ['10+', 10, Infinity]];
const TRIAL_BUCKETS = [['0', 0, 0], ['1-4', 1, 4], ['5-9', 5, 9], ['10-19', 10, 19], ['20+', 20, Infinity]];
const bucketize = (counts, buckets) => Object.fromEntries(buckets.map(([label, lo, hi]) =>
    [label, counts.filter((n) => n >= lo && n <= hi).length]));

// weekRows: [{ userId, week, count }] (week = 0..3, 0 = the last 7 days)
// users: Map userId -> 'free' | 'trial' | 'paying'
// trialCounts: sentences analyzed during each ended trial
const usageDepthFrom = (weekRows, users, trialCounts) => {
    const groups = { free: [], trial: [], paying: [] };
    for (const row of weekRows) {
        const group = users.get(row.userId);
        if (groups[group]) groups[group].push(row.count);
    }
    const summary = (counts) => ({
        userWeeks: counts.length,
        ...bucketize(counts, USAGE_BUCKETS),
        median: counts.length ? [...counts].sort((a, b) => a - b)[Math.floor(counts.length / 2)] : 0,
    });
    return {
        // One entry per person per active week, over the last 4 weeks
        weekly: { free: summary(groups.free), trial: summary(groups.trial), paying: summary(groups.paying) },
        // Breakdowns made during each no-card trial that ended in the last 30 days
        endedTrials: { count: trialCounts.length, ...bucketize(trialCounts, TRIAL_BUCKETS) },
    };
};

const buildUsageDepth = async (db, now) => {
    const since = new Date(now.getTime() - 28 * DAY);
    const weekRows = await db.collection('sentences').aggregate([
        { $match: { dateCreated: { $gte: since }, userId: { $type: 'number' } } },
        { $group: { _id: { userId: '$userId', week: { $floor: { $divide: [{ $subtract: [now, '$dateCreated'] }, 7 * DAY] } } }, count: { $sum: 1 } } },
        { $project: { _id: 0, userId: '$_id.userId', week: '$_id.week', count: 1 } },
    ]).toArray();
    const ids = [...new Set(weekRows.map((r) => r.userId))];
    const docs = await db.collection('users').find(
        { userId: { $in: ids } },
        { projection: { userId: 1, tier: 1, autoTrial: 1, 'subscription.stripeSubscriptionId': 1 } },
    ).toArray();
    const users = new Map(docs.map((u) => {
        const onTrial = u.autoTrial && !u.autoTrial.expiredAt && new Date(u.autoTrial.endsAt) > now && !u.subscription?.stripeSubscriptionId;
        return [u.userId, onTrial ? 'trial' : u.tier > 0 ? 'paying' : 'free'];
    }));
    const ended = await db.collection('users').find(
        { 'autoTrial.expiredAt': { $gte: new Date(now.getTime() - 30 * DAY) } },
        { projection: { userId: 1, autoTrial: 1 } },
    ).toArray();
    const trialCounts = await Promise.all(ended.map((u) => db.collection('sentences').countDocuments({
        userId: u.userId,
        dateCreated: { $gte: new Date(u.autoTrial.startedAt), $lte: new Date(u.autoTrial.expiredAt) },
    })));
    return usageDepthFrom(weekRows, users, trialCounts);
};

// Each section is computed on its own so one failing source (Stripe, Umami)
// leaves the rest of the snapshot intact and is listed under `errors`.
const buildSnapshot = async (db, { tz = 'UTC', now = new Date() } = {}) => {
    const errors = [];
    const section = (name, promise) => promise.catch((error) => {
        console.error(`Metrics snapshot: ${name} failed:`, error.message);
        errors.push({ section: name, error: error.message });
        return null;
    });
    const traffic = (days) => (umamiConfigured()
        ? section(`traffic${days}d`, buildTraffic({ days, tz, now, pageLimit: 100, eventLimit: 100 }))
        : Promise.resolve(null));

    const [week, month, engagement, revenueWeek, revenueMonth, trafficWeek, trafficMonth, channels, autoTrials, usageDepth] = await Promise.all([
        section('overview7d', buildOverview(db, { days: 7, tz })),
        section('overview30d', buildOverview(db, { days: 30, tz })),
        section('engagement', buildEngagement(db, { days: 30, tz })),
        section('revenue7d', buildRevenue(db, { days: 7 })),
        section('revenue30d', buildRevenue(db, { days: 30 })),
        traffic(7),
        traffic(30),
        section('channels', buildChannels(db, now)),
        section('autoTrials', buildAutoTrials(db, now)),
        section('usageDepth', buildUsageDepth(db, now)),
    ]);

    return {
        schema: SCHEMA_VERSION,
        generatedAt: now,
        tz,
        revenue: revenueWeek && revenueMonth ? revenueFrom(revenueWeek, revenueMonth) : null,
        users: week?.kpis.users || month?.kpis.users || null,
        periods: {
            '7d': week ? periodFrom(week) : null,
            '30d': month ? periodFrom(month) : null,
        },
        daily: month?.series || null,
        engagement: engagement ? {
            dau: engagement.active.day,
            wau: engagement.active.week,
            mau: engagement.active.month,
            avgDaily: engagement.active.avgDaily,
            features30d: engagement.features.list,
            anonAnalyses30d: engagement.features.anonAnalyses,
            retention: engagement.retention,
        } : null,
        traffic: umamiConfigured() ? {
            '7d': trafficWeek ? trafficFrom(trafficWeek) : null,
            '30d': trafficMonth ? trafficFrom(trafficMonth) : null,
        } : { available: false, reason: 'not_configured' },
        channels30d: channels,
        autoTrials,
        usageDepth,
        errors,
    };
};


// GET /api/metrics/event?event=analyze_error&property=reason&from=ISO&to=ISO&bucketHours=1
// Same token as the snapshot. Answers one-off questions about a custom
// Umami event without anyone logging in to Umami.
const NAME = /^[a-z0-9_]{1,64}$/i;
const getEventBreakdown = async (req, res) => {
    if (!umamiConfigured()) return res.status(503).json({ success: false, error: 'Umami is not configured' });
    const { event, property } = req.query;
    const to = req.query.to ? new Date(req.query.to) : new Date();
    const from = req.query.from ? new Date(req.query.from) : new Date(to.getTime() - 7 * DAY);
    const bucketHours = req.query.bucketHours ? Number(req.query.bucketHours) : null;
    if (!NAME.test(event || '') || (property && !NAME.test(property))
        || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to
        || to.getTime() - from.getTime() > 90 * DAY
        || (bucketHours !== null && !(bucketHours >= 1 && bucketHours <= 24 * 30))) {
        return res.status(400).json({ success: false, error: 'Bad query' });
    }
    try {
        res.json({ success: true, ...(await buildEventBreakdown({ event, property, from, to, bucketHours })) });
    } catch (error) {
        console.error('Metrics event query failed:', error.message);
        res.status(502).json({ success: false, error: 'Could not reach Umami' });
    }
};

const snapshotCache = createTtlCache(10 * 60 * 1000);

const getSnapshot = async (req, res) => {
    try {
        const { value } = await snapshotCache.get('snapshot', () => buildSnapshot(getDb()), { fresh: req.query.fresh === '1' });
        res.json({ success: true, ...value });
    } catch (error) {
        console.error('Metrics snapshot failed:', error);
        res.status(500).json({ success: false, error: 'Snapshot failed' });
    }
};

module.exports = { getSnapshot, getEventBreakdown, requireMetricsToken, buildSnapshot, seoFrom, revenueFrom, usageDepthFrom };

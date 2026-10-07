// A daily growth snapshot for the scorecard: revenue, signups, the learner
// funnel, engagement, traffic and signup sources in one JSON document with no
// names or emails in it. A scheduled job outside the server fetches it with a
// shared token (METRICS_TOKEN in server/.env) and keeps the history.
const crypto = require('crypto');
const { getDb } = require('../../database');
const { createTtlCache } = require('../../lib/ttlCache');
const { buildOverview, buildEngagement } = require('./stats');
const { buildRevenue } = require('./revenue');
const { buildTraffic, isConfigured: umamiConfigured } = require('./traffic');

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
                heardFrom: { $ifNull: ['$attribution.heardFrom', null] },
            },
            users: { $sum: 1 },
            paid: { $sum: { $cond: [{ $gt: ['$tier', 0] }, 1, 0] } },
        } },
        { $sort: { users: -1 } },
    ]).toArray();
    return rows.map((row) => ({ ...row._id, users: row.users, paid: row.paid }));
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
        ? section(`traffic${days}d`, buildTraffic({ days, tz, now, pageLimit: 100 }))
        : Promise.resolve(null));

    const [week, month, engagement, revenueWeek, revenueMonth, trafficWeek, trafficMonth, channels] = await Promise.all([
        section('overview7d', buildOverview(db, { days: 7, tz })),
        section('overview30d', buildOverview(db, { days: 30, tz })),
        section('engagement', buildEngagement(db, { days: 30, tz })),
        section('revenue7d', buildRevenue(db, { days: 7 })),
        section('revenue30d', buildRevenue(db, { days: 30 })),
        traffic(7),
        traffic(30),
        section('channels', buildChannels(db, now)),
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
        errors,
    };
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

module.exports = { getSnapshot, requireMetricsToken, buildSnapshot, seoFrom, revenueFrom };

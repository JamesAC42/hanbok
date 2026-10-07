// Site traffic for the admin dashboard, read from the self-hosted Umami that
// already tracks hanbokstudy.com. Works with Umami v2 and v3 response shapes.
// Cached for ten minutes; ?fresh=1 recomputes.
//
// Config (server/.env):
//   UMAMI_USERNAME + UMAMI_PASSWORD  an Umami login that can see the website
//   UMAMI_API_KEY                    or an Umami Cloud API key instead
//   UMAMI_URL, UMAMI_WEBSITE_ID      default to the site's own Umami
const { createTtlCache } = require('../../lib/ttlCache');
const { parseDays, parseTimeZone, listDays } = require('./stats');

const DAY = 24 * 60 * 60 * 1000;
const TIMEOUT_MS = 10000;
const DEFAULT_URL = 'https://umami.fukuin.dev';
const DEFAULT_WEBSITE_ID = 'ef4f8c80-9b1d-4d10-87f3-8b3f5c3963e8';

const config = () => ({
    url: (process.env.UMAMI_URL || DEFAULT_URL).replace(/\/+$/, ''),
    websiteId: process.env.UMAMI_WEBSITE_ID || DEFAULT_WEBSITE_ID,
    username: process.env.UMAMI_USERNAME,
    password: process.env.UMAMI_PASSWORD,
    apiKey: process.env.UMAMI_API_KEY,
});

const isConfigured = (c = config()) => !!(c.apiKey || (c.username && c.password));

class UmamiError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}

let token = null;

const login = async (c) => {
    const response = await fetch(`${c.url}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: c.username, password: c.password }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new UmamiError('Umami rejected the login', response.status);
    const data = await response.json();
    if (!data.token) throw new UmamiError('Umami login returned no token');
    token = data.token;
};

// GET an Umami API path, logging in first (and again if the token expired).
const umamiGet = async (path, params, c = config(), retried = false) => {
    if (!c.apiKey && !token) await login(c);
    const base = c.apiKey && !process.env.UMAMI_URL ? 'https://api.umami.is/v1' : `${c.url}/api`;
    const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined));
    const response = await fetch(`${base}${path}?${query}`, {
        headers: c.apiKey ? { 'x-umami-api-key': c.apiKey, Accept: 'application/json' } : { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (response.status === 401 && !c.apiKey && !retried) {
        token = null;
        return umamiGet(path, params, c, true);
    }
    if (!response.ok) throw new UmamiError(`Umami ${path} returned ${response.status}`, response.status);
    return response.json();
};

// v2 wraps each stat as { value, prev | change }; v3 returns plain numbers.
const num = (value) => (value && typeof value === 'object' ? Number(value.value) || 0 : Number(value) || 0);

const normalizeStats = (raw = {}) => ({
    pageviews: num(raw.pageviews),
    visitors: num(raw.visitors),
    visits: num(raw.visits),
    bounces: num(raw.bounces),
    totaltime: num(raw.totaltime),
});

// Fills every local day of the range, so quiet days show as zero.
const toDailySeries = (rows = [], dayKeys) => {
    const byDay = new Map();
    for (const row of rows) {
        const key = String(row.x ?? row.t ?? '').slice(0, 10);
        if (key) byDay.set(key, (byDay.get(key) || 0) + (Number(row.y) || 0));
    }
    return dayKeys.map((date) => byDay.get(date) || 0);
};

const toList = (rows) => (Array.isArray(rows) ? rows : rows?.data || [])
    .map((row) => ({ label: row.x ?? row.name ?? '', value: Number(row.y ?? row.value) || 0 }))
    .filter((row) => row.value > 0);

// Umami v3 renamed the "url" metric to "path"; try one, fall back to the other.
const metric = async (c, range, types, limit) => {
    for (const type of types) {
        try {
            return toList(await umamiGet(`/websites/${c.websiteId}/metrics`, { ...range, type, limit }, c)).slice(0, limit);
        } catch (error) {
            if (error.status !== 400 && error.status !== 404) throw error;
        }
    }
    return [];
};

const optional = (promise) => promise.catch((error) => {
    console.warn('Umami section skipped:', error.message);
    return null;
});

const buildTraffic = async ({ days, tz, now = new Date(), pageLimit = 12 }) => {
    const c = config();
    const from = new Date(now.getTime() - days * DAY);
    const prevFrom = new Date(now.getTime() - 2 * days * DAY);
    const range = { startAt: from.getTime(), endAt: now.getTime() };
    const site = `/websites/${c.websiteId}`;
    const dayKeys = listDays(from, now, tz);

    // The headline numbers are required; the breakdowns degrade to empty lists.
    const [current, prev] = await Promise.all([
        umamiGet(`${site}/stats`, range, c),
        umamiGet(`${site}/stats`, { startAt: prevFrom.getTime(), endAt: from.getTime() }, c),
    ]);
    const [series, pages, referrers, countries, devices, events, active] = await Promise.all([
        optional(umamiGet(`${site}/pageviews`, { ...range, unit: 'day', timezone: tz }, c)),
        optional(metric(c, range, ['path', 'url'], pageLimit)),
        optional(metric(c, range, ['referrer'], 10)),
        optional(metric(c, range, ['country'], 8)),
        optional(metric(c, range, ['device'], 5)),
        optional(metric(c, range, ['event'], 20)),
        optional(umamiGet(`${site}/active`, {}, c)),
    ]);

    const pageviews = toDailySeries(series?.pageviews, dayKeys);
    const visitors = toDailySeries(series?.sessions, dayKeys);

    return {
        available: true,
        dashboardUrl: `${c.url}/websites/${c.websiteId}`,
        range: { days, from, to: now, tz },
        stats: { current: normalizeStats(current), prev: normalizeStats(prev) },
        activeNow: active ? num(active.visitors ?? active.x ?? active) : null,
        series: dayKeys.map((date, i) => ({ date, pageviews: pageviews[i], visitors: visitors[i] })),
        pages: pages || [],
        referrers: referrers || [],
        countries: countries || [],
        devices: devices || [],
        events: (events || []).filter((e) => e.label && e.label !== '(none)'),
    };
};


// How often one custom event fired, split by one of its properties, in equal
// time buckets. Used by the metrics query endpoint for questions like "which
// analyze_error reasons fired before and after a fix".
const MAX_BUCKETS = 96;
const buildEventBreakdown = async ({ event, property, from, to, bucketHours }) => {
    const c = config();
    const site = `/websites/${c.websiteId}`;
    const step = bucketHours ? bucketHours * 60 * 60 * 1000 : to.getTime() - from.getTime();
    const starts = [];
    for (let t = from.getTime(); t < to.getTime() && starts.length < MAX_BUCKETS; t += step) starts.push(t);

    const bucket = async (start) => {
        const end = Math.min(start + step, to.getTime());
        const range = { startAt: start, endAt: end };
        const [events, values] = await Promise.all([
            optional(metric(c, range, ['event'], 50)),
            property
                ? optional(umamiGet(`${site}/event-data/values`, { ...range, event, eventName: event, propertyName: property }, c))
                : Promise.resolve(null),
        ]);
        const rows = Array.isArray(values) ? values : values?.data || [];
        return {
            from: new Date(start),
            to: new Date(end),
            count: (events || []).find((e) => e.label === event)?.value || 0,
            values: rows
                .map((row) => ({ value: String(row.value ?? row.x ?? ''), count: Number(row.total ?? row.y ?? row.count) || 0 }))
                .filter((row) => row.count > 0),
        };
    };

    const buckets = await Promise.all(starts.map(bucket));
    const totals = new Map();
    for (const b of buckets) for (const v of b.values) totals.set(v.value, (totals.get(v.value) || 0) + v.count);
    return {
        event,
        property: property || null,
        from,
        to,
        bucketHours: bucketHours || null,
        truncated: starts.length === MAX_BUCKETS && starts[starts.length - 1] + step < to.getTime(),
        total: buckets.reduce((sum, b) => sum + b.count, 0),
        byValue: [...totals.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count),
        buckets,
    };
};

const trafficCache = createTtlCache(10 * 60 * 1000);

const getTraffic = async (req, res) => {
    if (!isConfigured()) {
        return res.json({ success: true, available: false, reason: 'not_configured' });
    }
    const days = parseDays(req.query.days);
    const tz = parseTimeZone(req.query.tz);
    try {
        const { value, cachedAt } = await trafficCache.get(`${days}|${tz}`, () => buildTraffic({ days, tz }), { fresh: req.query.fresh === '1' });
        res.json({ success: true, cachedAt: new Date(cachedAt), ...value });
    } catch (error) {
        console.error('Admin traffic failed:', error.message);
        const reason = error.status === 401 || error.status === 403 ? 'Umami rejected the login' : 'Could not reach Umami';
        res.json({ success: true, available: false, reason });
    }
};

module.exports = { getTraffic, buildTraffic, buildEventBreakdown, isConfigured, normalizeStats, toDailySeries, toList };

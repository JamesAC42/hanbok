const test = require('node:test');
const assert = require('node:assert');

process.env.MONGODB_DB = process.env.MONGODB_DB || 'test';

const { requireMetricsToken, seoFrom, revenueFrom } = require('../controllers/admin/snapshot');

const fakeRes = () => {
    const res = { statusCode: 200, body: null };
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (body) => { res.body = body; return res; };
    return res;
};
const fakeReq = (authorization) => ({ get: (name) => (name.toLowerCase() === 'authorization' ? authorization : undefined) });

const runGuard = (authorization) => {
    const res = fakeRes();
    let passed = false;
    requireMetricsToken(fakeReq(authorization), res, () => { passed = true; });
    return { passed, status: res.statusCode };
};

test('the snapshot endpoint is hidden until METRICS_TOKEN is set', () => {
    delete process.env.METRICS_TOKEN;
    assert.deepStrictEqual(runGuard('Bearer anything'), { passed: false, status: 404 });
});

test('the snapshot endpoint needs the exact bearer token', () => {
    process.env.METRICS_TOKEN = 'secret-token';
    assert.deepStrictEqual(runGuard(undefined), { passed: false, status: 401 });
    assert.deepStrictEqual(runGuard('Bearer wrong'), { passed: false, status: 401 });
    assert.deepStrictEqual(runGuard('secret-token'), { passed: false, status: 401 });
    assert.deepStrictEqual(runGuard('Bearer secret-token'), { passed: true, status: 200 });
    delete process.env.METRICS_TOKEN;
});

test('SEO numbers count search referrals and Learn/lyrics page views', () => {
    const seo = seoFrom({
        referrers: [
            { label: 'google.com', value: 10 },
            { label: 'www.google.co.kr', value: 2 },
            { label: 'search.naver.com', value: 1 },
            { label: 'tiktok.com', value: 30 },
            { label: 'googleusercontent.example', value: 5 },
        ],
        pages: [
            { label: '/learn', value: 4 },
            { label: '/learn/particles-eun-neun-vs-i-ga', value: 6 },
            { label: '/learner', value: 99 },
            { label: '/lyrics/iu-blueming', value: 3 },
            { label: '/', value: 50 },
        ],
    });
    assert.deepStrictEqual(seo, { searchReferrals: 13, learnViews: 10, lyricsViews: 3 });
});

test('revenue keeps totals and plans but no customer details', () => {
    const base = {
        available: true,
        currency: 'usd',
        mrr: 19000.4,
        subscribers: { paying: 30, trialing: 1, pastDue: 0, cancelling: 2, newInRange: 3, cancelledInRange: 1 },
        plans: [{ plan: 'Basic', interval: 'monthly', count: 20, mrr: 8000 }],
        mrrHistory: [{ date: new Date(0), mrr: 100.6, subscribers: 1 }],
        revenue: { current: { total: 5000, subscriptions: 4900, oneTime: 100, count: 9 } },
        recentPayments: [{ email: 'someone@example.com' }],
        recentSubscriptions: [{ email: 'someone@example.com' }],
    };
    const month = { ...base, subscribers: { ...base.subscribers, newInRange: 9, cancelledInRange: 4 } };
    const out = revenueFrom(base, month);
    assert.strictEqual(out.mrr, 19000);
    assert.strictEqual(out.new30d, 9);
    assert.strictEqual(out.cancelled7d, 1);
    assert.strictEqual(out.mrrHistory[0].mrr, 101);
    assert.ok(!JSON.stringify(out).includes('@'));
    assert.deepStrictEqual(revenueFrom({ available: false, reason: 'x' }, {}), { available: false, reason: 'x' });
});

test('usage depth buckets weekly breakdowns by who is using them', () => {
    const { usageDepthFrom } = require('../controllers/admin/snapshot');
    const users = new Map([[1, 'free'], [2, 'free'], [3, 'trial'], [4, 'paying']]);
    const rows = [
        { userId: 1, week: 0, count: 2 }, { userId: 1, week: 1, count: 10 },
        { userId: 2, week: 0, count: 4 }, { userId: 3, week: 0, count: 25 },
        { userId: 4, week: 0, count: 7 }, { userId: 9, week: 0, count: 3 },
    ];
    const d = usageDepthFrom(rows, users, [0, 0, 3, 12]);
    assert.deepStrictEqual(d.weekly.free, { userWeeks: 3, '1-2': 1, '3-5': 1, '6-9': 0, '10+': 1, median: 4 });
    assert.strictEqual(d.weekly.trial['10+'], 1);
    assert.strictEqual(d.weekly.paying['6-9'], 1);
    assert.deepStrictEqual(d.endedTrials, { count: 4, '0': 2, '1-4': 1, '5-9': 0, '10-19': 1, '20+': 0 });
});

test('likely bots are US and Singapore laptop visitors with no referrer', async () => {
    const { buildTraffic } = require('../controllers/admin/traffic');
    const { trafficFrom } = require('../controllers/admin/snapshot');
    const saved = { fetch: global.fetch, key: process.env.UMAMI_API_KEY, url: process.env.UMAMI_URL };
    process.env.UMAMI_API_KEY = 'k';
    process.env.UMAMI_URL = 'https://umami.test';
    const seen = [];
    global.fetch = async (href) => {
        const url = new URL(href);
        const q = Object.fromEntries(url.searchParams);
        seen.push(q);
        const ok = (body) => ({ ok: true, status: 200, json: async () => body });
        if (url.pathname.endsWith('/stats')) {
            if (q.device === 'laptop') return ok({ visitors: q.country === 'US' ? 600 : 380 });
            return ok({ pageviews: 2600, visitors: 1300, visits: 1470, bounces: 1220, totaltime: 1 });
        }
        if (url.pathname.endsWith('/metrics') && q.type === 'referrer') {
            if (q.device === 'laptop') return ok(q.country === 'US' ? [{ x: 'google.com', y: 70 }] : []);
            return ok([{ x: 'google.com', y: 200 }]);
        }
        if (url.pathname.endsWith('/pageviews')) return ok({ pageviews: [], sessions: [] });
        return ok([]);
    };
    try {
        const plain = await buildTraffic({ days: 7, tz: 'UTC', now: new Date('2026-11-12T00:00:00Z') });
        assert.strictEqual(plain.likelyBots, null);
        assert.ok(!seen.some((q) => q.device), 'the admin dashboard makes no extra calls');

        const traffic = await buildTraffic({ days: 7, tz: 'UTC', now: new Date('2026-11-12T00:00:00Z'), withBots: true });
        const out = trafficFrom(traffic);
        // US: 600 laptop visitors, 70 came from a referrer; SG: 380, none did.
        assert.strictEqual(out.likelyBotVisitors, 530 + 380);
        assert.strictEqual(out.humanVisitors, 1300 - 910);
        assert.deepStrictEqual(out.likelyBots.byCountry.map((r) => r.direct), [530, 380]);
    } finally {
        global.fetch = saved.fetch;
        for (const [k, v] of [['UMAMI_API_KEY', saved.key], ['UMAMI_URL', saved.url]]) {
            if (v === undefined) delete process.env[k]; else process.env[k] = v;
        }
    }
});

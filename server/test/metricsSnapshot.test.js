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

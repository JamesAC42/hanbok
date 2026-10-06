const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { createAuthRateLimit, clientIp } = require('../utils/authRateLimit');

// Minimal stand-in for the node-redis v4 calls the limiter makes.
const makeRedis = () => {
    const data = new Map();
    const ttls = new Map();
    return {
        data,
        incr: async (key) => { const v = (Number(data.get(key)) || 0) + 1; data.set(key, String(v)); return v; },
        expire: async (key, seconds) => { ttls.set(key, seconds); return true; },
        ttl: async (key) => ttls.get(key) ?? -1,
        get: async (key) => data.get(key) ?? null,
        del: async (key) => { data.delete(key); ttls.delete(key); return 1; },
    };
};

const makeReq = ({ xff, email, remote = '127.0.0.1' } = {}) => ({
    headers: xff ? { 'x-forwarded-for': xff } : {},
    socket: { remoteAddress: remote },
    body: email ? { email } : {},
});

// Runs the middleware, then (if it called next) "responds" with the given status.
const run = async (middleware, req, status = 200) => {
    const res = new EventEmitter();
    res.statusCode = 200;
    res.headers = {};
    res.set = (k, v) => { res.headers[k] = v; return res; };
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (body) => { res.body = body; res.emit('finish'); return res; };
    let calledNext = false;
    await middleware(req, res, () => { calledNext = true; });
    if (calledNext) {
        res.statusCode = status;
        res.emit('finish');
        await new Promise(r => setImmediate(r));
    }
    return { calledNext, res };
};

test('clientIp takes the rightmost public X-Forwarded-For entry', () => {
    assert.equal(clientIp(makeReq({ xff: '203.0.113.9, 127.0.0.1' })), '203.0.113.9');
    // A client-supplied spoofed entry on the left is ignored.
    assert.equal(clientIp(makeReq({ xff: '1.2.3.4, 198.51.100.7, ::ffff:127.0.0.1' })), '198.51.100.7');
    assert.equal(clientIp(makeReq({ xff: '2001:db8::1' })), '2001:db8::1');
    assert.equal(clientIp(makeReq({ remote: '198.51.100.8' })), '198.51.100.8');
    assert.equal(clientIp(makeReq({ remote: '10.0.0.5' })), null);
});

test('per-IP limit is skipped when no public IP is visible', async () => {
    const redis = makeRedis();
    const mw = createAuthRateLimit(() => redis, { name: 't', ip: { max: 1, windowSeconds: 60 } });
    const original = console.warn;
    console.warn = () => {};
    try {
        assert.equal((await run(mw, makeReq())).calledNext, true);
        assert.equal((await run(mw, makeReq())).calledNext, true);
    } finally {
        console.warn = original;
    }
});

test('per-IP limit blocks after max and keeps IPs separate', async () => {
    const redis = makeRedis();
    const mw = createAuthRateLimit(() => redis, { name: 't', ip: { max: 2, windowSeconds: 60 } });
    const a = makeReq({ xff: '203.0.113.1, 127.0.0.1' });
    assert.equal((await run(mw, a)).calledNext, true);
    assert.equal((await run(mw, a)).calledNext, true);
    const blocked = await run(mw, a);
    assert.equal(blocked.calledNext, false);
    assert.equal(blocked.res.statusCode, 429);
    assert.equal(blocked.res.headers['Retry-After'], '60');
    assert.equal((await run(mw, makeReq({ xff: '203.0.113.2, 127.0.0.1' }))).calledNext, true);
});

test('per-email limit is case insensitive', async () => {
    const redis = makeRedis();
    const mw = createAuthRateLimit(() => redis, { name: 't', email: { max: 1, windowSeconds: 60 } });
    assert.equal((await run(mw, makeReq({ email: 'A@x.com' }))).calledNext, true);
    assert.equal((await run(mw, makeReq({ email: ' a@X.com ' }))).res.statusCode, 429);
});

test('failed logins lock the account and a success clears the count', async () => {
    const redis = makeRedis();
    const mw = createAuthRateLimit(() => redis, { name: 't', failures: { max: 2, windowSeconds: 900 } });
    const req = () => makeReq({ email: 'u@x.com' });
    await run(mw, req(), 401);
    await run(mw, req(), 200);
    assert.equal(await redis.get('hanbok:ratelimit:t:fail:u@x.com'), null);
    await run(mw, req(), 401);
    await run(mw, req(), 401);
    const locked = await run(mw, req());
    assert.equal(locked.calledNext, false);
    assert.equal(locked.res.statusCode, 429);
    // Other accounts are unaffected.
    assert.equal((await run(mw, makeReq({ email: 'other@x.com' }))).calledNext, true);
});

test('fails open when redis errors', async () => {
    const broken = { incr: async () => { throw new Error('down'); } };
    const mw = createAuthRateLimit(() => broken, { name: 't', ip: { max: 1, windowSeconds: 60 } });
    const original = console.error;
    console.error = () => {};
    try {
        assert.equal((await run(mw, makeReq())).calledNext, true);
    } finally {
        console.error = original;
    }
});

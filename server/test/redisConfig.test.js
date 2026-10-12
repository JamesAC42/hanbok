const { test } = require('node:test');
const assert = require('node:assert/strict');
const { redisClientOptions, bullRedis } = require('../lib/redisConfig');

test('without REDIS_URL, Redis is local with REDIS_PW as before', () => {
    assert.deepEqual(bullRedis({ REDIS_PW: 'pw' }), { password: 'pw' });
    const opts = redisClientOptions({ REDIS_PW: 'pw' });
    assert.equal(opts.url, undefined);
    assert.equal(opts.password, 'pw');
});

test('a managed rediss:// URL keeps TLS for Bull and node-redis', () => {
    const url = 'rediss://default:s%40cret@db-valkey.example.com:25061/0';
    assert.equal(redisClientOptions({ REDIS_URL: url }).url, url);
    assert.deepEqual(bullRedis({ REDIS_URL: url }), {
        host: 'db-valkey.example.com', port: 25061, username: 'default', password: 's@cret', db: 0, tls: {},
    });
});

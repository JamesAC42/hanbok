const test = require('node:test');
const assert = require('node:assert');

process.env.MONGODB_DB = process.env.MONGODB_DB || 'test';

const { isExtensionRequest, actionFor, extensionVersion, visitorKey, record } = require('../lib/extensionUsage');

const req = ({ method = 'GET', url = '/api/session', headers = {}, query = {} } = {}) => ({
    method, originalUrl: url, url, headers, query, socket: { remoteAddress: '10.0.0.1' },
});

test('recognizes requests from the extension', () => {
    // 1.0.0 POSTs: Chrome adds the extension origin
    assert.ok(isExtensionRequest(req({ method: 'POST', headers: { origin: 'chrome-extension://fmcnjefaokldjlddnakekdokejlpamlc' } })));
    // 1.0.0 GETs: no origin, but Sec-Fetch-Site is none for a fetch
    assert.ok(isExtensionRequest(req({ headers: { 'sec-fetch-site': 'none', 'sec-fetch-mode': 'cors' } })));
    // Later versions say so
    assert.ok(isExtensionRequest(req({ headers: { 'x-hanbok-client': 'extension/1.0.1' } })));
});

test('ignores the site and typed-in URLs', () => {
    assert.ok(!isExtensionRequest(req({ headers: { 'sec-fetch-site': 'same-origin', 'sec-fetch-mode': 'cors', origin: 'https://hanbokstudy.com' } })));
    assert.ok(!isExtensionRequest(req({ headers: { 'sec-fetch-site': 'none', 'sec-fetch-mode': 'navigate' } })));
    assert.ok(!isExtensionRequest(req({ headers: {} })));
});

test('maps extension calls to actions', () => {
    assert.strictEqual(actionFor(req({ method: 'POST', url: '/api/submit' })), 'analyze');
    assert.strictEqual(actionFor(req({ method: 'POST', url: '/api/words' })), 'saveWord');
    assert.strictEqual(actionFor(req({ method: 'POST', url: '/api/sentences/42/save' })), 'saveSentence');
    assert.strictEqual(actionFor(req({ method: 'POST', url: '/api/sentences/42/generate-audio' })), 'audio');
    assert.strictEqual(actionFor(req({ url: '/api/word-audio?word=x' })), 'audio');
    assert.strictEqual(actionFor(req({ url: '/api/word-relations?word=x' })), 'wordDetails');
    assert.strictEqual(actionFor(req({ url: '/api/session' })), 'open');
    // Only the first page of a word sync counts
    assert.strictEqual(actionFor(req({ url: '/api/words?page=1', query: { page: '1' } })), 'sync');
    assert.strictEqual(actionFor(req({ url: '/api/words?page=2', query: { page: '2' } })), null);
    assert.strictEqual(actionFor(req({ url: '/api/quota' })), null);
});

test('reads the version and hashes signed-out visitors', () => {
    assert.strictEqual(extensionVersion(req({ headers: { 'x-hanbok-client': 'extension/1.0.1' } })), '1.0.1');
    assert.strictEqual(extensionVersion(req({ headers: { 'x-hanbok-client': 'extension/<script>' } })), null);
    const key = visitorKey(req({ headers: { 'x-forwarded-for': '1.2.3.4, 10.0.0.1' } }));
    assert.match(key, /^[0-9a-f]{16}$/);
    assert.ok(!key.includes('1.2.3.4'));
    assert.strictEqual(key, visitorKey(req({ headers: { 'x-forwarded-for': '1.2.3.4' } })));
});

test('records an event and stamps the user', async () => {
    const calls = [];
    const db = { collection: (name) => ({
        insertOne: async (doc) => calls.push([name, 'insert', doc]),
        updateOne: async (filter, update) => calls.push([name, 'update', filter, update]),
    }) };
    const at = new Date('2026-10-10T12:00:00Z');
    await record(db, { userId: 7, visitor: 'abc', action: 'analyze', version: '1.0.1', at });
    assert.deepStrictEqual(calls[0], ['extension_events', 'insert', { at, userId: 7, visitor: null, action: 'analyze', version: '1.0.1' }]);
    assert.deepStrictEqual(calls[1], ['users', 'update', { userId: 7 }, { $min: { extensionFirstSeen: at }, $max: { extensionLastSeen: at }, $set: { extensionVersion: '1.0.1' } }]);

    calls.length = 0;
    await record(db, { userId: null, visitor: 'abc', action: 'open', version: null, at });
    assert.strictEqual(calls.length, 1);
    assert.strictEqual(calls[0][2].visitor, 'abc');
});

const test = require('node:test');
const assert = require('node:assert');
const { sanitizeAttribution } = require('../utils/attribution');

test('keeps known keys and trims values', () => {
    const result = sanitizeAttribution({ utm_source: ' tiktok ', referrer: 'https://www.tiktok.com/' });
    assert.deepStrictEqual(result, { utm_source: 'tiktok', referrer: 'https://www.tiktok.com/' });
});

test('drops unknown keys, non-strings and empty values', () => {
    const result = sanitizeAttribution({ utm_source: 'reddit', tier: 2, $set: 'x', utm_medium: '   ', utm_campaign: { a: 1 } });
    assert.deepStrictEqual(result, { utm_source: 'reddit' });
});

test('caps value length', () => {
    const result = sanitizeAttribution({ utm_campaign: 'a'.repeat(500) });
    assert.strictEqual(result.utm_campaign.length, 200);
});

test('returns null for missing or invalid input', () => {
    assert.strictEqual(sanitizeAttribution(undefined), null);
    assert.strictEqual(sanitizeAttribution('tiktok'), null);
    assert.strictEqual(sanitizeAttribution(['utm_source']), null);
    assert.strictEqual(sanitizeAttribution({ foo: 'bar' }), null);
});

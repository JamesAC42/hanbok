import test from 'node:test';
import assert from 'node:assert';
import { normalizeDepth, explanationsAt, fetchGrammarDepth, clearGrammarDepth } from '../src/lib/grammarDepth.js';

const points = [{ explanation: 'a' }, { explanation: 'b' }];

test('unknown depths fall back to standard', () => {
    assert.strictEqual(normalizeDepth('detailed'), 'detailed');
    assert.strictEqual(normalizeDepth('deep'), 'standard');
    assert.strictEqual(normalizeDepth(null), 'standard');
});

test('rewrites replace explanations only when they line up', () => {
    assert.deepStrictEqual(explanationsAt(points, ['A', 'B']), ['A', 'B']);
    assert.deepStrictEqual(explanationsAt(points, ['A']), ['a', 'b']);
    assert.deepStrictEqual(explanationsAt(points, ['A', '']), ['A', 'b']);
    assert.deepStrictEqual(explanationsAt(points, null), ['a', 'b']);
});

test('fetches once per sentence and depth, and retries after a failure', async () => {
    clearGrammarDepth();
    let calls = 0;
    const ok = async (url) => { calls++; assert.match(url, /sentence=abc&depth=simple/); return { ok: true, json: async () => ({ success: true, explanations: ['x'] }) }; };
    assert.deepStrictEqual(await fetchGrammarDepth('abc', 'simple', ok), ['x']);
    assert.deepStrictEqual(await fetchGrammarDepth('abc', 'simple', ok), ['x']);
    assert.strictEqual(calls, 1);
    const bad = async () => ({ ok: false, json: async () => ({ success: false, error: 'no' }) });
    await assert.rejects(fetchGrammarDepth('abc', 'detailed', bad));
    assert.deepStrictEqual(await fetchGrammarDepth('abc', 'detailed', async () => ({ ok: true, json: async () => ({ success: true, explanations: ['y'] }) })), ['y']);
});

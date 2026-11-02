import test from 'node:test';
import assert from 'node:assert';
import { canFetchEncounters, fitSummary, encounterLine, fetchEncounters, clearEncounters } from '../src/lib/encounters.js';

test('only for signed-in learners on saved sentences', () => {
    assert.strictEqual(canFetchEncounters(12, true), true);
    assert.strictEqual(canFetchEncounters('12', false), false);
    assert.strictEqual(canFetchEncounters('abc123', true), false);
    assert.strictEqual(canFetchEncounters(null, true), false);
});

test('fit summary wording', () => {
    assert.deepStrictEqual(fitSummary({ verdict: 'just_right', newWords: ['a', 'b'], newGrammar: 1 }),
        { headline: 'Just right for you', detail: '2 new words, 1 new grammar point', verdict: 'just_right' });
    assert.strictEqual(fitSummary({ verdict: 'review', newWords: [], newGrammar: 0 }).detail, 'You have met every word and grammar point before');
    assert.strictEqual(fitSummary(null), null);
});

test('encounter line', () => {
    assert.strictEqual(encounterLine({ count: 0 }), 'New to you');
    assert.strictEqual(encounterLine({ count: 1 }), "You've met this once before");
    assert.strictEqual(encounterLine({ count: 4 }), "You've met this 4 times before");
});

test('fetch is cached per sentence', async () => {
    clearEncounters();
    let calls = 0;
    const f = async () => { calls++; return { ok: true, json: async () => ({ success: true, grammar: [] }) }; };
    await fetchEncounters(5, f);
    await fetchEncounters('5', f);
    assert.strictEqual(calls, 1);
});

import test from 'node:test';
import assert from 'node:assert';
import { canLookUp, lookupParams, fetchDictionary, clearDictionaryCache } from '../src/lib/dictionary.js';

test('looks up Korean words, not particles or other languages', () => {
    assert.strictEqual(canLookUp({ dictionary_form: '학교', type: 'noun' }, 'ko'), true);
    assert.strictEqual(canLookUp({ isParticle: true, particle: '는' }, 'ko'), false);
    assert.strictEqual(canLookUp({ dictionary_form: '学校' }, 'ja'), false);
    assert.strictEqual(canLookUp({ dictionary_form: '.', type: 'punctuation' }, 'ko'), false);
});

test('sends the word, type and meaning', () => {
    const p = lookupParams({ dictionary_form: ' 배 ', type: 'noun', meaning: { description: 'boat' } }, 'ja');
    assert.strictEqual(p.get('word'), '배');
    assert.strictEqual(p.get('type'), 'noun');
    assert.strictEqual(p.get('meaning'), 'boat');
    assert.strictEqual(p.get('lang'), 'ja');
});

test('caches lookups and retries after a failure', async () => {
    clearDictionaryCache();
    let calls = 0;
    let fail = true;
    const fetchImpl = async () => {
        calls++;
        if (fail) return { ok: false, json: async () => ({ success: false }) };
        return { ok: true, json: async () => ({ success: true, available: true, entry: { word: '학교' } }) };
    };
    const w = { dictionary_form: '학교', type: 'noun' };
    await assert.rejects(fetchDictionary(w, 'en', fetchImpl));
    fail = false;
    assert.deepStrictEqual(await fetchDictionary(w, 'en', fetchImpl), { word: '학교' });
    await fetchDictionary(w, 'en', fetchImpl);
    assert.strictEqual(calls, 2);
});

test('no key on the server means no entry', async () => {
    clearDictionaryCache();
    const fetchImpl = async () => ({ ok: true, json: async () => ({ success: true, available: false, entry: null }) });
    assert.strictEqual(await fetchDictionary({ dictionary_form: '배' }, 'en', fetchImpl), null);
});

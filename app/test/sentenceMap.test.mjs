import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildMap } from '../src/lib/sentenceMap.js';

const components = ['비가', '와서', '오늘은', '집에', '있을', '거예요', '.'].map(text => ({ text, type: text === '.' ? 'punctuation' : 'word' }));

test('groups components into chunks in sentence order', () => {
    const map = buildMap({
        components,
        chunks: [
            { components: ['4', '5'], role: 'Main verb', gloss: 'will stay' },
            { components: ['0', '1'], role: 'Reason', gloss: 'because it rains' },
            { components: ['2'], role: 'Topic', gloss: 'today' },
            { components: ['3'], role: 'Where', gloss: 'at home' },
        ],
    });
    assert.deepEqual(map.map(g => g.role), ['Reason', 'Topic', 'Where', 'Main verb']);
    assert.deepEqual(map[0].words, ['비가', '와서']);
});

test('drops bad indexes and puts missed words back', () => {
    const map = buildMap({
        components,
        chunks: [
            { components: ['0', '1', '99'], role: 'Reason' },
            { components: ['1', '6'], role: 'Dup' },
            { components: ['4', '5'], role: 'Main verb' },
        ],
    });
    assert.deepEqual(map.map(g => g.words.join(' ')), ['비가 와서', '오늘은', '집에', '있을 거예요']);
});

test('returns null for old analyses without chunks', () => {
    assert.equal(buildMap({ components }), null);
});

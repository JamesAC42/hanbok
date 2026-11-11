const test = require('node:test');
const assert = require('node:assert');
const { wordTimings } = require('../lib/karaoke');

test('groups characters into space-separated words with start and end', () => {
    const chars = [...'비가 와서.'];
    const starts = [0, 0.2, 0.3, 0.34, 0.44, 0.57];
    const ends = [0.2, 0.3, 0.34, 0.44, 0.57, 0.6];
    assert.deepStrictEqual(
        wordTimings({ characters: chars, character_start_times_seconds: starts, character_end_times_seconds: ends }),
        [{ text: '비가', start: 0, end: 0.3 }, { text: '와서.', start: 0.34, end: 0.6 }],
    );
});

test('copes with missing or empty alignment', () => {
    assert.deepStrictEqual(wordTimings(null), []);
    assert.deepStrictEqual(wordTimings({ characters: [' ', ' '] }), []);
});

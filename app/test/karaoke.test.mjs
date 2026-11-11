import test from 'node:test';
import assert from 'node:assert';
import { activeWordAt, shadowPhrases, repeatGapMs } from '../src/lib/karaoke.js';

const words = [
    { text: '비가', start: 0, end: 0.3 },
    { text: '와서', start: 0.34, end: 0.6 },
    { text: '오늘은', start: 0.7, end: 1.1 },
    { text: '집에서', start: 1.2, end: 1.6 },
    { text: '쉬고', start: 1.7, end: 2.0 },
    { text: '싶어요.', start: 2.05, end: 2.6 },
];

test('lights the word being spoken and keeps it lit in the gaps', () => {
    assert.strictEqual(activeWordAt(words, -0.1), -1);
    assert.strictEqual(activeWordAt(words, 0.1), 0);
    assert.strictEqual(activeWordAt(words, 0.32), 0);
    assert.strictEqual(activeWordAt(words, 2.5), 5);
    assert.strictEqual(activeWordAt(words, 9), 5);
});

test('splits into short phrases at punctuation or length', () => {
    const p = shadowPhrases(words);
    assert.deepStrictEqual(p.map(x => [x.from, x.to]), [[0, 2], [3, 5]]);
    const withComma = shadowPhrases([{ text: '네,', start: 0, end: 0.3 }, ...words.slice(0, 2)]);
    assert.deepStrictEqual(withComma.map(x => [x.from, x.to]), [[0, 0], [1, 2]]);
});

test('repeat gaps scale with the phrase and playback speed', () => {
    assert.strictEqual(repeatGapMs({ start: 0, end: 0.2 }), 1500);
    assert.strictEqual(repeatGapMs({ start: 0, end: 1.2 }), 2400);
    assert.strictEqual(repeatGapMs({ start: 0, end: 1.2 }, 0.75), 3000);
});

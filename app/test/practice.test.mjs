import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPractice } from '../src/lib/practice.js';

const analysis = {
    sentence: { original: '한국에 가기 전에 한국어를 더 열심히 공부하고 싶어요.', translation: 'I want to study Korean harder before going to Korea.' },
    components: [
        { text: '한국에', type: 'noun', meaning: { description: 'Korea' }, grammar: { particles: [{ particle: '에', function: 'to (a place)' }] } },
        { text: '가기', type: 'verb', meaning: { description: 'going' } },
        { text: '전에', type: 'noun', meaning: { description: 'before' } },
        { text: '한국어를', type: 'noun', meaning: { description: 'Korean (language)' }, grammar: { particles: [{ particle: '를 (object particle)', function: 'marks the object' }] } },
        { text: '더', type: 'adverb', meaning: { description: 'more' } },
        { text: '열심히', type: 'adverb', meaning: { description: 'hard, diligently' } },
        { text: '공부하고', type: 'verb', meaning: { description: 'study' } },
        { text: '싶어요', type: 'auxiliary_verb', meaning: { description: 'want to' } },
        { text: '.', type: 'punctuation' },
    ],
};

test('builds order, particle and meaning drills from an analysis', () => {
    const ex = buildPractice(analysis, 'ko');
    assert.deepEqual(ex.map(e => e.kind), ['order', 'particle', 'meaning']);

    const order = ex[0];
    assert.equal(order.answer.length, 8);
    assert.notDeepEqual(order.tiles, order.answer);
    assert.deepEqual([...order.tiles].sort(), [...order.answer].sort());

    const particle = ex[1];
    assert.equal(particle.answer, '에');
    assert.equal(particle.before, '한국');
    assert.ok(particle.after.startsWith(' 가기'));
    assert.equal(particle.options.length, 3);
    assert.ok(particle.options.includes('에'));

    const meaning = ex[2];
    assert.equal(meaning.options.length, 3);
    assert.ok(meaning.options.includes(meaning.answer));
});

test('is the same every time for the same sentence', () => {
    assert.deepEqual(buildPractice(analysis), buildPractice(analysis));
});

test('skips drills it cannot build', () => {
    const one = { sentence: { original: '네', translation: 'Yes' }, components: [{ text: '네', type: 'interjection' }] };
    assert.deepEqual(buildPractice(one), []);
});

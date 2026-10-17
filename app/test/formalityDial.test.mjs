import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDial, formalityRank, markChanges } from '../src/lib/formalityDial.js';

test('orders variants from casual to formal with the original in place', () => {
    const dial = buildDial({
        sentence: { original: '비가 와서 오늘은 집에 있을 거예요.', formality: 'Polite (해요체)' },
        variants: {
            Formal: { text: '비가 와서 오늘은 집에 있을 것입니다', when_to_use: 'Presentations' },
            Casual: { text: '비가 와서 오늘은 집에 있을 거야', when_to_use: 'Friends' },
        },
    });
    assert.deepEqual(dial.stops.map(s => s.label), ['Casual', 'Your sentence', 'Formal']);
    assert.equal(dial.start, 1);
    const casual = dial.stops[0].words;
    assert.deepEqual(casual.filter(w => w.changed).map(w => w.word), ['거야']);
});

test('uses a variant that repeats the original instead of adding a stop', () => {
    const dial = buildDial({
        sentence: { original: '진짜 맛있어요.' },
        variants: { Polite: { text: '진짜 맛있어요' }, Casual: { text: '진짜 맛있어' } },
    });
    assert.deepEqual(dial.stops.map(s => s.label), ['Casual', 'Polite']);
    assert.equal(dial.start, 1);
});

test('reads ranks from labels and leaves unknown ones in the middle', () => {
    assert.equal(formalityRank('Informal'), 0);
    assert.equal(formalityRank('Formal'), 2);
    assert.equal(formalityRank('Polite'), 1);
    assert.equal(formalityRank('Written'), 3);
    assert.equal(formalityRank('Gen Z'), null);
});

test('marks only the changed words', () => {
    assert.deepEqual(markChanges('a b c', 'a b c').filter(w => w.changed), []);
    assert.deepEqual(markChanges('a x c', 'a b c').map(w => w.changed), [false, true, false]);
});

test('returns null without variants', () => {
    assert.equal(buildDial({ sentence: { original: '네' } }), null);
    assert.equal(buildDial({ sentence: { original: '네' }, variants: {} }), null);
});

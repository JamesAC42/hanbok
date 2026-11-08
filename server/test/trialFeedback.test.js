const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildUpdate, summarizeTrialFeedback } = require('../controllers/trialFeedback');

const NOW = new Date('2026-11-08T12:00:00Z');

test('accepts a known reason and an optional trimmed note', () => {
    const u = buildUpdate({ reason: 'price', note: '  too much for a student  ' }, { tier: 0, autoTrial: { source: 'returning' } }, NOW);
    assert.equal(u.$set.reason, 'price');
    assert.equal(u.$set.note, 'too much for a student');
    assert.equal(u.$set.trialSource, 'returning');
    assert.equal(buildUpdate({ reason: 'missing' }, { tier: 0, autoTrial: {} }, NOW).$set.trialSource, 'signup');
    assert.equal(buildUpdate({ reason: 'other', note: '   ' }, null, NOW).$set.note, undefined);
    assert.equal(buildUpdate({ reason: 'other', note: 'x'.repeat(900) }, null, NOW).$set.note.length, 500);
});

test('rejects unknown reasons', () => {
    assert.equal(buildUpdate({ reason: 'nope' }, null, NOW), null);
    assert.equal(buildUpdate({}, null, NOW), null);
});

test('summary counts reasons and lists the newest first', () => {
    const s = summarizeTrialFeedback([
        { userId: 1, reason: 'price', answeredAt: new Date('2026-11-01') },
        { userId: 2, reason: 'price', answeredAt: new Date('2026-11-03'), note: 'student' },
        { userId: 3, reason: 'missing', answeredAt: new Date('2026-11-02') },
    ]);
    assert.equal(s.answered, 3);
    assert.equal(s.reasons.price, 2);
    assert.equal(s.reasons.missing, 1);
    assert.equal(s.reasons.didntNotice, 0);
    assert.deepEqual(s.recent.map((r) => r.userId), [2, 3, 1]);
    assert.equal(s.recent[0].note, 'student');
});

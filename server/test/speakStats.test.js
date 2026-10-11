const test = require('node:test');
const assert = require('node:assert');

// database.js reads these when it is first required.
process.env.MONGODB_DB = process.env.MONGODB_DB || 'test';

const { summarizeSpeak } = require('../controllers/admin/speakStats');
const { cleanEvent } = require('../lib/speakEvents');

const from = new Date('2026-10-01T00:00:00Z');
const to = new Date('2026-10-08T00:00:00Z');
const call = (fields) => ({
    sessionId: `s${Math.random().toString(16).slice(2, 10)}`,
    scenarioId: 'cafe',
    character: 'horang',
    level: 'beginner',
    assist: 'guided',
    engine: 'live',
    tier: 0,
    startedAt: new Date('2026-10-02T10:00:00Z'),
    endedAt: new Date('2026-10-02T10:04:00Z'),
    billedSeconds: 240,
    endReason: 'complete',
    youLines: 4,
    charLines: 5,
    goals: [true, true, true],
    ...fields,
});

test('summarizeSpeak counts real conversations, cleared scenes and returning speakers', () => {
    const calls = [
        call({ userId: 1 }),
        call({ userId: 1, startedAt: new Date('2026-10-04T10:00:00Z'), youLines: 1, goals: [true, false, false], endReason: 'user' }),
        call({ userId: 2, youLines: 0, charLines: 2, goals: [false, false, false], endReason: 'dropped:ice', billedSeconds: 30 }),
        call({ userId: 3, charLines: 0, youLines: 0, goals: [], endReason: 'user', billedSeconds: 20 }),
    ];
    const events = [
        { type: 'picker_view', userId: 4, at: from },
        { type: 'picker_view', visitorId: 'abc123', at: from },
        { type: 'breakdown', userId: 1, sessionId: calls[0].sessionId, at: from },
        { type: 'grammar_save', userId: 1, sessionId: calls[0].sessionId, at: from },
        { type: 'upsell_click', userId: 2, meta: { where: 'transcript_result' }, at: from },
    ];
    const s = summarizeSpeak({
        calls, events, from, to,
        users: [{ userId: 1, name: 'A', tier: 1 }, { userId: 2, name: 'B', tier: 0 }],
        firstCallTier: new Map([[1, 0], [2, 0]]),
    });

    assert.strictEqual(s.tiles.calls.value, 4);
    assert.strictEqual(s.tiles.speakers.value, 1);
    assert.strictEqual(s.tiles.realRate.value, 0.25);
    assert.strictEqual(s.tiles.clearRate.value, 0.25);
    assert.strictEqual(s.tiles.returning, 1);
    const funnel = Object.fromEntries(s.funnel.map((f) => [f.key, f.people]));
    assert.deepStrictEqual(funnel, { saw: 4, started: 3, heard: 2, spoke: 1, real: 1, cleared: 1, after: 1, returned: 1 });
    assert.strictEqual(s.anonVisitors, 1);
    assert.strictEqual(s.health.silentCalls, 2);
    assert.strictEqual(s.health.neverHeard, 1);
    assert.strictEqual(s.health.dropped, 1);
    assert.strictEqual(s.money.upgradedAfterSpeaking, 1);
    assert.strictEqual(s.recent[0].tools + s.recent.reduce((n, r) => n + r.tools, 0) >= 2, true);
    assert.deepStrictEqual(s.promo.upsellWhere, [{ key: 'transcript_result', count: 1 }]);
    assert.strictEqual(s.daily.reduce((n, d) => n + d.calls, 0), 4);
    assert.strictEqual(s.topSpeakers[0].userId, 1);
    assert.strictEqual(s.endReasons.find((r) => r.key === 'dropped').count, 1);
});

test('cleanEvent keeps known types and drops everything else', () => {
    assert.strictEqual(cleanEvent({ type: 'nope' }), null);
    const doc = cleanEvent({ type: 'breakdown', sessionId: 'abcdef0123456789abcdef01', userId: 5, tier: 0, meta: { where: 'x', evil: { $gt: 1 }, left: 3 } });
    assert.strictEqual(doc.type, 'breakdown');
    assert.strictEqual(doc.userId, 5);
    assert.deepStrictEqual(doc.meta, { where: 'x', left: 3 });
    const anon = cleanEvent({ type: 'picker_view', sessionId: 'not hex!', visitorId: 'v-123456' });
    assert.strictEqual(anon.userId, null);
    assert.strictEqual(anon.sessionId, undefined);
    assert.strictEqual(anon.visitorId, 'v-123456');
    assert.strictEqual(cleanEvent({ type: 'constructor' }), null);
});

test('summarizeSpeak lists problem reports and refunded minutes', () => {
    const at = new Date('2026-10-03T10:00:00Z');
    const calls = [
        call({ userId: 1, feedback: { ok: true, issues: [], note: '', at } }),
        call({ userId: 2, endReason: 'dropped:ice', refundedSeconds: 240, feedback: { ok: false, issues: ['dropped', 'cant_hear'], note: 'cut out', at } }),
        call({ userId: 3, feedback: { ok: false, issues: [], note: '', at } }),
        call({ userId: 4 }),
    ];
    const events = calls.map((c) => ({ type: 'survey_view', userId: c.userId, sessionId: c.sessionId, at }));
    const s = summarizeSpeak({ calls, events, from, to, users: [{ userId: 2, name: 'B' }], firstCallTier: new Map() });
    assert.strictEqual(s.reports.asked, 4);
    assert.strictEqual(s.reports.answered, 3);
    assert.strictEqual(s.reports.ok, 1);
    assert.strictEqual(s.reports.problems, 2);
    assert.strictEqual(s.reports.refundedSeconds, 240);
    assert.deepStrictEqual(s.reports.issues.map((i) => i.key).sort(), ['cant_hear', 'dropped', 'none picked']);
    const b = s.reports.list.find((r) => r.userId === 2);
    assert.strictEqual(b.name, 'B');
    assert.strictEqual(b.note, 'cut out');
    assert.strictEqual(b.refunded, true);
    assert.strictEqual(s.recent.filter((r) => r.feedback === 'problem').length, 2);
});

test('a refunded call stops counting against the allowance', () => {
    const { secondsUsed } = require('../speak/limits');
    assert.strictEqual(secondsUsed({ billedSeconds: 240 }), 240);
    assert.strictEqual(secondsUsed({ billedSeconds: 240, refundedSeconds: 240 }), 0);
});

const test = require('node:test');
const assert = require('node:assert');
const { parsePartialJson } = require('../lib/partialJson');
const { createAnalysisStream, previewOf } = require('../lib/analysisStream');

const full = JSON.stringify({
    isValid: true,
    analysis: {
        sentence: { original: '학교에 가요.', translation: 'I go to school, "really".', formality: 'polite' },
        components: [
            { text: '학교에', dictionary_form: '학교', type: 'noun', meaning: { description: 'school', notes: 'a, b' } },
            { text: '가요', dictionary_form: '가다', type: 'verb', meaning: { description: 'go' } },
        ],
        grammar_points: [],
    },
});

test('every prefix parses to something sensible or null', () => {
    let lastComponents = 0;
    for (let i = 0; i <= full.length; i++) {
        const p = parsePartialJson(full.slice(0, i));
        if (p === null) continue;
        assert.strictEqual(typeof p, 'object');
        const n = p.analysis?.components?.length || 0;
        assert.ok(n >= lastComponents - 0, 'components never disappear');
        lastComponents = Math.max(lastComponents, n);
    }
    assert.deepStrictEqual(parsePartialJson(full), JSON.parse(full));
});

test('strings with commas, quotes and brackets do not confuse the cut', () => {
    const cut = full.indexOf('really') + 3;
    const p = parsePartialJson(full.slice(0, cut));
    assert.strictEqual(p.analysis.sentence.original, '학교에 가요.');
    assert.strictEqual(p.analysis.sentence.translation, undefined);
});

test('nothing usable yet', () => {
    assert.strictEqual(parsePartialJson(''), null);
    assert.strictEqual(parsePartialJson('```json\n'), null);
    assert.deepStrictEqual(parsePartialJson('```json\n{"isVa'), {});
});

test('preview keeps only finished components and small fields', () => {
    const half = full.slice(0, full.lastIndexOf('가요') + 4);
    const preview = previewOf(parsePartialJson(half).analysis);
    assert.strictEqual(preview.sentence.translation, 'I go to school, "really".');
    assert.deepStrictEqual(preview.components, [{ text: '학교에', dictionary_form: '학교', type: 'noun', meaning: { description: 'school' } }]);
    assert.strictEqual(previewOf({}), null);
});

const fakeRes = () => {
    const out = { headers: {}, chunks: [], status: null, json: null, ended: false };
    return {
        out,
        status(s) { out.status = s; return this; },
        json(b) { out.json = b; return this; },
        setHeader(k, v) { out.headers[k] = v; },
        flushHeaders() {},
        write(c) { out.chunks.push(c); },
        end() { out.ended = true; },
    };
};

test('stream: plain JSON when nothing was streamed', () => {
    const res = fakeRes();
    const s = createAnalysisStream(res);
    s.send({ message: { isValid: false } }, 429);
    assert.strictEqual(res.out.status, 429);
    assert.deepStrictEqual(res.out.json, { message: { isValid: false } });
    assert.strictEqual(res.out.chunks.length, 0);
});

test('stream: throttled partial lines then a done line', () => {
    const res = fakeRes();
    let t = 1000;
    const s = createAnalysisStream(res, { now: () => t });
    s.onText(full.slice(0, full.indexOf('formality')));
    s.onText(full.slice(0, full.lastIndexOf('가요') + 4)); // too soon, skipped
    t += 300;
    s.onText(full.slice(0, full.lastIndexOf('가요') + 4));
    t += 300;
    s.onText(full.slice(0, full.lastIndexOf('가요') + 4)); // nothing new, skipped
    s.send({ message: { isValid: true }, sentenceId: 5 });
    const lines = res.out.chunks.join('').trim().split('\n').map(l => JSON.parse(l));
    assert.strictEqual(res.out.headers['Content-Type'], 'application/x-ndjson; charset=utf-8');
    assert.deepStrictEqual(lines.map(l => l.type), ['partial', 'partial', 'done']);
    assert.strictEqual(lines[0].analysis.components.length, 0);
    assert.strictEqual(lines[1].analysis.components.length, 1);
    assert.deepStrictEqual(lines[2], { type: 'done', status: 200, message: { isValid: true }, sentenceId: 5 });
    assert.ok(res.out.ended);
});

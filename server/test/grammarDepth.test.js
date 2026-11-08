const test = require('node:test');
const assert = require('node:assert');
const { buildDepthPrompt, parseDepthResponse, createGrammarDepth, isDepth } = require('../lib/grammarDepth');

const sentence = () => ({
    sentenceId: 7, text: '학교에 가고 싶어요.', originalLanguage: 'ko', translationLanguage: 'es',
    analysis: {
        sentence: { original: '학교에 가고 싶어요.', translation: 'Quiero ir a la escuela.' },
        grammar_points: [
            { pattern: '-고 싶다', explanation: 'Expresa deseo.' },
            { pattern: '-에', explanation: 'Marca el destino.' },
        ],
    },
});

const fakeDb = () => {
    const writes = [];
    return { writes, getDb: () => ({ collection: () => ({ updateOne: async (q, u) => { writes.push([q, u]); } }) }) };
};

test('prompt names the languages, the depth guide and every point', () => {
    const p = buildDepthPrompt(sentence(), 'simple');
    assert.match(p, /spanish-speaking learners of korean/i);
    assert.match(p, /beginner/);
    assert.match(p, /exactly 2 explanations/);
    assert.match(p, /1\. -고 싶다/);
    assert.match(p, /2\. -에/);
});

test('responses must line up with the points', () => {
    assert.deepStrictEqual(parseDepthResponse({ explanations: [' a ', 'b'] }, 2), ['a', 'b']);
    assert.strictEqual(parseDepthResponse({ explanations: ['a'] }, 2), null);
    assert.strictEqual(parseDepthResponse({ explanations: ['a', ''] }, 2), null);
    assert.strictEqual(parseDepthResponse('nope', 2), null);
    assert.ok(isDepth('detailed') && !isDepth('deep'));
});

test('standard returns the analysis as written without calling the model', async () => {
    const db = fakeDb();
    const svc = createGrammarDepth({ getDb: db.getDb, generate: async () => { throw new Error('called'); } });
    assert.deepStrictEqual(await svc.explanationsFor(sentence(), 'standard'), ['Expresa deseo.', 'Marca el destino.']);
});

test('generates once, stores it, and reuses what is stored', async () => {
    const db = fakeDb();
    let calls = 0;
    const svc = createGrammarDepth({ getDb: db.getDb, generate: async () => { calls++; return { explanations: ['A', 'B'] }; } });
    const s = sentence();
    const [a, b] = await Promise.all([svc.explanationsFor(s, 'detailed'), svc.explanationsFor(s, 'detailed')]);
    assert.deepStrictEqual(a, ['A', 'B']);
    assert.deepStrictEqual(b, ['A', 'B']);
    assert.strictEqual(calls, 1);
    assert.deepStrictEqual(db.writes[0], [{ sentenceId: 7 }, { $set: { 'grammarDepth.detailed': ['A', 'B'] } }]);
    s.grammarDepth = { simple: ['x', 'y'] };
    assert.deepStrictEqual(await svc.explanationsFor(s, 'simple'), ['x', 'y']);
    assert.strictEqual(calls, 1);
});

test('a mismatched answer is an error and is not stored', async () => {
    const db = fakeDb();
    const svc = createGrammarDepth({ getDb: db.getDb, generate: async () => ({ explanations: ['only one'] }) });
    await assert.rejects(svc.explanationsFor(sentence(), 'simple'));
    assert.strictEqual(db.writes.length, 0);
});

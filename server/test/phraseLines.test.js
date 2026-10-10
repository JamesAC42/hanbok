const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { ObjectId } = require('mongodb');

// In-memory stand-in for the three collections the phrase index reads.
const inList = (value, cond) => (cond && cond.$in ? cond.$in.map(String).includes(String(value)) : String(value) === String(cond));
let data;
const db = {
    collection: (name) => ({
        find: (query) => ({
            toArray: async () => data[name].filter((d) => Object.entries(query).every(([k, cond]) => inList(d[k], cond))),
        }),
    }),
};
require.cache[path.resolve(__dirname, '../database.js')] = {
    id: 'database', filename: 'database', loaded: true,
    exports: { getDb: () => db },
};
const { getPhraseLines, findLines, resetIndex } = require('../controllers/lyrics/phraseLines');

const songA = new ObjectId();
const songB = new ObjectId();
const draft = new ObjectId();
const lines = (items) => JSON.stringify(items.map(([sentenceId, text]) => ({ sentenceId, text, lines: [1] })));

const reset = () => {
    resetIndex();
    data = {
        lyrics: [
            { _id: songA, lyricId: 'a-song', title: 'Song A', artist: 'Artist A', published: true, language: 'ko' },
            { _id: songB, lyricId: 'b-song', title: 'Song B', artist: 'Artist B', published: true, language: 'ko' },
            { _id: draft, lyricId: 'draft-song', title: 'Draft', artist: 'X', published: false, language: 'ko' },
        ],
        lyrics_analysis: [
            { lyricId: songA.toString(), language: 'en', analysisData: lines([[1, '대박 오늘 밤'], [2, '대박 오늘 밤'], [3, '정말 대박이야']]) },
            { lyricId: songB.toString(), language: 'en', analysisData: lines([[4, '형 나 왔어'], [5, '모형 비행기'], [6, '대박!']]) },
            { lyricId: draft.toString(), language: 'en', analysisData: lines([[7, '대박 비밀']]) },
        ],
        sentences: [1, 2, 3, 4, 5, 6, 7].map((sentenceId) => ({ sentenceId, analysis: { sentence: { translation: `translation ${sentenceId}` } } })),
    };
};

const call = async (query) => {
    let status = 200;
    let json;
    const res = { status(code) { status = code; return this; }, json(value) { json = value; } };
    await getPhraseLines({ query }, res);
    return { status, json };
};

test('finds lines from published songs, one per song first, with translations', async () => {
    reset();
    const { status, json } = await call({ q: '대박', limit: '3' });
    assert.equal(status, 200);
    assert.deepEqual(json.lines.map((l) => [l.lyricId, l.text]), [
        ['a-song', '대박 오늘 밤'],
        ['b-song', '대박!'],
        ['a-song', '정말 대박이야'],
    ]);
    assert.equal(json.lines[0].translation, 'translation 1');
    assert.equal(json.lines[0].title, 'Song A');
});

test('the phrase must start a word', async () => {
    reset();
    const { json } = await call({ q: '형' });
    assert.deepEqual(json.lines.map((l) => l.text), ['형 나 왔어']);
});

test('rejects empty, long or non-Korean queries', async () => {
    reset();
    assert.equal((await call({ q: '' })).status, 400);
    assert.equal((await call({ q: 'hello' })).status, 400);
    assert.equal((await call({ q: '가'.repeat(21) })).status, 400);
});

test('lines without a translation are skipped', () => {
    const found = findLines([{ lyricId: 'x', text: '대박', translation: '' }], '대박', 4);
    assert.equal(found.length, 0);
});

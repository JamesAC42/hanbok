const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { createKrdict, parseSearch, pickEntry, hanjaOf, familyFrom } = require('../lib/krdict');
const { shapeForTier } = require('../controllers/words/dictionary');

const fixture = (name) => fs.readFileSync(path.join(__dirname, 'fixtures/krdict', name), 'utf8');

test('parses a krdict search response', () => {
    const [entry] = parseSearch(fixture('search-hakgyo.xml'));
    assert.strictEqual(entry.word, '학교');
    assert.strictEqual(entry.origin, '學校');
    assert.strictEqual(entry.level, 'beginner');
    assert.strictEqual(entry.pos, '명사');
    assert.strictEqual(entry.pronunciation, '학꾜');
    assert.deepStrictEqual(entry.hanja, [{ char: '學', reading: '학' }, { char: '校', reading: '교' }]);
    assert.strictEqual(entry.senses[0].translation, 'school');
});

test('decodes entities outside CDATA and keeps repeated items', () => {
    const entries = parseSearch(fixture('search-bae.xml'));
    assert.strictEqual(entries.length, 3);
    assert.strictEqual(entries[2].senses[0].translationDefinition, 'A round, yellowish fruit that is juicy &amp; sweet.');
    assert.deepStrictEqual(entries.map(e => e.homograph), [1, 2, 3]);
});

test('throws on a krdict error response', () => {
    assert.throws(() => parseSearch(fixture('error.xml')), /krdict error 020/);
});

test('picks the homograph whose meaning matches the sentence', () => {
    const entries = parseSearch(fixture('search-bae.xml'));
    assert.strictEqual(pickEntry(entries, '배', { type: 'noun', meaning: 'boat' }).homograph, 2);
    assert.strictEqual(pickEntry(entries, '배', { type: 'noun', meaning: 'a pear (fruit)' }).homograph, 3);
    assert.strictEqual(pickEntry(entries, '배', { type: 'noun', meaning: 'times, -fold' }).homograph, 1);
    assert.strictEqual(pickEntry(entries, '사과', {}), null);
});

test('lines Hanja up with syllables only when it can', () => {
    assert.deepStrictEqual(hanjaOf('공부하다', '工夫'), [{ char: '工', reading: '공' }, { char: '夫', reading: '부' }]);
    assert.deepStrictEqual(hanjaOf('커피', 'coffee'), []);
    assert.deepStrictEqual(hanjaOf('아', '亞細亞'), [{ char: '亞', reading: null }, { char: '細', reading: null }, { char: '亞', reading: null }]);
});

test('word family puts learner words first, skips the word itself and duplicates', () => {
    const family = familyFrom(parseSearch(fixture('hanja-hak.xml')), '學', '학교');
    assert.deepStrictEqual(family.map(w => w.word), ['학생', '대학', '학문']);
    assert.strictEqual(family[1].meaning, 'university');
});

test('lookup caches searches and builds families', async () => {
    const calls = [];
    const store = new Map();
    const db = { collection: () => ({
        findOne: async ({ _id }) => store.get(_id) || null,
        updateOne: async ({ _id }, { $set }) => { store.set(_id, { _id, ...$set }); },
    }) };
    const fetchImpl = async (url) => {
        const u = new URL(url);
        calls.push(Object.fromEntries(u.searchParams));
        const q = u.searchParams.get('q');
        const body = q === '학교' ? fixture('search-hakgyo.xml') : q === '學' ? fixture('hanja-hak.xml') : '<channel><total>0</total></channel>';
        return { ok: true, text: async () => body };
    };
    const kd = createKrdict({ apiKey: 'test', getDb: () => db, fetchImpl });
    const entry = await kd.lookup('학교', { type: 'noun', meaning: 'school' });
    assert.strictEqual(entry.level, 'beginner');
    assert.strictEqual(entry.families.length, 2);
    assert.deepStrictEqual(entry.families[0].words.map(w => w.word), ['학생', '대학', '학문']);
    assert.deepStrictEqual(entry.families[1].words, []);
    const hanjaCall = calls.find(c => c.q === '學');
    assert.strictEqual(hanjaCall.advanced, 'y');
    assert.strictEqual(hanjaCall.target, '4');
    assert.strictEqual(hanjaCall.method, 'include');
    assert.strictEqual(hanjaCall.trans_lang, '1');

    const before = calls.length;
    await kd.lookup('학교', { meaning: 'school' });
    assert.strictEqual(calls.length, before, 'second lookup is served from the cache');
});

test('empty results are looked up again after a day', async () => {
    let t = 0;
    let calls = 0;
    const store = new Map();
    const db = { collection: () => ({
        findOne: async ({ _id }) => store.get(_id) || null,
        updateOne: async ({ _id }, { $set }) => { store.set(_id, { _id, ...$set }); },
    }) };
    const fetchImpl = async () => { calls++; return { ok: true, text: async () => '<channel><total>0</total></channel>' }; };
    const kd = createKrdict({ apiKey: 'test', getDb: () => db, fetchImpl, now: () => t });
    assert.strictEqual(await kd.lookup('없는말'), null);
    t = 60 * 60 * 1000;
    await kd.lookup('없는말');
    assert.strictEqual(calls, 1);
    t = 25 * 60 * 60 * 1000;
    await kd.lookup('없는말');
    assert.strictEqual(calls, 2);
});

test('lookup without a key reports itself disabled', () => {
    assert.strictEqual(createKrdict({ apiKey: '' }).enabled, false);
});

test('free plans get one word per family, Plus gets all', () => {
    const entry = { word: '학교', families: [{ char: '學', reading: '학', words: [{ word: '학생' }, { word: '대학' }] }] };
    const free = shapeForTier(entry, false);
    assert.strictEqual(free.familyLocked, true);
    assert.deepStrictEqual(free.families[0].words.map(w => w.word), ['학생']);
    assert.strictEqual(free.families[0].count, 2);
    const plus = shapeForTier(entry, true);
    assert.strictEqual(plus.familyLocked, false);
    assert.strictEqual(plus.families[0].words.length, 2);
});

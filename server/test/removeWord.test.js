const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// In-memory stand-in for the few collection calls removeWord makes.
const matches = (doc, query) => Object.entries(query).every(([key, cond]) =>
    cond && typeof cond === 'object' && '$in' in cond ? cond.$in.includes(doc[key]) : doc[key] === cond);

const makeDb = (data) => ({
    data,
    collection: (name) => ({
        find: (query) => ({ toArray: async () => data[name].filter(d => matches(d, query)) }),
        deleteMany: async (query) => { data[name] = data[name].filter(d => !matches(d, query)); },
    }),
});

let db;
require.cache[path.resolve(__dirname, '../database.js')] = {
    id: 'database', filename: 'database', loaded: true,
    exports: { getDb: () => db },
};
const removeWord = require('../controllers/auth/removeWord');

const run = async (body, userId = 1) => {
    let status = 200;
    let json;
    const res = { status(code) { status = code; return this; }, json(value) { json = value; } };
    await removeWord({ body, session: { user: { userId } } }, res);
    return { status, json };
};

const seed = () => makeDb({
    words: [
        { wordId: 10, userId: 1, originalWord: '공부하다', originalLanguage: 'ko' },
        { wordId: 11, userId: 1, originalWord: '가다', originalLanguage: 'ko' },
        { wordId: 20, userId: 2, originalWord: '공부하다', originalLanguage: 'ko' },
    ],
    flashcards: [
        { flashcardId: 100, userId: 1, contentType: 'word', contentId: 10 },
        { flashcardId: 101, userId: 1, contentType: 'word', contentId: 10 },
        { flashcardId: 102, userId: 1, contentType: 'grammar', contentId: 10 },
        { flashcardId: 103, userId: 1, contentType: 'word', contentId: 11 },
        { flashcardId: 200, userId: 2, contentType: 'word', contentId: 20 },
    ],
    deck_cards: [
        { deckId: 1, flashcardId: 100 },
        { deckId: 2, flashcardId: 101 },
        { deckId: 1, flashcardId: 102 },
        { deckId: 1, flashcardId: 103 },
        { deckId: 9, flashcardId: 200 },
    ],
});

test('removing by wordId deletes the word and every word card made from it', async () => {
    db = seed();
    const { status, json } = await run({ wordId: 10 });
    assert.equal(status, 200);
    assert.deepEqual(json, { success: true, removedWords: 1, removedFlashcards: 2 });
    assert.deepEqual(db.data.words.map(w => w.wordId), [11, 20]);
    // The grammar card with the same contentId and other words' cards stay
    assert.deepEqual(db.data.flashcards.map(f => f.flashcardId), [102, 103, 200]);
    assert.deepEqual(db.data.deck_cards.map(d => d.flashcardId), [102, 103, 200]);
});

test('removing by word text still works and stays within the signed-in user', async () => {
    db = seed();
    const { status } = await run({ originalWord: '공부하다', originalLanguage: 'ko' }, 2);
    assert.equal(status, 200);
    assert.deepEqual(db.data.words.map(w => w.wordId), [10, 11]);
    assert.deepEqual(db.data.flashcards.map(f => f.flashcardId), [100, 101, 102, 103]);
});

test("another user's word id is not found", async () => {
    db = seed();
    const { status } = await run({ wordId: 20 }, 1);
    assert.equal(status, 404);
    assert.equal(db.data.words.length, 3);
});

test('a request with neither a word id nor a word is rejected', async () => {
    db = seed();
    const { status } = await run({});
    assert.equal(status, 400);
});

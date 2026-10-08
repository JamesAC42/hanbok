const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { ObjectId } = require('mongodb');

// In-memory stand-in for the collection calls the lyrics admin makes.
const matches = (doc, query) => Object.entries(query).every(([key, cond]) => {
    if (cond && typeof cond === 'object' && '$ne' in cond) return String(doc[key]) !== String(cond.$ne);
    return String(doc[key]) === String(cond);
});

let data;
const db = {
    collection: (name) => ({
        findOne: async (query) => data[name].find(d => matches(d, query)) || null,
        insertOne: async (doc) => { const _id = new ObjectId(); data[name].push({ ...doc, _id }); return { insertedId: _id }; },
        updateOne: async (query, update) => {
            const doc = data[name].find(d => matches(d, query));
            if (doc) Object.assign(doc, update.$set);
            return { matchedCount: doc ? 1 : 0 };
        },
    }),
};
require.cache[path.resolve(__dirname, '../database.js')] = {
    id: 'database', filename: 'database', loaded: true,
    exports: { getDb: () => db },
};
require.cache[path.resolve(__dirname, '../lib/adminEmails.js')] = {
    id: 'adminEmails', filename: 'adminEmails', loaded: true,
    exports: ['admin@example.com'],
};
const { addLyrics, updateLyrics } = require('../controllers/lyrics/adminLyrics');

const reset = () => {
    data = {
        users: [{ userId: 1, email: 'admin@example.com' }, { userId: 2, email: 'learner@example.com' }],
        lyrics: [{ _id: new ObjectId(), lyricId: 'stray-kids-silent-cry', title: 'Silent Cry', artist: 'Stray Kids', published: false }],
    };
};

const call = async (handler, { body, params = {}, userId = 1 }) => {
    let status = 200;
    let json;
    const res = { status(code) { status = code; return this; }, json(value) { json = value; } };
    await handler({ body, params, session: { user: { userId } } }, res);
    return { status, json };
};

const song = (title) => ({ title, artist: 'Stray Kids', genre: 'kpop', lyricsText: 'line', language: 'ko', youtubeUrl: '-OofaCbwiow' });

test('adding a song that is already in the library says so instead of failing', async () => {
    reset();
    const { status, json } = await call(addLyrics, { body: song('Silent Cry') });
    assert.equal(status, 409);
    assert.match(json.message, /Silent Cry by Stray Kids is already in the library as a draft/);
    assert.equal(String(json.existingId), String(data.lyrics[0]._id));
    assert.equal(data.lyrics.length, 1);
});

test('a new song is added', async () => {
    reset();
    const { status, json } = await call(addLyrics, { body: song('Hellevator') });
    assert.equal(status, 201);
    assert.equal(json.lyric.lyricId, 'stray-kids-hellevator');
    assert.equal(json.lyric.youtubeUrl, '-OofaCbwiow');
});

test('renaming a song onto another song is refused, saving it unchanged is not', async () => {
    reset();
    await call(addLyrics, { body: song('Hellevator') });
    const other = data.lyrics[1];
    const clash = await call(updateLyrics, { body: song('Silent Cry'), params: { lyricId: String(other._id) } });
    assert.equal(clash.status, 409);
    const same = await call(updateLyrics, { body: song('Silent Cry'), params: { lyricId: String(data.lyrics[0]._id) } });
    assert.equal(same.status, 200);
});

test('only admins can add songs', async () => {
    reset();
    const { status } = await call(addLyrics, { body: song('Hellevator'), userId: 2 });
    assert.equal(status, 403);
    assert.equal(data.lyrics.length, 1);
});

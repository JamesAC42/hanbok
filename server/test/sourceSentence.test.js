const { test } = require('node:test');
const assert = require('node:assert/strict');
const { findSourceSentence, surfaceForm } = require('../lib/sourceSentence');

const sentence = (sentenceId, forms) => ({
    sentenceId,
    text: `sentence ${sentenceId}`,
    analysis: {
        sentence: { translation: `translation ${sentenceId}` },
        components: forms.map(([text, dictionary_form]) => ({ text, dictionary_form })),
    },
});

// Minimal stand-in for the sentences collection.
const fakeDb = ({ byId = {}, latest = null }) => {
    const calls = [];
    return {
        calls,
        collection: () => ({
            findOne: async (query) => { calls.push(['findOne', query]); return byId[query.sentenceId] || null; },
            find: (query) => {
                calls.push(['find', query]);
                return { sort: () => ({ limit: () => ({ toArray: async () => (latest ? [latest] : []) }) }) };
            },
        }),
    };
};

test('surfaceForm returns the inflected form used in the sentence', () => {
    assert.equal(surfaceForm(sentence(1, [['공부하고', '공부하다']]), '공부하다'), '공부하고');
    assert.equal(surfaceForm(sentence(1, [['가기', '가다']]), '없다'), null);
});

test('uses the stored sentenceId when the word has one', async () => {
    const db = fakeDb({ byId: { 7: sentence(7, [['가기', '가다']]) } });
    const source = await findSourceSentence(db, 1, { originalWord: '가다', sentenceId: 7 });
    assert.deepEqual(source, { sentenceId: 7, text: 'sentence 7', translation: 'translation 7', surface: '가기' });
    assert.equal(db.calls.length, 1);
});

test('falls back to the latest sentence containing the word', async () => {
    const db = fakeDb({ latest: sentence(9, [['가기', '가다']]) });
    const source = await findSourceSentence(db, 1, { originalWord: '가다', originalLanguage: 'ko' });
    assert.equal(source.sentenceId, 9);
    assert.deepEqual(db.calls[0], ['find', { userId: 1, 'analysis.components.dictionary_form': '가다', originalLanguage: 'ko' }]);
});

test('returns null when nothing matches', async () => {
    assert.equal(await findSourceSentence(fakeDb({}), 1, { originalWord: '가다', sentenceId: 3 }), null);
    assert.equal(await findSourceSentence(fakeDb({}), 1, {}), null);
});

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// Keep real API clients from loading: the processor only needs the rate
// limit helper, and the LLM calls are injected per test.
const stubModule = (relPath, exportsObj) => {
    const file = require.resolve(path.join(__dirname, '..', relPath));
    require.cache[file] = { id: file, filename: file, loaded: true, exports: exportsObj };
};
let quotaIncrements = 0;
stubModule('controllers/auth/extendedTextRateLimits.js', {
    incrementExtendedTextRateLimits: async () => {
        quotaIncrements++;
        return { weekAnalysesUsed: 1, weekAnalysesTotal: 2, weekAnalysesRemaining: 1 };
    }
});
stubModule('llm/extendedText.js', {});

const { splitIntoParagraphs } = require('../lib/extendedTextSplit');
const { readerFromAnalyses } = require('../lib/extendedTextReader');
const processExtendedTextJob = require('../services/extendedTextProcessor');
const { buildChunks, runPool } = processExtendedTextJob;

describe('splitIntoParagraphs', () => {
    test('keeps paragraph numbers for each sentence', () => {
        const text = '첫 문장이에요. 두 번째예요.\n\n세 번째 문단이에요.\n같은 문단의 다음 줄이에요.\n\n\n마지막!';
        const { sentences, paragraphs } = splitIntoParagraphs(text);
        assert.deepEqual(sentences, ['첫 문장이에요.', '두 번째예요.', '세 번째 문단이에요.', '같은 문단의 다음 줄이에요.', '마지막!']);
        assert.deepEqual(paragraphs, [0, 0, 1, 1, 2]);
    });

    test('treats a line of spaces as a paragraph break', () => {
        const { paragraphs } = splitIntoParagraphs('一つ目。二つ目。\n \n三つ目。');
        assert.deepEqual(paragraphs, [0, 0, 1]);
    });
});

describe('buildChunks', () => {
    test('covers every sentence once, in order', () => {
        const sentences = Array.from({ length: 30 }, (_, i) => 'x'.repeat(40 + (i % 5) * 20));
        const paragraphs = sentences.map((_, i) => Math.floor(i / 7));
        const chunks = buildChunks(sentences, paragraphs);
        assert.deepEqual(chunks.flat(), sentences.map((_, i) => i));
        for (const chunk of chunks) {
            const length = chunk.reduce((sum, i) => sum + sentences[i].length, 0);
            assert.ok(chunk.length === 1 || length <= 320, `chunk too long: ${length}`);
        }
    });

    test('keeps a very long sentence in a chunk of its own', () => {
        const chunks = buildChunks(['a'.repeat(50), 'b'.repeat(900), 'c'.repeat(50)], [0, 0, 0]);
        assert.deepEqual(chunks, [[0], [1], [2]]);
    });
});

test('runPool never runs more than the limit at once', async () => {
    let running = 0;
    let peak = 0;
    await runPool([1, 2, 3, 4, 5, 6, 7], 3, async () => {
        running++;
        peak = Math.max(peak, running);
        await new Promise((resolve) => setTimeout(resolve, 5));
        running--;
    });
    assert.equal(peak, 3);
});

// In-memory stand-in for the collections the processor touches.
const fakeDb = () => {
    const store = {};
    const collection = (name) => {
        store[name] = store[name] || [];
        const docs = store[name];
        const matches = (doc, query) => Object.entries(query).every(([k, v]) => doc[k] === v);
        return {
            insertOne: async (doc) => { docs.push(structuredClone(doc)); },
            deleteOne: async (query) => {
                const i = docs.findIndex((doc) => matches(doc, query));
                if (i >= 0) docs.splice(i, 1);
            },
            updateOne: async (query, update) => {
                let doc = docs.find((d) => matches(d, query));
                if (!doc) {
                    doc = { ...query };
                    docs.push(doc);
                }
                for (const [key, value] of Object.entries(update.$set || {})) {
                    const parts = key.split('.');
                    let target = doc;
                    while (parts.length > 1) {
                        const part = parts.shift();
                        target[part] = target[part] || {};
                        target = target[part];
                    }
                    target[parts[0]] = structuredClone(value);
                }
                for (const key of Object.keys(update.$unset || {})) delete doc[key];
            }
        };
    };
    return { collection, store };
};

const makeJob = (sentences, paragraphs) => ({
    jobId: 1,
    textId: 7,
    userId: 3,
    text: sentences.join(' '),
    sentences,
    paragraphs,
    sentenceCount: sentences.length,
    originalLanguage: 'ko',
    translationLanguage: 'en',
    title: null,
    status: 'pending',
    requiresRateLimitUpdate: true
});

const fakeLlm = ({ skip = new Set(), failOverview = false } = {}) => ({
    MODEL: 'test-model',
    readChunk: async ({ numbers }) => {
        const results = new Map();
        for (const n of numbers) {
            if (skip.has(n)) continue;
            results.set(n, { translation: `translation ${n}`, words: [{ text: `w${n}`, base: `w${n}`, meaning: 'm', pos: 'noun' }], grammar: [] });
        }
        if (results.size === 0) throw new Error('nothing');
        return results;
    },
    overview: async () => {
        if (failOverview) throw new Error('overview down');
        return { summary: 'A summary', keyGrammarPatterns: [], quiz: [] };
    }
});

describe('processExtendedTextJob', () => {
    test('saves every sentence with its paragraph and the overview', async () => {
        const db = fakeDb();
        const sentences = Array.from({ length: 12 }, (_, i) => `문장 ${i + 1}입니다.`);
        const paragraphs = sentences.map((_, i) => (i < 6 ? 0 : 1));
        const streamed = [];
        let completed = null;
        quotaIncrements = 0;
        await processExtendedTextJob(makeJob(sentences, paragraphs), {
            db,
            llm: fakeLlm(),
            onSentences: ({ sentences: batch }) => streamed.push(...batch.map((s) => s.index)),
            onComplete: (payload) => { completed = payload; },
            onError: (payload) => assert.fail(payload.message)
        });
        const [saved] = db.store.extended_texts;
        assert.equal(saved.pipelineVersion, 2);
        assert.equal(saved.reading.length, 12);
        assert.equal(saved.reading[7].paragraph, 1);
        assert.equal(saved.reading[7].translation, 'translation 8');
        assert.equal(saved.overallAnalysis.summary, 'A summary');
        assert.deepEqual(streamed.sort((a, b) => a - b), sentences.map((_, i) => i));
        assert.equal(completed.textId, 7);
        assert.equal(quotaIncrements, 1);
        assert.equal(db.store.extended_text_jobs[0].status, 'completed');
        assert.equal(db.store.extended_text_jobs[0].reading, undefined);
    });

    test('a few unreadable sentences and a failed overview do not fail the text', async () => {
        const db = fakeDb();
        const sentences = Array.from({ length: 20 }, (_, i) => `문장 ${i + 1}.`);
        let completed = false;
        await processExtendedTextJob(makeJob(sentences, sentences.map(() => 0)), {
            db,
            llm: fakeLlm({ skip: new Set([4]), failOverview: true }),
            onComplete: () => { completed = true; },
            onError: (payload) => assert.fail(payload.message)
        });
        assert.ok(completed);
        const [saved] = db.store.extended_texts;
        assert.equal(saved.reading[3].failed, true);
        assert.equal(saved.reading[4].failed, undefined);
        assert.deepEqual(saved.overallAnalysis, {});
    });

    test('fails when too much of the text could not be read', async () => {
        const db = fakeDb();
        const sentences = Array.from({ length: 5 }, (_, i) => `문장 ${i + 1}.`);
        let error = null;
        quotaIncrements = 0;
        await processExtendedTextJob(makeJob(sentences, sentences.map(() => 0)), {
            db,
            llm: fakeLlm({ skip: new Set([1, 2]) }),
            onComplete: () => assert.fail('should not complete'),
            onError: (payload) => { error = payload.message; }
        });
        assert.ok(error);
        assert.equal(db.store.extended_texts, undefined);
        assert.equal(quotaIncrements, 0);
        assert.equal(db.store.extended_text_jobs[0].status, 'failed');
    });

    test('resumes from sentences an earlier run already read', async () => {
        const db = fakeDb();
        const sentences = ['하나.', '둘.', '셋.'];
        const job = makeJob(sentences, [0, 0, 0]);
        job.reading = { 0: { translation: 'kept', words: [], grammar: [] } };
        const asked = [];
        const llm = fakeLlm();
        const realRead = llm.readChunk;
        llm.readChunk = async (args) => { asked.push(...args.numbers); return realRead(args); };
        await processExtendedTextJob(job, { db, llm, onError: (payload) => assert.fail(payload.message) });
        assert.deepEqual(asked, [2, 3]);
        assert.equal(db.store.extended_texts[0].reading[0].translation, 'kept');
    });
});

describe('readerFromAnalyses', () => {
    test('builds reader rows from full breakdowns of older texts', () => {
        const docs = new Map([
            [10, { sentenceId: 10, text: '안녕하세요.', analysis: { sentence: { translation: 'Hello.' }, components: [{ text: '안녕하세요.', dictionary_form: '안녕하다', type: 'Verb', meaning: { description: 'hello' } }], grammar_points: [{ pattern: '-세요', explanation: 'polite ending', level: '1' }] } }],
            [11, { sentenceId: 11, text: '반가워요.', analysis: { sentence: { translation: 'Nice to meet you.' }, components: [] } }]
        ]);
        const rows = readerFromAnalyses([{ sentenceId: 10, order: 0 }, { sentenceId: 11, order: 1 }], docs, '안녕하세요.\n\n반가워요.');
        assert.equal(rows[0].translation, 'Hello.');
        assert.deepEqual(rows[0].words[0], { text: '안녕하세요', base: '안녕하다', reading: undefined, meaning: 'hello', pos: 'verb' });
        assert.equal(rows[0].grammar[0].pattern, '-세요');
        assert.equal(rows[0].paragraph, 0);
        assert.equal(rows[1].paragraph, 1);
    });
});

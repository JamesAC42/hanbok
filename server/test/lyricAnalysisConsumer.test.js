const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { startLyricAnalysisConsumer, isStaleJob, MAX_JOB_AGE_MS } = require('../jobs/lyricAnalysisConsumer');

const fakeQueue = () => {
    const queue = { handler: null, process(fn) { queue.handler = fn; } };
    return queue;
};

afterEach(() => { delete process.env.LYRICS_WORKER; });

test('the API process consumes lyric jobs by default', async () => {
    const queue = fakeQueue();
    const seen = [];
    assert.equal(startLyricAnalysisConsumer(queue, async (job) => { seen.push(job.id); return { ok: true }; }), true);
    const result = await queue.handler({ id: 3, timestamp: Date.now(), data: { lyricId: 'abc' } });
    assert.deepEqual(result, { ok: true });
    assert.deepEqual(seen, [3]);
});

test('jobs left over from when nothing consumed the queue are skipped', async () => {
    const queue = fakeQueue();
    let calls = 0;
    startLyricAnalysisConsumer(queue, async () => { calls++; });
    const result = await queue.handler({ id: 1, timestamp: Date.now() - MAX_JOB_AGE_MS - 1000, data: { lyricId: 'abc' } });
    assert.equal(result.skipped, true);
    assert.equal(calls, 0);
});

test('LYRICS_WORKER=separate leaves the queue to the worker', () => {
    process.env.LYRICS_WORKER = 'separate';
    const queue = fakeQueue();
    assert.equal(startLyricAnalysisConsumer(queue, async () => {}), false);
    assert.equal(queue.handler, null);
});

test('isStaleJob', () => {
    const now = 1_000_000_000;
    assert.equal(isStaleJob({ timestamp: now - 1000 }, now), false);
    assert.equal(isStaleJob({ timestamp: now - MAX_JOB_AGE_MS - 1 }, now), true);
    assert.equal(isStaleJob({}, now), false);
});

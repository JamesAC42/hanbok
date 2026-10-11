const { test } = require('node:test');
const assert = require('node:assert/strict');

// Exercise SDK serialization without credentials or network access. Node's
// test runner isolates this file, including its environment and module cache.
process.env.GEMINI_API_KEY = 'test-key';
process.env.OPENAI_API_KEY = 'test-key';
process.env.GEMINI_GRAMMAR_MODEL = 'grammar-test-model';
process.env.GEMINI_LESSON_MODEL = 'lesson-test-model';
process.env.GEMINI_ANALYSIS_MODEL = 'analysis-test-model';
process.env.GEMINI_ANALYSIS_THINKING = 'default';

const grammar = require('../grammar/llm');
const gemini = require('../llm/gemini');
const thinking = require('../llm/geminiThinking');
const extended = require('../llm/extendedText');

const deprecated = ['temperature', 'topP', 'top_p', 'topK', 'top_k', 'thinkingBudget', 'thinking_budget'];
const assertCompatible = (config) => {
    for (const key of deprecated) {
        assert.ok(!Object.hasOwn(config, key), `must omit ${key}`);
        assert.ok(!Object.hasOwn(config.thinkingConfig || {}, key), `thinkingConfig must omit ${key}`);
    }
    assert.equal(config.responseMimeType, 'application/json');
};

const captureRequests = (t, replies = ['{"ok":true}']) => {
    // The current SDK leaves timeout timers pending after a response.
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const calls = [];
    t.mock.method(globalThis, 'fetch', async (url, options) => {
        calls.push({ url: String(url), body: JSON.parse(options.body) });
        const text = replies[Math.min(calls.length - 1, replies.length - 1)];
        return new Response(JSON.stringify({
            candidates: [{ content: { role: 'model', parts: [{ text }] }, finishReason: 'STOP' }]
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    return calls;
};

const schema = { type: 'object', properties: { ok: { type: 'boolean' } }, required: ['ok'] };

for (const [name, options, model] of [
    ['grammar catalog and quizzes', {}, grammar.GRAMMAR_MODEL],
    ['lessons', { model: grammar.LESSON_MODEL, timeoutMs: 60000 }, grammar.LESSON_MODEL]
]) {
    test(`${name} omit deprecated settings and preserve structured output`, async (t) => {
        const calls = captureRequests(t);
        assert.deepEqual(await grammar.callJson('test prompt', schema, options), { ok: true });
        assert.equal(calls.length, 1);
        assert.ok(calls[0].url.includes(`/models/${model}:generateContent`));
        assert.deepEqual(calls[0].body.contents, [{ role: 'user', parts: [{ text: 'test prompt' }] }]);
        assertCompatible(calls[0].body.generationConfig);
        assert.deepEqual(calls[0].body.generationConfig, {
            responseMimeType: 'application/json', responseJsonSchema: schema, maxOutputTokens: 6000
        });
    });
}

test('grammar retries malformed JSON with the same compatible request', async (t) => {
    const calls = captureRequests(t, ['invalid JSON', '{"ok":true}']);
    t.mock.method(console, 'error', () => {});
    assert.deepEqual(await grammar.callJson('retry prompt', schema), { ok: true });
    assert.equal(calls.length, 2);
    assert.deepEqual(calls[1].body, calls[0].body);
    assertCompatible(calls[1].body.generationConfig);
});

test('general Gemini and GeminiThinking requests omit deprecated settings', async (t) => {
    const calls = captureRequests(t);
    await gemini.prompt_gemini('test prompt');
    await thinking.prompt_geminiThinking('test prompt');
    assert.equal(calls.length, 2);
    for (const call of calls) assertCompatible(call.body.generationConfig);
});

test('sentence analysis omits thinking defaults and retains explicit thinkingLevel', async (t) => {
    const calls = captureRequests(t);
    await gemini.prompt_gemini_analysis('test prompt');
    const defaultConfig = calls[0].body.generationConfig;
    assertCompatible(defaultConfig);
    assert.equal(defaultConfig.maxOutputTokens, 8192);
    assert.ok(!Object.hasOwn(defaultConfig, 'thinkingConfig'));

    process.env.GEMINI_ANALYSIS_THINKING = 'low';
    delete require.cache[require.resolve('../llm/gemini')];
    t.after(() => {
        process.env.GEMINI_ANALYSIS_THINKING = 'default';
        delete require.cache[require.resolve('../llm/gemini')];
    });
    await require('../llm/gemini').prompt_gemini_analysis('test prompt');
    assertCompatible(calls[1].body.generationConfig);
    assert.deepEqual(calls[1].body.generationConfig.thinkingConfig, { thinkingLevel: 'low' });
});

test('extended reading and overview requests omit deprecated settings', async (t) => {
    const calls = captureRequests(t, [
        '{"sentences":[{"n":1,"translation":"Hello","words":[],"grammar":[]}]}',
        '{"summary":"A greeting"}'
    ]);
    const input = { sentences: ['안녕하세요.'], originalLanguage: 'ko', translationLanguage: 'en' };
    await extended.readChunk({ ...input, numbers: [1], context: '' });
    await extended.overview({ ...input, paragraphs: [0] });
    assert.equal(calls.length, 2);
    for (const call of calls) {
        assertCompatible(call.body.generationConfig);
        assert.ok(call.body.generationConfig.responseJsonSchema);
        assert.ok(call.body.generationConfig.maxOutputTokens > 0);
    }
});

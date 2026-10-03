const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// Stub the provider modules so loading generateResponse.js doesn't create real
// API clients. Each stub returns whatever the current test queues up.
let queuedResponses = [];
const fakeProvider = async () => {
    const next = queuedResponses.shift();
    if (next instanceof Error) throw next;
    return next;
};

const stubModule = (relPath, exportsObj) => {
    const file = require.resolve(path.join(__dirname, '..', 'llm', relPath));
    require.cache[file] = { id: file, filename: file, loaded: true, exports: exportsObj };
};

stubModule('anthropic.js', { prompt_anthropic: fakeProvider });
stubModule('gemini.js', { prompt_gemini: fakeProvider });
stubModule('openai.js', { prompt_openai: fakeProvider });
stubModule('geminiThinking.js', { prompt_geminiThinking: fakeProvider });

const generateResponse = require('../llm/generateResponse');
const { extractJsonText, isRetryableApiError } = generateResponse;

describe('extractJsonText', () => {
    test('returns plain JSON unchanged', () => {
        assert.equal(extractJsonText('{"a":1}'), '{"a":1}');
    });

    test('trims surrounding whitespace', () => {
        assert.equal(extractJsonText('  \n{"a":1}\n  '), '{"a":1}');
    });

    test('strips ```json fences', () => {
        assert.equal(extractJsonText('```json\n{"a":1}\n```'), '{"a":1}');
    });

    test('strips bare ``` fences', () => {
        assert.equal(extractJsonText('```\n[1,2]\n```'), '[1,2]');
    });

    test('takes the outermost object when wrapped in prose', () => {
        const raw = 'Here is the analysis:\n{"a":{"b":2}}\nHope this helps!';
        assert.equal(extractJsonText(raw), '{"a":{"b":2}}');
    });

    test('takes the outermost array when it comes before any object', () => {
        const raw = 'Result: [{"a":1},{"b":2}] done';
        assert.equal(extractJsonText(raw), '[{"a":1},{"b":2}]');
    });

    test('leaves text without JSON alone so JSON.parse fails', () => {
        assert.equal(extractJsonText('no json here'), 'no json here');
    });

    test('throws on non-string input', () => {
        assert.throws(() => extractJsonText(undefined), /not a string/);
        assert.throws(() => extractJsonText({ a: 1 }), /not a string/);
    });
});

describe('isRetryableApiError', () => {
    test('retries on 429/500/503 status codes', () => {
        assert.equal(isRetryableApiError({ status: 429 }), true);
        assert.equal(isRetryableApiError({ statusCode: 500 }), true);
        assert.equal(isRetryableApiError({ status: 503 }), true);
    });

    test('retries on overload messages from the Gemini SDK', () => {
        assert.equal(isRetryableApiError(new Error('[429 Too Many Requests] Resource has been exhausted')), true);
        assert.equal(isRetryableApiError(new Error('The model is overloaded')), true);
        assert.equal(isRetryableApiError(new Error('Request timed out')), true);
    });

    test('does not retry-with-backoff on parse or client errors', () => {
        assert.equal(isRetryableApiError(new SyntaxError('Unexpected token')), false);
        assert.equal(isRetryableApiError({ status: 400 }), false);
        assert.equal(isRetryableApiError(null), false);
    });
});

describe('generateResponse', () => {
    beforeEach(() => {
        queuedResponses = [];
    });

    test('parses a fenced JSON response', async () => {
        queuedResponses.push('```json\n{"translation":"hello"}\n```');
        assert.deepEqual(await generateResponse('prompt', 'gemini'), { translation: 'hello' });
    });

    test('retries after malformed JSON and returns the next valid response', async () => {
        queuedResponses.push('{"translation": "hel', '{"translation":"hello"}');
        assert.deepEqual(await generateResponse('prompt', 'openai'), { translation: 'hello' });
        assert.equal(queuedResponses.length, 0);
    });

    test('throws with the last error after five bad responses', async () => {
        queuedResponses.push(...Array(5).fill('not json'));
        await assert.rejects(
            generateResponse('prompt', 'anthropic'),
            /Could not generate valid response\. Last error: .*JSON/
        );
        assert.equal(queuedResponses.length, 0);
    });
});

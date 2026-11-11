import test from 'node:test';
import assert from 'node:assert';
import { parseLines, readAnalysisResponse } from '../src/lib/analysisStream.js';

const ndjsonResponse = (chunks) => {
    const enc = new TextEncoder();
    let i = 0;
    return {
        headers: { get: () => 'application/x-ndjson; charset=utf-8' },
        body: { getReader: () => ({ read: async () => (i < chunks.length ? { value: enc.encode(chunks[i++]), done: false } : { value: undefined, done: true }) }) },
    };
};

test('splits complete lines and keeps the rest', () => {
    const { lines, rest } = parseLines('{"a":1}\n{"b":2}\n{"c"');
    assert.deepStrictEqual(lines, [{ a: 1 }, { b: 2 }]);
    assert.strictEqual(rest, '{"c"');
});

test('plain JSON responses still work', async () => {
    const res = { headers: { get: () => 'application/json' }, json: async () => ({ message: { isValid: true } }) };
    assert.deepStrictEqual(await readAnalysisResponse(res), { message: { isValid: true } });
});

test('streams partials, split across chunks, then returns the done body', async () => {
    const partials = [];
    const body = await readAnalysisResponse(ndjsonResponse([
        '{"type":"partial","analysis":{"components":[]}}\n{"type":"par',
        'tial","analysis":{"components":[{"text":"학교"}]}}\n',
        '{"type":"done","status":200,"message":{"isValid":true},"sentenceId":7}',
    ]), a => partials.push(a.components.length));
    assert.deepStrictEqual(partials, [0, 1]);
    assert.deepStrictEqual(body, { message: { isValid: true }, sentenceId: 7 });
});

test('a stream that ends without a done line is an error', async () => {
    await assert.rejects(readAnalysisResponse(ndjsonResponse(['{"type":"partial","analysis":{}}\n'])), /cut off/);
});

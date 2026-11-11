// Streams an analysis to the browser as newline-delimited JSON while the model
// writes it: {"type":"partial","analysis":{...}} lines, then one
// {"type":"done", ...} line with the normal response body. Nothing is written
// until the first partial, so every early error still goes out as plain JSON.

const { parsePartialJson } = require('./partialJson');

const PARTIAL_INTERVAL_MS = 200;
const PREVIEW_FIELDS = ['text', 'dictionary_form', 'type', 'register'];

// Just what the waiting screen draws: the sentence, its translation and the
// words found so far (each component only once it is complete).
const previewOf = (analysis) => {
    if (!analysis || typeof analysis !== 'object') return null;
    const sentence = analysis.sentence && typeof analysis.sentence === 'object' ? {
        original: typeof analysis.sentence.original === 'string' ? analysis.sentence.original : undefined,
        translation: typeof analysis.sentence.translation === 'string' ? analysis.sentence.translation : undefined,
    } : null;
    const components = (Array.isArray(analysis.components) ? analysis.components : [])
        .filter(c => c && typeof c === 'object' && typeof c.text === 'string' && c.meaning)
        .map(c => {
            const out = {};
            for (const k of PREVIEW_FIELDS) if (typeof c[k] === 'string') out[k] = c[k];
            if (typeof c.meaning?.description === 'string') out.meaning = { description: c.meaning.description };
            return out;
        });
    if (!sentence?.translation && !components.length) return null;
    return { sentence, components };
};

const createAnalysisStream = (res, { now = Date.now } = {}) => {
    let started = false;
    let lastSent = 0;
    let lastKey = '';

    const start = () => {
        if (started) return;
        started = true;
        res.status(200);
        res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders?.();
    };

    const write = (obj) => res.write(`${JSON.stringify(obj)}\n`);

    // Raw model text so far -> a preview line, at most every 200 ms and only
    // when something new is visible.
    const onText = (raw) => {
        if (now() - lastSent < PARTIAL_INTERVAL_MS) return;
        const parsed = parsePartialJson(raw);
        const preview = previewOf(parsed?.analysis);
        if (!preview) return;
        const key = `${preview.sentence?.translation?.length || 0}:${preview.components.length}`;
        if (key === lastKey) return;
        lastKey = key;
        lastSent = now();
        start();
        write({ type: 'partial', analysis: preview });
    };

    // The final body: a "done" line if streaming started, else normal JSON.
    const send = (body, status = 200) => {
        if (!started) return res.status(status).json(body);
        write({ type: 'done', status, ...body });
        return res.end();
    };

    return { onText, send, get started() { return started; } };
};

module.exports = { createAnalysisStream, previewOf, PARTIAL_INTERVAL_MS };

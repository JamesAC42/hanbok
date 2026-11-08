// Reads /api/submit. With streaming on, the server sends newline-delimited
// JSON: "partial" lines (sentence, translation, finished words) while the
// model writes, then one "done" line with the usual body. Without it, the
// body is plain JSON. Either way this resolves to the usual body.

export const parseLines = (buffer) => {
    const parts = buffer.split('\n');
    const rest = parts.pop();
    const lines = parts.map(l => l.trim()).filter(Boolean).map(l => {
        try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean);
    return { lines, rest };
};

export const readAnalysisResponse = async (response, onPartial) => {
    const type = response.headers?.get?.('content-type') || '';
    if (!type.includes('application/x-ndjson') || !response.body?.getReader) {
        return response.json();
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let done = null;
    const handle = (line) => {
        if (line.type === 'partial' && line.analysis) onPartial?.(line.analysis);
        else if (line.type === 'done') {
            const { type: _t, status: _s, ...body } = line;
            done = body;
        }
    };
    for (;;) {
        const { value, done: finished } = await reader.read();
        if (value) {
            buffer += decoder.decode(value, { stream: true });
            const { lines, rest } = parseLines(buffer);
            buffer = rest;
            lines.forEach(handle);
        }
        if (finished) break;
    }
    buffer += decoder.decode();
    parseLines(`${buffer}\n`).lines.forEach(handle);
    if (!done) throw new Error('The analysis was cut off. Please try again.');
    return done;
};

// Parse the beginning of a JSON document that is still being generated:
// cut it at the last point where every value so far is complete and close
// whatever objects and arrays are still open. Returns null when nothing
// usable has arrived yet.

const CLOSERS = { '{': '}', '[': ']' };

const parsePartialJson = (text) => {
    if (typeof text !== 'string') return null;
    const start = text.search(/[{[]/);
    if (start === -1) return null;
    const s = text.slice(start);

    const stack = [];
    let inString = false;
    let escaped = false;
    // A cut point: text up to `at`, with the containers open at that moment.
    let safe = null;
    const mark = (at) => { safe = { at, open: stack.slice() }; };

    for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (inString) {
            if (escaped) escaped = false;
            else if (ch === '\\') escaped = true;
            else if (ch === '"') inString = false;
            continue;
        }
        if (ch === '"') { inString = true; continue; }
        if (ch === '{' || ch === '[') { stack.push(ch); mark(i + 1); continue; }
        if (ch === '}' || ch === ']') {
            stack.pop();
            mark(i + 1);
            if (!stack.length) break;
            continue;
        }
        // Everything before a comma is a finished value.
        if (ch === ',') mark(i);
    }

    if (!safe) return null;
    const body = s.slice(0, safe.at).replace(/,\s*$/, '');
    const closing = safe.open.slice().reverse().map(c => CLOSERS[c]).join('');
    try {
        return JSON.parse(body + closing);
    } catch {
        return null;
    }
};

module.exports = { parsePartialJson };

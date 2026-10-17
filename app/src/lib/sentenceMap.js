// Reads the analysis "chunks" into groups of components for the sentence map.
// Chunks name components by index (as strings, like grammar_points do). Bad
// or overlapping indexes are dropped, and any component a chunk missed is put
// back in its own group, so the map always shows the whole sentence in order.

export const buildMap = (analysis) => {
    const components = analysis?.components || [];
    const chunks = Array.isArray(analysis?.chunks) ? analysis.chunks : [];
    if (!chunks.length || !components.length) return null;

    const words = components
        .map((c, index) => ({ index, text: c.text, type: c.type }))
        .filter(w => w.type !== 'punctuation' && (w.text || '').trim());
    const valid = new Set(words.map(w => w.index));
    const used = new Set();

    const groups = [];
    for (const chunk of chunks) {
        const indexes = (chunk?.components || [])
            .map(n => parseInt(n, 10))
            .filter(n => valid.has(n) && !used.has(n))
            .sort((a, b) => a - b);
        if (!indexes.length) continue;
        indexes.forEach(n => used.add(n));
        groups.push({ role: (chunk.role || '').trim(), gloss: (chunk.gloss || '').trim(), indexes });
    }
    for (const w of words) {
        if (!used.has(w.index)) groups.push({ role: '', gloss: '', indexes: [w.index] });
    }
    if (groups.length < 2) return null;

    groups.sort((a, b) => a.indexes[0] - b.indexes[0]);
    return groups.map((g, i) => ({
        ...g,
        id: i,
        words: g.indexes.map(n => components[n].text.trim()),
    }));
};

const cleanWord = (text) => String(text || '').replace(/^[\s\p{P}]+|[\s\p{P}]+$/gu, '');

// Texts analyzed before the reading pass have a full breakdown for every
// sentence. Build the same reader rows from those breakdowns; paragraphs
// come from blank lines in the original text when the sentences can be found
// in it, otherwise everything is one paragraph.
const readerFromAnalyses = (refs, docsById, fullText) => {
    const blocks = String(fullText || '').split(/\r?\n[ \t\u3000]*\r?\n/);
    let block = 0;
    return refs.map((ref, index) => {
        const doc = docsById.get(ref.sentenceId);
        const analysis = doc?.analysis || {};
        const text = doc?.text || analysis.sentence?.original || '';
        while (block < blocks.length - 1 && text && !blocks[block].includes(text)) block++;
        if (block >= blocks.length) block = blocks.length - 1;
        return {
            index,
            paragraph: Math.max(block, 0),
            text,
            translation: analysis.sentence?.translation || '',
            words: (Array.isArray(analysis.components) ? analysis.components : []).map((component) => ({
                text: cleanWord(component.text),
                base: component.dictionary_form || '',
                reading: component.reading || undefined,
                meaning: component.meaning?.description || '',
                pos: String(component.type || '').toLowerCase()
            })).filter((word) => word.text),
            grammar: (Array.isArray(analysis.grammar_points) ? analysis.grammar_points : []).slice(0, 5).map((point) => ({
                pattern: point.pattern || '',
                text: '',
                meaning: point.explanation ? String(point.explanation).slice(0, 160) : '',
                level: Number(point.level) || undefined
            })).filter((point) => point.pattern),
            failed: !doc
        };
    });
};

module.exports = { readerFromAnalyses };

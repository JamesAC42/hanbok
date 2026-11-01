// Search across everything a learner has analyzed (not just the page they're
// on), by the sentence, its translation, a word in it, or a grammar point.
// Also turns analyses into Anki notes.

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Grammar patterns are written like "-고 싶다" or "(으)ㄹ 수 있다"; let a
// search for "고 싶" or "-고싶다" find them.
const normalizeQuery = (q) => String(q || '').trim().slice(0, 60);

const queryRegex = (q) => {
    const parts = normalizeQuery(q).replace(/^[-~]+/, '').split(/\s+/).filter(Boolean).map(escapeRegex);
    if (!parts.length) return null;
    return new RegExp(parts.join('\\s*'), 'i');
};

const sentenceMatch = (userId, q, language) => {
    const re = queryRegex(q);
    if (!re) return null;
    return {
        userId,
        hiddenAt: null,
        ...(language ? { originalLanguage: language } : {}),
        $or: [
            { text: re },
            { 'analysis.sentence.translation': re },
            { 'analysis.components.dictionary_form': re },
            { 'analysis.components.text': re },
            { 'analysis.components.meaning.description': re },
            { 'analysis.grammar_points.pattern': re },
        ],
    };
};

// Why a sentence matched, for the result card: the word or grammar point
// is more useful than "it's in the text".
const describeMatch = (doc, q) => {
    const re = queryRegex(q);
    if (!re) return null;
    const a = doc.analysis || {};
    const gp = (a.grammar_points || []).find(g => re.test(g?.pattern || ''));
    if (gp) return { kind: 'grammar', label: gp.pattern };
    const comp = (a.components || []).find(c => re.test(c?.dictionary_form || '') || re.test(c?.text || ''));
    if (comp) return { kind: 'word', label: comp.dictionary_form || comp.text, meaning: comp.meaning?.description || '' };
    const byMeaning = (a.components || []).find(c => re.test(c?.meaning?.description || ''));
    if (byMeaning) return { kind: 'word', label: byMeaning.dictionary_form || byMeaning.text, meaning: byMeaning.meaning.description };
    if (re.test(a.sentence?.translation || '')) return { kind: 'translation', label: a.sentence.translation };
    return { kind: 'text', label: doc.text };
};

const html = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/[\t\r\n]+/g, ' ').trim();

// One Anki note: the sentence on the front; translation, words and grammar
// on the back.
const ankiRow = (doc) => {
    const a = doc.analysis || {};
    const words = (a.components || [])
        .filter(c => c && c.type !== 'punctuation' && c.dictionary_form && c.meaning?.description)
        .map(c => `<b>${html(c.dictionary_form)}</b> ${html(c.meaning.description)}`);
    const grammar = (a.grammar_points || [])
        .filter(g => g?.pattern)
        .map(g => `<b>${html(g.pattern)}</b>${g.explanation ? ` ${html(g.explanation)}` : ''}`);
    const back = [
        html(a.sentence?.translation),
        words.length ? `<br><br>${words.join('<br>')}` : '',
        grammar.length ? `<br><br>${grammar.join('<br>')}` : '',
    ].join('');
    const tags = ['hanbok', doc.originalLanguage].filter(Boolean).map(t => String(t).replace(/\s+/g, '_')).join(' ');
    return [html(doc.text), back, tags].join('\t');
};

const ankiFile = (docs) => [
    '#separator:tab',
    '#html:true',
    '#notetype:Basic',
    '#tags column:3',
    ...docs.filter(d => d?.text).map(ankiRow),
].join('\n') + '\n';

module.exports = { escapeRegex, queryRegex, sentenceMatch, describeMatch, ankiRow, ankiFile, normalizeQuery };

// Grammar explanations at a chosen depth. The analysis itself is always written
// at "standard" depth; Simple and Detailed are rewrites of its grammar
// explanations, made on request and stored on the sentence so each one is only
// generated once.

const SupportedLanguages = require('../supported_languages');

const DEPTHS = ['simple', 'standard', 'detailed'];
const MAX_POINTS = 12;
const MAX_EXPLANATION_CHARS = 2400;

const GUIDE = {
    simple: 'Rewrite each explanation for a beginner: one or two short sentences, everyday words, no linguistic terms. Say what the pattern does in this sentence and nothing more.',
    detailed: 'Rewrite each explanation for a learner who wants the full picture, in 4 to 7 sentences: what the pattern means, how it is formed (what it attaches to and any spelling changes), how it is used in this sentence, how it differs from similar patterns a learner might confuse it with, and any register or nuance to watch for.',
};

const isDepth = (d) => DEPTHS.includes(d);

const pointsOf = (analysis) => (Array.isArray(analysis?.grammar_points) ? analysis.grammar_points : [])
    .slice(0, MAX_POINTS)
    .map(p => ({ pattern: String(p?.pattern || ''), explanation: String(p?.explanation || '') }));

const buildDepthPrompt = (sentence, depth) => {
    const points = pointsOf(sentence.analysis);
    const from = SupportedLanguages[sentence.originalLanguage] || 'Korean';
    const into = SupportedLanguages[sentence.translationLanguage] || 'English';
    return `You help ${into}-speaking learners of ${from}. Below is a ${from} sentence and the grammar points found in it, each with its current explanation.

${GUIDE[depth]}

Write every explanation in ${into}. Keep ${from} forms in ${from} script. Keep the points in the same order and return exactly ${points.length} explanations. Return JSON only: {"explanations": ["...", "..."]}

Sentence: ${sentence.text || sentence.analysis?.sentence?.original || ''}
Translation: ${sentence.analysis?.sentence?.translation || ''}

Grammar points:
${points.map((p, i) => `${i + 1}. ${p.pattern}\n   Current explanation: ${p.explanation}`).join('\n')}`;
};

// The model's answer as a list of explanations, one per grammar point, or null
// when it does not line up with the points.
const parseDepthResponse = (parsed, count) => {
    const list = Array.isArray(parsed) ? parsed : parsed?.explanations;
    if (!Array.isArray(list) || list.length !== count) return null;
    const out = list.map(e => (typeof e === 'string' ? e.trim() : ''));
    if (out.some(e => !e || e.length > MAX_EXPLANATION_CHARS)) return null;
    return out;
};

const createGrammarDepth = ({ generate, getDb }) => {
    const pending = new Map();

    // Explanations for this sentence at this depth, generating and storing them
    // the first time. Standard is the analysis as written.
    const explanationsFor = async (sentence, depth) => {
        const points = pointsOf(sentence.analysis);
        if (!points.length) return [];
        if (depth === 'standard') return points.map(p => p.explanation);
        const stored = sentence.grammarDepth?.[depth];
        if (Array.isArray(stored) && stored.length === points.length) return stored;

        const key = `${sentence.sentenceId}:${depth}`;
        if (pending.has(key)) return pending.get(key);
        const job = (async () => {
            const parsed = await generate(buildDepthPrompt(sentence, depth));
            const explanations = parseDepthResponse(parsed, points.length);
            if (!explanations) throw new Error('Depth rewrite did not match the grammar points');
            await getDb().collection('sentences').updateOne(
                { sentenceId: sentence.sentenceId },
                { $set: { [`grammarDepth.${depth}`]: explanations } },
            );
            return explanations;
        })().finally(() => pending.delete(key));
        pending.set(key, job);
        return job;
    };

    return { explanationsFor };
};

module.exports = { DEPTHS, isDepth, buildDepthPrompt, parseDepthResponse, createGrammarDepth };

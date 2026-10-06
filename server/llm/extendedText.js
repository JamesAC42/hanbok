require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { extractJsonText, isRetryableApiError } = require('./generateResponse');
const { READING_PROMPT } = require('./prompt_extended_reading');
const { EXTENDED_TEXT_ANALYSIS_PROMPT } = require('./prompt_extended_text');

// Model calls for extended text. The reading pass sends a few sentences per
// call and gets back translations, word glosses and grammar tags; the overview
// is one call for the whole passage. Both use a JSON schema (original-language
// fields before translations, which keeps Flash-Lite out of repetition loops)
// and an output cap sized to the input, so a runaway answer is cut off and
// retried instead of running for minutes.
const MODEL = process.env.GEMINI_EXTENDED_MODEL || 'gemini-3.5-flash-lite';
const CALL_TIMEOUT_MS = 45000;
const MAX_ATTEMPTS = 3;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL });

const str = { type: 'string' };
const usesReading = (language) => language === 'ja' || language === 'zh' || language === 'zh-TW';

const readingSchema = (originalLanguage) => ({
    type: 'object',
    properties: {
        sentences: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    n: { type: 'integer' },
                    words: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                text: str,
                                base: str,
                                ...(usesReading(originalLanguage) ? { reading: str } : {}),
                                meaning: str,
                                pos: str
                            },
                            required: ['text', 'base', 'meaning', 'pos']
                        }
                    },
                    grammar: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                pattern: str,
                                text: str,
                                meaning: str,
                                level: { type: 'integer' }
                            },
                            required: ['pattern', 'text', 'meaning']
                        }
                    },
                    translation: str
                },
                required: ['n', 'words', 'grammar', 'translation']
            }
        }
    },
    required: ['sentences']
});

const overviewSchema = {
    type: 'object',
    properties: {
        summary: str,
        level: {
            type: 'object',
            properties: { label: str, scale: str, reason: str },
            required: ['label', 'scale']
        },
        tone: str,
        structure: str,
        themes: { type: 'array', items: str },
        sections: {
            type: 'array',
            items: {
                type: 'object',
                properties: { firstSentence: { type: 'integer' }, title: str, summary: str },
                required: ['firstSentence', 'title']
            }
        },
        keyGrammarPatterns: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    pattern: str,
                    meaning: str,
                    description: str,
                    sentences: { type: 'array', items: { type: 'integer' } }
                },
                required: ['pattern', 'meaning', 'description', 'sentences']
            }
        },
        keyVocabulary: {
            type: 'array',
            items: {
                type: 'object',
                properties: { word: str, meaning: str, sentence: { type: 'integer' } },
                required: ['word', 'meaning']
            }
        },
        culturalContext: str,
        quiz: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    question: str,
                    options: { type: 'array', items: str },
                    answer: { type: 'integer' },
                    explanation: str,
                    sentence: { type: 'integer' }
                },
                required: ['question', 'options', 'answer']
            }
        }
    },
    required: ['summary', 'level', 'tone', 'structure', 'themes', 'sections', 'keyGrammarPatterns', 'keyVocabulary', 'quiz']
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Calls the model and parses its JSON, retrying bad or truncated output and
// transient API errors. `validate` may throw to force a retry.
const callJson = async (prompt, schema, maxOutputTokens, validate, generate = null) => {
    let lastError = null;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        try {
            let raw;
            if (generate) {
                raw = await generate(prompt);
            } else {
                const result = await model.generateContent({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    generationConfig: {
                        responseMimeType: 'application/json',
                        responseJsonSchema: schema,
                        maxOutputTokens
                    }
                }, { timeout: CALL_TIMEOUT_MS });
                raw = result.response.text();
            }
            const parsed = JSON.parse(extractJsonText(raw));
            return validate ? validate(parsed) : parsed;
        } catch (error) {
            lastError = error;
            console.log(`Extended text call failed (attempt ${attempt + 1}): ${String(error?.message || error).slice(0, 200)}`);
            if (isRetryableApiError(error) && attempt < MAX_ATTEMPTS - 1) {
                await sleep(1000 * Math.pow(2, attempt));
            }
        }
    }
    throw lastError || new Error('Extended text call failed');
};

const PUNCTUATION_ONLY = /^[\s\p{P}\p{S}]+$/u;
const EDGE_PUNCTUATION = /^[\s"'“”‘’「」『』《》〈〉()（）[\]{}.,!?。、，！？…·:;~-]+|[\s"'“”‘’「」『』《》〈〉()（）[\]{}.,!?。、，！？…·:;~-]+$/gu;

const cleanText = (value, max = 300) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

// Grammar pattern names: one leading dash for endings, no doubled dashes or
// stray spaces after it, so the same pattern groups together across sentences.
const normalizePattern = (pattern) => cleanText(pattern, 80)
    .replace(/^[-‐–—~〜]+\s*/, (match) => (match.includes('〜') || match.includes('~') ? '〜' : '-'));

const cleanReadingSentence = (item) => {
    const words = (Array.isArray(item.words) ? item.words : [])
        .map((word) => ({
            text: cleanText(word?.text, 60).replace(EDGE_PUNCTUATION, ''),
            base: cleanText(word?.base, 60),
            reading: cleanText(word?.reading, 80) || undefined,
            meaning: cleanText(word?.meaning, 120),
            pos: cleanText(word?.pos, 20).toLowerCase()
        }))
        .filter((word) => word.text && !PUNCTUATION_ONLY.test(word.text))
        .slice(0, 120);
    const grammar = (Array.isArray(item.grammar) ? item.grammar : [])
        .map((point) => ({
            pattern: normalizePattern(point?.pattern),
            text: cleanText(point?.text, 120),
            meaning: cleanText(point?.meaning, 160),
            level: Number.isInteger(point?.level) ? Math.min(Math.max(point.level, 1), 5) : undefined
        }))
        .filter((point) => point.pattern)
        .slice(0, 5);
    return { translation: cleanText(item.translation, 2000), words, grammar };
};

// Reading pass for one chunk. `numbers` are the 1-based sentence numbers in
// the passage, `context` is the sentence before the chunk (or ''). Returns a
// map of sentence number -> { translation, words, grammar }; sentences the
// model skipped are left out so the caller can retry them.
const readChunk = async ({ sentences, numbers, context, originalLanguage, translationLanguage, generate }) => {
    const lines = numbers.map((n, i) => `${n}. ${sentences[i]}`).join('\n');
    const contextBlock = context
        ? `(For context only, the sentence just before these: ${context})\n\n`
        : '';
    const prompt = `${READING_PROMPT(originalLanguage, translationLanguage)}${contextBlock}${lines}`;
    const totalChars = sentences.reduce((sum, s) => sum + s.length, 0);
    const maxOutputTokens = Math.min(16000, 1500 + totalChars * 30 + numbers.length * 300);

    return callJson(prompt, readingSchema(originalLanguage), maxOutputTokens, (parsed) => {
        const results = new Map();
        for (const item of Array.isArray(parsed?.sentences) ? parsed.sentences : []) {
            if (!numbers.includes(item?.n) || results.has(item.n)) continue;
            const cleaned = cleanReadingSentence(item);
            if (!cleaned.translation) continue;
            results.set(item.n, cleaned);
        }
        if (results.size === 0) {
            throw new Error('Reading pass returned no usable sentences');
        }
        return results;
    }, generate);
};

const clampSentence = (value, total) => (
    Number.isInteger(value) && value >= 1 && value <= total ? value : null
);

const cleanOverview = (parsed, total) => {
    const sections = (Array.isArray(parsed.sections) ? parsed.sections : [])
        .map((section) => ({
            firstSentence: clampSentence(section?.firstSentence, total),
            title: cleanText(section?.title, 80),
            summary: cleanText(section?.summary, 400)
        }))
        .filter((section) => section.firstSentence && section.title)
        .sort((a, b) => a.firstSentence - b.firstSentence)
        .filter((section, i, list) => i === 0 || section.firstSentence !== list[i - 1].firstSentence)
        .slice(0, 12);
    if (sections.length > 0) sections[0].firstSentence = 1;

    const keyGrammarPatterns = (Array.isArray(parsed.keyGrammarPatterns) ? parsed.keyGrammarPatterns : [])
        .map((point) => ({
            pattern: normalizePattern(point?.pattern),
            meaning: cleanText(point?.meaning, 160),
            description: cleanText(point?.description, 600),
            sentences: [...new Set((Array.isArray(point?.sentences) ? point.sentences : [])
                .map((n) => clampSentence(n, total))
                .filter(Boolean))].sort((a, b) => a - b).slice(0, 50)
        }))
        .filter((point) => point.pattern)
        .slice(0, 8);

    const keyVocabulary = (Array.isArray(parsed.keyVocabulary) ? parsed.keyVocabulary : [])
        .map((word) => ({
            word: cleanText(word?.word, 60),
            meaning: cleanText(word?.meaning, 160),
            sentence: clampSentence(word?.sentence, total)
        }))
        .filter((word) => word.word && word.meaning)
        .slice(0, 15);

    const quiz = (Array.isArray(parsed.quiz) ? parsed.quiz : [])
        .map((item) => ({
            question: cleanText(item?.question, 400),
            options: (Array.isArray(item?.options) ? item.options : []).map((o) => cleanText(o, 200)).filter(Boolean),
            answer: item?.answer,
            explanation: cleanText(item?.explanation, 400),
            sentence: clampSentence(item?.sentence, total)
        }))
        .filter((item) => item.question && item.options.length >= 2 && item.options.length <= 6
            && Number.isInteger(item.answer) && item.answer >= 0 && item.answer < item.options.length)
        .slice(0, 6);

    const level = parsed.level && typeof parsed.level === 'object' ? {
        label: cleanText(parsed.level.label, 40),
        scale: cleanText(parsed.level.scale, 40),
        reason: cleanText(parsed.level.reason, 300)
    } : null;

    return {
        summary: cleanText(parsed.summary, 1500),
        level,
        tone: cleanText(parsed.tone, 80),
        structure: cleanText(parsed.structure, 400),
        themes: (Array.isArray(parsed.themes) ? parsed.themes : []).map((t) => cleanText(t, 80)).filter(Boolean).slice(0, 6),
        sections,
        keyGrammarPatterns,
        keyVocabulary,
        culturalContext: cleanText(parsed.culturalContext, 1500),
        quiz
    };
};

// One overview for the whole passage. `paragraphs` is the paragraph index of
// each sentence, so blank lines can be put back between paragraphs.
const overview = async ({ sentences, paragraphs, originalLanguage, translationLanguage, generate }) => {
    const lines = sentences.map((sentence, i) => {
        const gap = i > 0 && paragraphs[i] !== paragraphs[i - 1] ? '\n' : '';
        return `${gap}${i + 1}. ${sentence}`;
    }).join('\n');
    const prompt = `${EXTENDED_TEXT_ANALYSIS_PROMPT(originalLanguage, translationLanguage)}${lines}`;
    return callJson(prompt, overviewSchema, 8000, (parsed) => {
        const cleaned = cleanOverview(parsed || {}, sentences.length);
        if (!cleaned.summary) {
            throw new Error('Overview had no summary');
        }
        // `examples` (the original sentences) is the shape older texts stored.
        for (const point of cleaned.keyGrammarPatterns) {
            point.examples = point.sentences.slice(0, 3).map((n) => sentences[n - 1]);
        }
        return cleaned;
    }, generate);
};

module.exports = {
    MODEL,
    readChunk,
    overview,
    readingSchema,
    overviewSchema,
    cleanReadingSentence,
    cleanOverview,
    normalizePattern
};

const { getDb } = require('../../database');
const { newPublicId } = require('../../lib/sentenceKeys');
const generateResponse = require('../../llm/generateResponse');
const { ANALYSIS_TIMEOUT_MS } = require('../../llm/gemini');
const basicPrompt = require('../../llm/prompt');
const chinesePrompt = require('../../llm/prompt_chinese');
const japanesePrompt = require('../../llm/prompt_japanese');
const russianPrompt = require('../../llm/prompt_russian');
const indonesianPrompt = require('../../llm/prompt_indonesian');
const vietnamesePrompt = require('../../llm/prompt_vietnamese');
const hindiPrompt = require('../../llm/prompt_hindi');
const SupportedLanguages = require('../../supported_languages');

// Full breakdown of one sentence of an extended text, made the first time the
// learner opens that sentence and saved like any analyzed sentence (so it
// works with audio, saving and grammar review). The reading pass already
// covered translation and glosses; this is the detailed analysis.
const CONTEXT_CHARS = 1200;

const getSentenceAnalysisPrompt = (originalLanguage) => {
    switch (originalLanguage) {
        case 'zh':
        case 'zh-TW':
            return chinesePrompt.ANALYSIS_PROMPT;
        case 'ja':
            return japanesePrompt.ANALYSIS_PROMPT;
        case 'ru':
            return russianPrompt.ANALYSIS_PROMPT;
        case 'id':
            return indonesianPrompt.ANALYSIS_PROMPT;
        case 'vi':
            return vietnamesePrompt.ANALYSIS_PROMPT;
        case 'hi':
            return hindiPrompt.ANALYSIS_PROMPT;
        default:
            return basicPrompt.ANALYSIS_PROMPT;
    }
};

// The sentence's own paragraph plus neighbors, up to CONTEXT_CHARS, so the
// analysis gets nuance right without sending a 20,000-character passage for
// every sentence.
const buildContext = (reading, index) => {
    const picked = [index];
    let length = reading[index].text.length;
    let before = index - 1;
    let after = index + 1;
    const sameParagraph = (i) => reading[i] && reading[i].paragraph === reading[index].paragraph;
    while (length < CONTEXT_CHARS && (sameParagraph(before) || sameParagraph(after))) {
        if (sameParagraph(before)) {
            picked.unshift(before);
            length += reading[before].text.length;
            before--;
        }
        if (length < CONTEXT_CHARS && sameParagraph(after)) {
            picked.push(after);
            length += reading[after].text.length;
            after++;
        }
    }
    return picked.map((i) => reading[i].text).join(' ');
};

const buildPrompt = (originalLanguage, translationLanguage, context, sentenceText) => {
    const basePrompt = getSentenceAnalysisPrompt(originalLanguage)(originalLanguage, translationLanguage);
    const indicator = `${SupportedLanguages[originalLanguage]} text to analyze: `;
    if (basePrompt.includes(indicator)) {
        return basePrompt.replace(
            indicator,
            `${SupportedLanguages[originalLanguage]} passage around the sentence, for context only (analyze just the target sentence below):\n${context}\n\n${indicator}`
        ) + sentenceText;
    }
    return `${basePrompt}\n\nContext (do not analyze, just use for nuance):\n${context}\n\nTarget sentence:\n${sentenceText}`;
};

const normalizeId = (raw) => {
    const numeric = Number(raw && typeof raw === 'object' && raw.valueOf ? raw.valueOf() : raw);
    return Number.isNaN(numeric) ? raw : numeric;
};

const pending = new Map(); // `${textId}:${index}` -> Promise<sentence doc>

const toPayload = (doc) => ({
    sentenceId: doc.sentenceId,
    publicId: doc.publicId || null,
    text: doc.text,
    analysis: doc.analysis,
    voice1Key: doc.voice1Key || null,
    voice2Key: doc.voice2Key || null,
    voice1SlowKey: doc.voice1SlowKey || null,
    voice2SlowKey: doc.voice2SlowKey || null
});

const findExisting = async (db, textId, index) => {
    const group = await db.collection('extended_text_sentence_groups').findOne(
        { textId },
        { projection: { sentences: 1 } }
    );
    const ref = (group?.sentences || []).find((item) => item.order === index);
    if (!ref) return null;
    return db.collection('sentences').findOne({ sentenceId: ref.sentenceId });
};

const analyzeSentence = async (db, extendedText, index) => {
    const existing = await findExisting(db, extendedText.textId, index);
    if (existing) return existing;

    const { originalLanguage, translationLanguage } = extendedText;
    const sentenceText = extendedText.reading[index].text;
    const prompt = buildPrompt(originalLanguage, translationLanguage, buildContext(extendedText.reading, index), sentenceText);
    const response = await generateResponse(prompt, 'geminiAnalysis', { deadlineMs: 90000, attemptMs: ANALYSIS_TIMEOUT_MS });
    if (!response?.isValid || !response.analysis) {
        throw new Error(response?.error?.message || 'Failed to analyze this sentence. Please try again.');
    }

    const counter = await db.collection('counters').findOneAndUpdate(
        { _id: 'sentenceId' },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' }
    );
    const sentenceDoc = {
        sentenceId: counter.seq,
        publicId: newPublicId(),
        userId: extendedText.userId,
        text: sentenceText,
        analysis: response.analysis,
        originalLanguage,
        translationLanguage,
        dateCreated: new Date(),
        extendedTextId: extendedText.textId
    };
    await db.collection('sentences').insertOne(sentenceDoc);
    await db.collection('extended_text_sentence_groups').updateOne(
        { textId: extendedText.textId },
        { $push: { sentences: { sentenceId: sentenceDoc.sentenceId, order: index } } }
    );
    return sentenceDoc;
};

const analyzeExtendedTextSentence = async (req, res) => {
    const userId = req.session.user ? req.session.user.userId : null;
    if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const textId = parseInt(req.params.textId, 10);
    const index = parseInt(req.params.index, 10);
    if (Number.isNaN(textId) || Number.isNaN(index) || index < 0) {
        return res.status(400).json({ success: false, error: 'Invalid sentence' });
    }

    const db = getDb();
    try {
        const extendedText = await db.collection('extended_texts').findOne(
            { textId },
            { projection: { textId: 1, userId: 1, reading: 1, originalLanguage: 1, translationLanguage: 1 } }
        );
        if (!extendedText) {
            return res.status(404).json({ success: false, error: 'Extended text not found' });
        }
        if (normalizeId(extendedText.userId) !== normalizeId(userId)) {
            return res.status(403).json({ success: false, error: "You don't have permission to access this text" });
        }
        if (!Array.isArray(extendedText.reading) || !extendedText.reading[index]) {
            // Texts from before the reading pass have every sentence analyzed already.
            const existing = await findExisting(db, textId, index);
            if (existing) return res.json({ success: true, sentence: toPayload(existing) });
            return res.status(404).json({ success: false, error: 'Sentence not found' });
        }

        const key = `${textId}:${index}`;
        if (!pending.has(key)) {
            pending.set(key, analyzeSentence(db, extendedText, index).finally(() => pending.delete(key)));
        }
        const sentenceDoc = await pending.get(key);
        return res.json({ success: true, sentence: toPayload(sentenceDoc) });
    } catch (error) {
        console.error('Error analyzing extended text sentence:', error);
        return res.status(500).json({ success: false, error: error.message || 'Failed to analyze this sentence. Please try again.' });
    }
};

module.exports = analyzeExtendedTextSentence;
module.exports.buildContext = buildContext;

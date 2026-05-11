const generateResponse = require('../llm/generateResponse');
const basicPrompt = require('../llm/prompt');
const chinesePrompt = require('../llm/prompt_chinese');
const japanesePrompt = require('../llm/prompt_japanese');
const russianPrompt = require('../llm/prompt_russian');
const indonesianPrompt = require('../llm/prompt_indonesian');
const vietnamesePrompt = require('../llm/prompt_vietnamese');
const hindiPrompt = require('../llm/prompt_hindi');
const { EXTENDED_TEXT_ANALYSIS_PROMPT } = require('../llm/prompt_extended_text');
const { incrementExtendedTextRateLimits } = require('../controllers/auth/extendedTextRateLimits');
const SupportedLanguages = require('../supported_languages');

const getSentenceAnalysisPrompt = (originalLanguage) => {
    switch (originalLanguage) {
        case 'zh':
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

const buildContextualPrompt = (promptFactory, job, sentenceText) => {
    const basePrompt = promptFactory(job.originalLanguage, job.translationLanguage);
    const contextIndicator = `${SupportedLanguages[job.originalLanguage]} text to analyze: `;
    const sanitizedContext = job.text.trim();

    if (basePrompt.includes(contextIndicator)) {
        const contextualized = basePrompt.replace(
            contextIndicator,
            `Full ${SupportedLanguages[job.originalLanguage]} passage for context (use this only to understand nuance; analyze the target sentence below):\n${sanitizedContext}\n\n${contextIndicator}`
        );
        return `${contextualized}${sentenceText}`;
    }

    return `${basePrompt}\n\nContext from the full text (do not analyze separately, just reference for nuance):\n${sanitizedContext}\n\nTarget sentence:\n${sentenceText}`;
};

const safeCallback = (callback, payload) => {
    if (typeof callback === 'function') {
        try {
            callback(payload);
        } catch (err) {
            console.error('Error in progress callback:', err);
        }
    }
};

const processExtendedTextJob = async (job, { db, onProgress, onStatus, onComplete, onError }) => {
    const jobsCollection = db.collection('extended_text_jobs');

    if (!job) {
        safeCallback(onError, { message: 'Job not found.' });
        return;
    }

    if (job.status === 'completed') {
        safeCallback(onComplete, {
            textId: job.textId,
            sentenceCount: job.sentenceCount,
            weeklyQuota: job.weeklyQuota || null
        });
        return;
    }

    if (job.status === 'failed') {
        safeCallback(onError, { message: job.error || 'Job previously failed.' });
        return;
    }

    try {
        await jobsCollection.updateOne(
            { jobId: job.jobId },
            { $set: { status: 'processing', updatedAt: new Date() } }
        );

        safeCallback(onStatus, { status: 'processing' });

        const sentencePromptFactory = getSentenceAnalysisPrompt(job.originalLanguage);
        const sentenceAnalyses = [];
        const totalSentences = job.sentences.length;
        let processedSentences = 0;

        for (let index = 0; index < job.sentences.length; index++) {
            const sentenceText = job.sentences[index];

            safeCallback(onStatus, {
                status: 'analyzing_sentence',
                index: index + 1,
                total: totalSentences
            });

            const promptWithContext = buildContextualPrompt(sentencePromptFactory, job, sentenceText);
            const sentenceResponse = await generateResponse(
                promptWithContext,
                'gemini'
            );

            if (!sentenceResponse.isValid) {
                throw new Error(sentenceResponse.error?.message || 'Failed to analyze one of the sentences. Please try again.');
            }

            if (!sentenceResponse.analysis) {
                throw new Error('Failed to analyze one of the sentences. Please try again.');
            }

            sentenceAnalyses.push({
                text: sentenceText,
                analysis: sentenceResponse.analysis
            });

            processedSentences = index + 1;

            await jobsCollection.updateOne(
                { jobId: job.jobId },
                {
                    $set: {
                        processedSentences,
                        updatedAt: new Date()
                    }
                }
            );

            safeCallback(onProgress, {
                processedSentences,
                totalSentences,
                percentage: Math.round((processedSentences / totalSentences) * 100),
                message: `Analyzing sentence ${processedSentences} of ${totalSentences}`
            });
        }

        safeCallback(onStatus, { status: 'overall_analysis' });

        const overallResponse = await generateResponse(
            EXTENDED_TEXT_ANALYSIS_PROMPT(job.originalLanguage, job.translationLanguage) + job.text,
            'gemini'
        );

        if (!overallResponse.isValid) {
            throw new Error(overallResponse.error?.message || 'Failed to generate the overall analysis.');
        }

        const overallAnalysis = overallResponse.analysis?.overallAnalysis;

        if (!overallAnalysis) {
            throw new Error('Failed to generate the overall analysis for the text. Please try again.');
        }

        safeCallback(onStatus, { status: 'saving_results' });

        const createdAt = new Date();
        const insertedSentenceIds = [];
        const sentenceDocs = [];

        try {
            for (let index = 0; index < sentenceAnalyses.length; index++) {
                const sentenceData = sentenceAnalyses[index];
                const sentenceCounterDoc = await db.collection('counters').findOneAndUpdate(
                    { _id: 'sentenceId' },
                    { $inc: { seq: 1 } },
                    { upsert: true, returnDocument: 'after' }
                );

                const sentenceDoc = {
                    sentenceId: sentenceCounterDoc.seq,
                    userId: job.userId,
                    text: sentenceData.text,
                    analysis: sentenceData.analysis,
                    originalLanguage: job.originalLanguage,
                    translationLanguage: job.translationLanguage,
                    dateCreated: createdAt,
                    extendedTextId: job.textId
                };

                await db.collection('sentences').insertOne(sentenceDoc);
                insertedSentenceIds.push(sentenceDoc.sentenceId);
                sentenceDocs.push(sentenceDoc);
            }

            const sentenceGroupDoc = {
                textId: job.textId,
                userId: job.userId,
                originalLanguage: job.originalLanguage,
                translationLanguage: job.translationLanguage,
                sentences: sentenceDocs.map((doc, index) => ({
                    sentenceId: doc.sentenceId,
                    order: index
                })),
                dateCreated: createdAt
            };

            await db.collection('extended_text_sentence_groups').insertOne(sentenceGroupDoc);

            const extendedTextDoc = {
                textId: job.textId,
                userId: job.userId,
                text: job.text,
                sentenceCount: job.sentenceCount,
                sentenceGroupId: job.textId,
                overallAnalysis,
                originalLanguage: job.originalLanguage,
                translationLanguage: job.translationLanguage,
                title: job.title,
                dateCreated: createdAt
            };

            await db.collection('extended_texts').insertOne(extendedTextDoc);

            await db.collection('feature_usage').updateOne(
                { userId: job.userId, feature: 'extended_text_analysis' },
                {
                    $inc: { count: 1 },
                    $set: { lastUsed: createdAt },
                    $setOnInsert: { firstUsed: createdAt }
                },
                { upsert: true }
            );
        } catch (insertError) {
            if (insertedSentenceIds.length > 0) {
                await db.collection('sentences').deleteMany({
                    sentenceId: { $in: insertedSentenceIds }
                });
            }

            await db.collection('extended_text_sentence_groups').deleteOne({ textId: job.textId });
            await db.collection('extended_texts').deleteOne({ textId: job.textId });

            throw insertError;
        }

        let weeklyQuotaInfo = null;
        if (job.requiresRateLimitUpdate) {
            const identifier = job.userId.toString();
            const identifierType = 'userId';
            weeklyQuotaInfo = await incrementExtendedTextRateLimits(identifier, identifierType, db, 1);
        }

        await jobsCollection.updateOne(
            { jobId: job.jobId },
            {
                $set: {
                    status: 'completed',
                    processedSentences: job.sentenceCount,
                    updatedAt: new Date(),
                    weeklyQuota: weeklyQuotaInfo,
                    resultTextId: job.textId,
                    error: null
                }
            }
        );

        safeCallback(onProgress, {
            processedSentences: job.sentenceCount,
            totalSentences,
            percentage: 100,
            message: 'Extended text analysis complete.'
        });

        safeCallback(onComplete, {
            textId: job.textId,
            sentenceCount: job.sentenceCount,
            weeklyQuota: weeklyQuotaInfo
        });
    } catch (error) {
        console.error(`Error processing extended text job ${job.jobId}:`, error);

        await jobsCollection.updateOne(
            { jobId: job.jobId },
            {
                $set: {
                    status: 'failed',
                    error: error.message,
                    updatedAt: new Date()
                }
            }
        );

        safeCallback(onError, { message: error.message || 'Failed to complete extended text analysis.' });
    }
};

module.exports = processExtendedTextJob;

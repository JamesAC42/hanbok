const extendedTextLlm = require('../llm/extendedText');
const { incrementExtendedTextRateLimits } = require('../controllers/auth/extendedTextRateLimits');

// Extended text runs in two passes:
// 1. A reading pass, a few sentences per call, all in parallel: translation,
//    word glosses and grammar tags for every sentence, plus one overview call
//    for the whole passage. This is what the reader shows, and the text is
//    ready once it finishes.
// 2. The full sentence breakdown (the regular sentence analysis), run only for
//    sentences the learner opens (see analyzeExtendedTextSentence). Long texts
//    stay fast and cheap because most sentences are never broken down.
const READING_CONCURRENCY = parseInt(process.env.EXTENDED_READING_CONCURRENCY, 10) || 8;
const CHUNK_CHARS = 320;
// A text fails only when more than this share of its sentences could not be read.
const MAX_FAILED_SHARE = 0.2;

const safeCallback = (callback, payload) => {
    if (typeof callback === 'function') {
        try {
            callback(payload);
        } catch (err) {
            console.error('Error in progress callback:', err);
        }
    }
};

// Groups consecutive sentences into chunks of about CHUNK_CHARS characters,
// preferring to break at paragraph ends.
const buildChunks = (sentences, paragraphs) => {
    const chunks = [];
    let current = [];
    let length = 0;
    sentences.forEach((sentence, index) => {
        const newParagraph = index > 0 && paragraphs[index] !== paragraphs[index - 1];
        const tooLong = length + sentence.length > CHUNK_CHARS;
        if (current.length > 0 && (tooLong || (newParagraph && length >= CHUNK_CHARS / 2))) {
            chunks.push(current);
            current = [];
            length = 0;
        }
        current.push(index);
        length += sentence.length;
    });
    if (current.length > 0) chunks.push(current);
    return chunks;
};

// Runs `worker` over `items` with at most `limit` running at once.
const runPool = async (items, limit, worker) => {
    let next = 0;
    const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (next < items.length) {
            const item = items[next++];
            await worker(item);
        }
    });
    await Promise.all(runners);
};

const processExtendedTextJob = async (job, { db, onProgress, onStatus, onSentences, onComplete, onError, llm = extendedTextLlm }) => {
    const { readChunk, overview, MODEL } = llm;
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

        const { sentences, originalLanguage, translationLanguage } = job;
        const totalSentences = sentences.length;
        const paragraphs = Array.isArray(job.paragraphs) && job.paragraphs.length === totalSentences
            ? job.paragraphs
            : sentences.map(() => 0);

        // Sentences already read by an earlier run of this job (the server
        // restarted mid-job) are kept.
        const reading = new Array(totalSentences).fill(null);
        for (const [key, value] of Object.entries(job.reading || {})) {
            const index = Number(key);
            if (Number.isInteger(index) && index < totalSentences && value) reading[index] = value;
        }
        let processedSentences = reading.filter(Boolean).length;

        const reportProgress = () => {
            safeCallback(onProgress, {
                processedSentences,
                totalSentences,
                percentage: Math.round((processedSentences / totalSentences) * 100),
                message: `Read ${processedSentences} of ${totalSentences} sentences`
            });
        };

        const saveSentences = async (indices) => {
            const update = { processedSentences, updatedAt: new Date() };
            for (const index of indices) update[`reading.${index}`] = reading[index];
            await jobsCollection.updateOne({ jobId: job.jobId }, { $set: update });
            safeCallback(onSentences, {
                sentences: indices.map((index) => ({ index, paragraph: paragraphs[index], text: sentences[index], ...reading[index] }))
            });
            reportProgress();
        };

        const readIndices = async (indices) => {
            const context = indices[0] > 0 ? sentences[indices[0] - 1] : '';
            const results = await readChunk({
                sentences: indices.map((i) => sentences[i]),
                numbers: indices.map((i) => i + 1),
                context,
                originalLanguage,
                translationLanguage
            });
            const done = [];
            for (const index of indices) {
                const result = results.get(index + 1);
                if (result) {
                    reading[index] = result;
                    done.push(index);
                }
            }
            return done;
        };

        const pendingChunks = buildChunks(sentences, paragraphs)
            .map((chunk) => chunk.filter((index) => !reading[index]))
            .filter((chunk) => chunk.length > 0);

        const readAll = runPool(pendingChunks, READING_CONCURRENCY, async (chunk) => {
            let done = [];
            try {
                done = await readIndices(chunk);
            } catch (error) {
                console.error(`Reading pass failed for sentences ${chunk[0] + 1}-${chunk[chunk.length - 1] + 1} of job ${job.jobId}:`, error.message);
            }
            // Anything the chunk call skipped gets one more try on its own.
            for (const index of chunk.filter((i) => !reading[i])) {
                try {
                    done.push(...await readIndices([index]));
                } catch (error) {
                    console.error(`Reading pass failed for sentence ${index + 1} of job ${job.jobId}:`, error.message);
                }
            }
            processedSentences = reading.filter(Boolean).length;
            if (done.length > 0) await saveSentences(done);
        });

        const overviewPromise = job.overallAnalysis
            ? Promise.resolve(job.overallAnalysis)
            : overview({ sentences, paragraphs, originalLanguage, translationLanguage })
                .then(async (result) => {
                    await jobsCollection.updateOne({ jobId: job.jobId }, { $set: { overallAnalysis: result } });
                    return result;
                })
                .catch((error) => {
                    console.error(`Overview failed for job ${job.jobId}:`, error.message);
                    return null;
                });

        reportProgress();
        const [overallAnalysis] = await Promise.all([overviewPromise, readAll]);

        const failed = reading.filter((item) => !item).length;
        if (failed > totalSentences * MAX_FAILED_SHARE) {
            throw new Error('We could not read enough of this text. Please try again in a moment.');
        }

        safeCallback(onStatus, { status: 'saving_results' });

        const createdAt = new Date();
        const readingDocs = sentences.map((text, index) => ({
            text,
            paragraph: paragraphs[index],
            ...(reading[index] || { failed: true })
        }));

        try {
            await db.collection('extended_text_sentence_groups').insertOne({
                textId: job.textId,
                userId: job.userId,
                originalLanguage,
                translationLanguage,
                sentences: [],
                dateCreated: createdAt
            });

            await db.collection('extended_texts').insertOne({
                textId: job.textId,
                userId: job.userId,
                text: job.text,
                sentenceCount: job.sentenceCount,
                sentenceGroupId: job.textId,
                overallAnalysis: overallAnalysis || {},
                reading: readingDocs,
                pipelineVersion: 2,
                model: MODEL,
                originalLanguage,
                translationLanguage,
                title: job.title,
                dateCreated: createdAt
            });

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
            await db.collection('extended_text_sentence_groups').deleteOne({ textId: job.textId });
            await db.collection('extended_texts').deleteOne({ textId: job.textId });
            throw insertError;
        }

        let weeklyQuotaInfo = null;
        if (job.requiresRateLimitUpdate) {
            weeklyQuotaInfo = await incrementExtendedTextRateLimits(job.userId.toString(), 'userId', db, 1);
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
                },
                // The finished text holds the reading data now.
                $unset: { reading: '', overallAnalysis: '' }
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
module.exports.buildChunks = buildChunks;
module.exports.runPool = runPool;

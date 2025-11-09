const { getDb } = require('../../database');
const processExtendedTextJob = require('../../services/extendedTextProcessor');

const listeners = new Map(); // jobId -> Set of response objects
const activeJobs = new Set(); // jobIds currently being processed

const normalizeId = (raw) => {
    if (raw == null) {
        return raw;
    }
    let value = raw;
    if (typeof value === 'object' && typeof value.valueOf === 'function') {
        value = value.valueOf();
    }
    const numericValue = Number(value);
    if (!Number.isNaN(numericValue)) {
        return numericValue;
    }
    return value;
};

const sendEvent = (res, event, data) => {
    if (!res || res.writableEnded) {
        return;
    }

    try {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (err) {
        // Ignore write errors; the listener cleanup will handle removal
        console.error('Error sending SSE event:', err);
    }
};

const removeListener = (jobId, res) => {
    const jobListeners = listeners.get(jobId);
    if (!jobListeners) {
        return;
    }

    jobListeners.delete(res);
    if (jobListeners.size === 0) {
        listeners.delete(jobId);
    }
};

const broadcast = (jobId, event, payload, { endStream = false } = {}) => {
    const jobListeners = listeners.get(jobId);
    if (!jobListeners) {
        return;
    }

    for (const res of jobListeners) {
        sendEvent(res, event, payload);
        if (endStream) {
            res.end();
        }
    }

    if (endStream) {
        listeners.delete(jobId);
    }
};

const streamExtendedTextProgress = async (req, res) => {
    const { jobId: jobIdParam } = req.params;
    const userId = req.session.user ? req.session.user.userId : null;

    if (!userId) {
        return res.status(401).end();
    }

    const jobId = parseInt(jobIdParam, 10);
    if (Number.isNaN(jobId)) {
        return res.status(400).json({ error: 'Invalid job ID' });
    }

    const db = getDb();
    const jobsCollection = db.collection('extended_text_jobs');

    const job = await jobsCollection.findOne({ jobId });

    if (!job) {
        return res.status(404).json({ error: 'Job not found' });
    }

    const jobOwnerId = normalizeId(job.userId);
    const requesterId = normalizeId(userId);

    if (jobOwnerId !== requesterId) {
        return res.status(403).json({ error: 'You do not have access to this job' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (typeof res.flushHeaders === 'function') {
        res.flushHeaders();
    }
    res.write('retry: 2000\n\n');

    const heartbeat = setInterval(() => {
        if (!res.writableEnded) {
            res.write(':keep-alive\n\n');
        }
    }, 15000);

    sendEvent(res, 'init', {
        status: job.status,
        processedSentences: job.processedSentences || 0,
        totalSentences: job.sentenceCount,
        sentenceCount: job.sentenceCount
    });

    if (job.status === 'completed') {
        sendEvent(res, 'completed', {
            textId: job.textId,
            sentenceCount: job.sentenceCount,
            weeklyQuota: job.weeklyQuota || null
        });
        clearInterval(heartbeat);
        return res.end();
    }

    if (job.status === 'failed') {
        sendEvent(res, 'jobError', {
            message: job.error || 'Extended text analysis failed.'
        });
        clearInterval(heartbeat);
        return res.end();
    }

    if (!listeners.has(jobId)) {
        listeners.set(jobId, new Set());
    }
    listeners.get(jobId).add(res);

    req.on('close', () => {
        clearInterval(heartbeat);
        removeListener(jobId, res);
    });

    if (activeJobs.has(jobId)) {
        return;
    }

    activeJobs.add(jobId);

    processExtendedTextJob(job, {
        db,
        onStatus: (statusPayload) => {
            broadcast(jobId, 'status', statusPayload);
        },
        onProgress: (progressPayload) => {
            broadcast(jobId, 'progress', progressPayload);
        },
        onComplete: (completionPayload) => {
            broadcast(jobId, 'completed', completionPayload, { endStream: true });
            activeJobs.delete(jobId);
            clearInterval(heartbeat);
        },
        onError: (errorPayload) => {
            broadcast(jobId, 'jobError', errorPayload, { endStream: true });
            activeJobs.delete(jobId);
            clearInterval(heartbeat);
        }
    }).catch((err) => {
        console.error(`Unexpected error processing job ${jobId}:`, err);
        broadcast(jobId, 'jobError', { message: 'Unexpected error while processing extended text.' }, { endStream: true });
        activeJobs.delete(jobId);
        clearInterval(heartbeat);
    });
};

module.exports = streamExtendedTextProgress;

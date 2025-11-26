const { getDb } = require('../../database');
const { generateSpeech } = require('../../elevenlabs/generateSpeech');
const getPreviousSunday = require('../../utils/getPreviousSunday');

const AUDIO_WEEKLY_QUOTA = 10;

const ensureRateLimitRecord = async (db, identifier, identifierType, weekStartDate) => {
    let rateLimitRecord = await db.collection('rate_limits').findOne({ identifier, identifierType });

    if (!rateLimitRecord) {
        rateLimitRecord = {
            identifier,
            identifierType,
            totalSentences: 0,
            weekSentences: 0,
            weekStartDate,
            weekExtendedTextAnalyses: 0,
            totalExtendedTextAnalyses: 0,
            totalAudioGenerations: 0,
            weekAudioGenerations: 0,
            lastUpdated: new Date()
        };
        await db.collection('rate_limits').insertOne(rateLimitRecord);
        return rateLimitRecord;
    }

    if (rateLimitRecord.weekStartDate < weekStartDate) {
        await db.collection('rate_limits').updateOne(
            { identifier, identifierType },
            { 
                $set: { 
                    weekSentences: 0,
                    weekExtendedTextAnalyses: 0,
                    weekAudioGenerations: 0,
                    weekStartDate,
                    lastUpdated: new Date()
                }
            }
        );
        rateLimitRecord.weekSentences = 0;
        rateLimitRecord.weekExtendedTextAnalyses = 0;
        rateLimitRecord.weekAudioGenerations = 0;
        rateLimitRecord.weekStartDate = weekStartDate;
    }

    if (rateLimitRecord.weekAudioGenerations === undefined) {
        await db.collection('rate_limits').updateOne(
            { identifier, identifierType },
            { 
                $set: { 
                    weekAudioGenerations: 0,
                    totalAudioGenerations: rateLimitRecord.totalAudioGenerations || 0
                }
            }
        );
        rateLimitRecord.weekAudioGenerations = 0;
        rateLimitRecord.totalAudioGenerations = rateLimitRecord.totalAudioGenerations || 0;
    }

    return rateLimitRecord;
};

const buildQuotaError = (remaining = 0) => ({
    success: false,
    error: 'No remaining audio generations available',
    code: 'AUDIO_QUOTA_EXCEEDED',
    remaining
});

const generateAudio = async (req, res) => {
    const { sentenceId } = req.params;
    const userId = req.session?.user?.userId || null;
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const weekStartDate = getPreviousSunday();

    try {
        const db = getDb();

        const sentence = await db.collection('sentences').findOne({ 
            sentenceId: parseInt(sentenceId)
        });

        if (!sentence) {
            return res.status(404).json({ 
                success: false,
                error: 'Sentence not found'
            });
        }

        if (sentence.userId && userId !== sentence.userId) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized to generate audio for this sentence'
            });
        }

        let user = null;
        let remainingGenerations = null;
        let rateLimitRecord = null;

        if (userId !== null) {
            user = await db.collection('users').findOne({ userId });
            if (!user) {
                return res.status(403).json(buildQuotaError());
            }

            if (user.tier === 0 || user.tier === 1) {
                const saved = user.remainingAudioGenerations ?? 0;
                if (saved <= 0) {
                    return res.status(429).json(buildQuotaError(0));
                }
                remainingGenerations = saved;
            }
        } else {
            rateLimitRecord = await ensureRateLimitRecord(db, ipAddress, 'ipAddress', weekStartDate);
            const usedAudio = rateLimitRecord.weekAudioGenerations || 0;
            remainingGenerations = Math.max(AUDIO_WEEKLY_QUOTA - usedAudio, 0);
            if (remainingGenerations <= 0) {
                return res.status(429).json(buildQuotaError(0));
            }
        }

        // Generate speech audio
        let textToRead;
        if (sentence.originalLanguage === 'ja') {
            textToRead = sentence?.analysis?.sentence?.reading ?? sentence.text;
        } else {
            textToRead = sentence.text;
        }
        const [normalAudio, slowAudio] = await Promise.all([
            generateSpeech(textToRead),
            generateSpeech(textToRead, { speed: 0.7 })
        ]);

        await db.collection('sentences').updateOne(
            { sentenceId: parseInt(sentenceId) },
            { 
                $set: { 
                    voice1Key: normalAudio.voice1,
                    voice2Key: normalAudio.voice2,
                    voice1SlowKey: slowAudio.voice1,
                    voice2SlowKey: slowAudio.voice2,
                    dateAudioGenerated: new Date()
                }
            }
        );

        // Track usage after successful generation
        if (userId) {
            await db.collection('feature_usage').updateOne(
                { userId: userId, feature: 'audio_generation' },
                { 
                    $inc: { count: 1 },
                    $set: { lastUsed: new Date() },
                    $setOnInsert: { firstUsed: new Date() }
                },
                { upsert: true }
            );
        }

        let remainingAfterGeneration = null;

        if (user && (user.tier === 0 || user.tier === 1)) {
            await db.collection('users').updateOne(
                { userId },
                [
                    {
                        $set: {
                            remainingAudioGenerations: {
                                $max: [0, { $subtract: ['$remainingAudioGenerations', 1] }]
                            }
                        }
                    }
                ]
            );
            remainingAfterGeneration = Math.max((user.remainingAudioGenerations || 0) - 1, 0);
        }

        if (!userId && rateLimitRecord) {
            await db.collection('rate_limits').updateOne(
                { identifier: ipAddress, identifierType: 'ipAddress' },
                { 
                    $inc: { 
                        totalAudioGenerations: 1,
                        weekAudioGenerations: 1
                    },
                    $set: { lastUpdated: new Date() }
                }
            );
            remainingAfterGeneration = Math.max(remainingGenerations - 1, 0);
        }

        res.json({ 
            success: true,
            voice1: normalAudio.voice1,
            voice2: normalAudio.voice2,
            voice1Slow: slowAudio.voice1,
            voice2Slow: slowAudio.voice2,
            remainingGenerations: remainingAfterGeneration
        });

    } catch (error) {
        console.error('Error generating audio:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to generate audio'
        });
    }
};

module.exports = generateAudio; 

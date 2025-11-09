const getPreviousSunday = require('../../utils/getPreviousSunday');

const FREE_TIER_WEEKLY_ANALYSIS_LIMIT = 2; // Free users can run 2 extended analyses per week

// Check if user has exceeded their rate limit quota for extended text
const checkExtendedTextRateLimits = async (req, db, options = {}) => {
    const requestedAnalyses = options.requestedAnalyses ?? 1;
    const userId = req.session.user ? req.session.user.userId : null;
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const weekStartDate = getPreviousSunday();
    const existingUser = options.user || null;
    let user = existingUser;

    // Skip rate limiting for paid users
    if (userId !== null) {
        if (!user) {
            user = await db.collection('users').findOne({ userId });
        }

        // Skip rate limiting for paid users (tier > 0)
        if (user && user.tier > 0) {
            return {
                hasQuota: true,
                message: null,
                user
            };
        }
    }

    // Determine identifier for rate limiting
    const identifier = userId !== null ? userId.toString() : ipAddress;
    const identifierType = userId !== null ? 'userId' : 'ipAddress';

    // Get or create rate limit record
    let rateLimitRecord = await db.collection('rate_limits').findOne({
        identifier,
        identifierType
    });

    if (!rateLimitRecord) {
        // Create new record if we don't have one yet
        rateLimitRecord = {
            identifier,
            identifierType,
            totalSentences: 0,
            weekSentences: 0,
            weekStartDate,
            weekExtendedTextAnalyses: 0,
            totalExtendedTextAnalyses: 0,
            lastUpdated: new Date()
        };
        await db.collection('rate_limits').insertOne(rateLimitRecord);
    } else if (rateLimitRecord.weekStartDate < weekStartDate) {
        // Reset weekly counter if we're in a new week
        await db.collection('rate_limits').updateOne(
            { identifier, identifierType },
            {
                $set: {
                    weekSentences: 0,
                    weekExtendedTextAnalyses: 0,
                    weekStartDate,
                    lastUpdated: new Date()
                }
            }
        );
        rateLimitRecord.weekSentences = 0;
        rateLimitRecord.weekExtendedTextAnalyses = 0;
        rateLimitRecord.weekStartDate = weekStartDate;
    }

    // Initialize extended text counters if they don't exist
    if (rateLimitRecord.weekExtendedTextAnalyses === undefined) {
        rateLimitRecord.weekExtendedTextAnalyses = 0;
        await db.collection('rate_limits').updateOne(
            { identifier, identifierType },
            {
                $set: { weekExtendedTextAnalyses: 0 },
                $unset: { weekExtendedTextSentences: '' }
            }
        );
    }
    if (rateLimitRecord.totalExtendedTextAnalyses === undefined) {
        rateLimitRecord.totalExtendedTextAnalyses = 0;
        await db.collection('rate_limits').updateOne(
            { identifier, identifierType },
            {
                $set: { totalExtendedTextAnalyses: 0 },
                $unset: { totalExtendedTextSentences: '' }
            }
        );
    }

    // Check if user would exceed the weekly quota with this submission
    const projectedTotal = rateLimitRecord.weekExtendedTextAnalyses + requestedAnalyses;
    const hasQuota = projectedTotal <= FREE_TIER_WEEKLY_ANALYSIS_LIMIT;

    // Create appropriate message for quota exceeded
    const remainingQuota = Math.max(FREE_TIER_WEEKLY_ANALYSIS_LIMIT - rateLimitRecord.weekExtendedTextAnalyses, 0);
    const message = hasQuota
        ? null
        : {
              type: 'rate_limit_exceeded',
              message: `You have ${remainingQuota} extended analysis credit${remainingQuota === 1 ? '' : 's'} remaining this week. Upgrade to unlock unlimited extended analyses.`,
              remaining: remainingQuota,
              requested: requestedAnalyses
          };

    return {
        hasQuota,
        message,
        rateLimitRecord,
        user
    };
};

// Update rate limits after successful extended text generation
const incrementExtendedTextRateLimits = async (identifier, identifierType, db, analysisCount = 1) => {
    await db.collection('rate_limits').updateOne(
        { identifier, identifierType },
        {
            $inc: {
                totalExtendedTextAnalyses: analysisCount,
                weekExtendedTextAnalyses: analysisCount
            },
            $set: { lastUpdated: new Date() }
        }
    );

    // Get the updated record to return quota info
    const updatedRecord = await db.collection('rate_limits').findOne({ identifier, identifierType });

    const weekAnalysesUsed = updatedRecord.weekExtendedTextAnalyses || 0;
    const remaining = Math.max(FREE_TIER_WEEKLY_ANALYSIS_LIMIT - weekAnalysesUsed, 0);

    return {
        weekAnalysesUsed,
        weekAnalysesTotal: FREE_TIER_WEEKLY_ANALYSIS_LIMIT,
        weekAnalysesRemaining: remaining
    };
};

module.exports = {
    FREE_TIER_WEEKLY_ANALYSIS_LIMIT,
    checkExtendedTextRateLimits,
    incrementExtendedTextRateLimits
};

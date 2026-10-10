// Weekly free sentence analyses. Signed-out visitors get a smaller taste
// (tracked by IP) so that a free account, which unlocks the full allowance
// plus saving, is worth making.
const FREE_WEEKLY_SENTENCES = 10;

const anonWeeklySentences = () => {
    const value = parseInt(process.env.ANON_WEEKLY_SENTENCES, 10);
    if (Number.isNaN(value) || value < 0) return 3;
    return Math.min(value, FREE_WEEKLY_SENTENCES);
};

const weeklySentenceQuota = (identifierType) =>
    identifierType === 'ipAddress' ? anonWeeklySentences() : FREE_WEEKLY_SENTENCES;

const quotaExceededMessage = (identifierType) => {
    if (identifierType === 'ipAddress') {
        return {
            type: 'signup_required',
            message: `You've used your ${anonWeeklySentences()} free tries this week. Create a free account to get ${FREE_WEEKLY_SENTENCES} analyses a week and save every breakdown.`,
            remaining: 0
        };
    }
    return {
        type: 'rate_limit_exceeded',
        message: `You have used all ${FREE_WEEKLY_SENTENCES} of your free weekly sentence analyses. Upgrade to Premium for unlimited analyses for $4/month or purchase 100 additional analyses for $1.`,
        remaining: 0
    };
};

module.exports = {
    FREE_WEEKLY_SENTENCES,
    anonWeeklySentences,
    weeklySentenceQuota,
    quotaExceededMessage
};

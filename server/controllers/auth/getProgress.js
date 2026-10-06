const { getDb } = require('../../database');
const {
    DAY_MS,
    isValidTimeZone,
    lastDayKeys,
    buildSeries,
    computeStreak,
    sumRange,
} = require('../../lib/progressSeries');

// Days of history used for streaks; charts get the last `days` of it.
const HISTORY_DAYS = 371;
const MATURE_INTERVAL_DAYS = 21;

const perDay = (collection, match, dateField, timeZone, countExpr = 1) =>
    collection.aggregate([
        { $match: match },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: `$${dateField}`, timezone: timeZone } },
                count: { $sum: countExpr },
            },
        },
    ]).toArray();

const mergeCounts = (a, b) => {
    const byDay = new Map(a.map((row) => [row._id, row.count]));
    b.forEach((row) => byDay.set(row._id, (byDay.get(row._id) || 0) + row.count));
    return [...byDay].map(([_id, count]) => ({ _id, count }));
};

/**
 * Activity and progress over time for the signed-in Home page:
 * per-day analyses, saved words and flashcard reviews, totals and a streak.
 */
async function getProgress(req, res) {
    try {
        const db = getDb();
        const userId = req.session.user.userId;
        const timeZone = isValidTimeZone(req.query.tz) ? req.query.tz : 'UTC';
        const requestedDays = parseInt(req.query.days, 10);
        const days = Number.isInteger(requestedDays) ? Math.min(Math.max(requestedDays, 7), HISTORY_DAYS) : 84;

        const since = new Date(Date.now() - HISTORY_DAYS * DAY_MS);
        const weekAgo = new Date(Date.now() - 7 * DAY_MS);

        const [analyzed, wordsSaved, reviews, grammarPractice, totalSentences, totalWords, wordsThisWeek, mastered] = await Promise.all([
            perDay(db.collection('sentences'), { userId, dateCreated: { $gte: since } }, 'dateCreated', timeZone),
            perDay(db.collection('words'), { userId, dateSaved: { $gte: since } }, 'dateSaved', timeZone),
            perDay(
                db.collection('study_progress'),
                { userId, date: { $gte: since } },
                'date',
                // study_progress rows are already day buckets (server-local midnight)
                'UTC',
                { $add: [{ $ifNull: ['$newCardsStudied', 0] }, { $ifNull: ['$reviewsCompleted', 0] }] }
            ),
            // Grammar questions answered on the path (Review answers are already in study_progress)
            perDay(db.collection('grammar_practice_log'), { userId, kind: 'question', context: 'path', date: { $gte: since } }, 'date', timeZone),
            db.collection('sentences').countDocuments({ userId }),
            db.collection('words').countDocuments({ userId }),
            db.collection('words').countDocuments({ userId, dateSaved: { $gte: weekAgo } }),
            db.collection('flashcards').countDocuments({
                userId,
                contentType: 'word',
                intervalDays: { $gte: MATURE_INTERVAL_DAYS },
            }),
        ]);

        const keys = lastDayKeys(HISTORY_DAYS, timeZone);
        const history = buildSeries(keys, { analyzed, wordsSaved, reviews: mergeCounts(reviews, grammarPractice) });
        const streak = computeStreak(history);
        const series = history.slice(-days);
        const lastWeekStart = history.length - 7;

        res.json({
            success: true,
            timeZone,
            days: series,
            streak,
            totals: {
                sentences: totalSentences,
                words: totalWords,
                wordsThisWeek,
                masteredWords: mastered,
                analyzedThisWeek: sumRange(history, 'analyzed', lastWeekStart),
                reviewsThisWeek: sumRange(history, 'reviews', lastWeekStart),
            },
        });
    } catch (error) {
        console.error('Error getting progress:', error);
        res.status(500).json({ success: false, error: 'Failed to get progress' });
    }
}

module.exports = getProgress;

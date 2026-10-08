const { getDb } = require('../../database');
const {
    DAY_MS,
    isValidTimeZone,
    computeStreak,
    sumRange,
} = require('../../lib/progressSeries');
const { activityHistory } = require('../../lib/userActivity');

// Days of history used for streaks; charts get the last `days` of it.
const HISTORY_DAYS = 371;
const MATURE_INTERVAL_DAYS = 21;

/**
 * Activity and progress over time for the signed-in Home page:
 * per-day analyses, saved words and flashcard reviews, totals and a streak.
 */
async function getProgress(req, res) {
    try {
        const db = getDb();
        const userId = req.session.user.userId;
        const timeZone = isValidTimeZone(req.query.tz) ? req.query.tz : 'UTC';
        // Remember the learner's time zone so streak reminders go out in their evening
        if (isValidTimeZone(req.query.tz)) {
            db.collection('users').updateOne(
                { userId, timeZone: { $ne: timeZone } },
                { $set: { timeZone } }
            ).catch((error) => console.error('Error saving time zone:', error));
        }
        const requestedDays = parseInt(req.query.days, 10);
        const days = Number.isInteger(requestedDays) ? Math.min(Math.max(requestedDays, 7), HISTORY_DAYS) : 84;

        const weekAgo = new Date(Date.now() - 7 * DAY_MS);

        const [history, totalSentences, totalWords, wordsThisWeek, mastered] = await Promise.all([
            activityHistory(db, userId, timeZone, HISTORY_DAYS),
            db.collection('sentences').countDocuments({ userId }),
            db.collection('words').countDocuments({ userId }),
            db.collection('words').countDocuments({ userId, dateSaved: { $gte: weekAgo } }),
            db.collection('flashcards').countDocuments({
                userId,
                contentType: 'word',
                intervalDays: { $gte: MATURE_INTERVAL_DAYS },
            }),
        ]);

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

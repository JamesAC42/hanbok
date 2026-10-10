const { DAY_MS, lastDayKeys, buildSeries } = require('./progressSeries');

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

// Per-day analyses, saved words and reviews for the last `days` days in the
// learner's time zone, oldest first. This is what streaks are counted from.
const activityHistory = async (db, userId, timeZone, days, now = new Date()) => {
    const since = new Date(now.getTime() - days * DAY_MS);
    const [analyzed, wordsSaved, reviews, grammarPractice] = await Promise.all([
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
    ]);
    const keys = lastDayKeys(days, timeZone, now);
    return buildSeries(keys, { analyzed, wordsSaved, reviews: mergeCounts(reviews, grammarPractice) });
};

module.exports = { activityHistory };

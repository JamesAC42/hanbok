// Pure helpers for the progress endpoint, kept separate so they can be tested
// without a database.

const DAY_MS = 24 * 60 * 60 * 1000;

const isValidTimeZone = (tz) => {
    if (typeof tz !== 'string' || !tz || tz.length > 64) return false;
    try {
        new Intl.DateTimeFormat('en-US', { timeZone: tz });
        return true;
    } catch {
        return false;
    }
};

// YYYY-MM-DD for a date in the given time zone.
const dayKey = (date, timeZone) => {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(date);
    const get = (type) => parts.find(p => p.type === type).value;
    return `${get('year')}-${get('month')}-${get('day')}`;
};

// The last `count` day keys ending today, oldest first.
const lastDayKeys = (count, timeZone, now = new Date()) => {
    const keys = [];
    for (let i = count - 1; i >= 0; i--) {
        keys.push(dayKey(new Date(now.getTime() - i * DAY_MS), timeZone));
    }
    // DST shifts can repeat a key; keep each day once.
    return [...new Set(keys)];
};

// Merge per-day counts ({ metric: [{ _id: 'YYYY-MM-DD', count }] }) into one
// series covering every day in `keys`.
const buildSeries = (keys, countsByMetric) => {
    const series = keys.map(date => ({ date, analyzed: 0, wordsSaved: 0, reviews: 0 }));
    const index = new Map(series.map((day, i) => [day.date, i]));
    for (const [metric, rows] of Object.entries(countsByMetric)) {
        for (const row of rows || []) {
            const i = index.get(row._id);
            if (i !== undefined) series[i][metric] += row.count || 0;
        }
    }
    return series;
};

const isActive = (day) => day.analyzed > 0 || day.wordsSaved > 0 || day.reviews > 0;

// Current streak counts back from today; if today has no activity yet the
// streak from yesterday still stands.
const computeStreak = (series) => {
    let best = 0;
    let run = 0;
    for (const day of series) {
        run = isActive(day) ? run + 1 : 0;
        best = Math.max(best, run);
    }
    const last = series.length - 1;
    const activeToday = last >= 0 && isActive(series[last]);
    let current = 0;
    for (let i = activeToday ? last : last - 1; i >= 0 && isActive(series[i]); i--) {
        current++;
    }
    return { current, best, activeToday };
};

const sumRange = (series, metric, fromIndex) =>
    series.slice(Math.max(0, fromIndex)).reduce((sum, day) => sum + day[metric], 0);

module.exports = {
    DAY_MS,
    isValidTimeZone,
    dayKey,
    lastDayKeys,
    buildSeries,
    computeStreak,
    sumRange,
};

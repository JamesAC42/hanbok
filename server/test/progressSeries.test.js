const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
    isValidTimeZone,
    dayKey,
    lastDayKeys,
    buildSeries,
    computeStreak,
    sumRange,
} = require('../lib/progressSeries');

const day = (date, analyzed = 0, wordsSaved = 0, reviews = 0) => ({ date, analyzed, wordsSaved, reviews });

test('isValidTimeZone accepts IANA zones and rejects junk', () => {
    assert.equal(isValidTimeZone('America/New_York'), true);
    assert.equal(isValidTimeZone('UTC'), true);
    assert.equal(isValidTimeZone('Not/AZone'), false);
    assert.equal(isValidTimeZone(''), false);
    assert.equal(isValidTimeZone({ $ne: 1 }), false);
});

test('dayKey uses the requested time zone', () => {
    const date = new Date('2026-10-04T02:00:00Z');
    assert.equal(dayKey(date, 'UTC'), '2026-10-04');
    assert.equal(dayKey(date, 'America/Los_Angeles'), '2026-10-03');
});

test('lastDayKeys ends today and runs oldest first', () => {
    const keys = lastDayKeys(3, 'UTC', new Date('2026-10-04T12:00:00Z'));
    assert.deepEqual(keys, ['2026-10-02', '2026-10-03', '2026-10-04']);
});

test('buildSeries fills every day and ignores counts outside the range', () => {
    const series = buildSeries(['2026-10-03', '2026-10-04'], {
        analyzed: [{ _id: '2026-10-04', count: 2 }, { _id: '2025-01-01', count: 9 }],
        reviews: [{ _id: '2026-10-03', count: 5 }],
    });
    assert.deepEqual(series, [day('2026-10-03', 0, 0, 5), day('2026-10-04', 2, 0, 0)]);
});

test('computeStreak keeps yesterday\'s streak when today is still empty', () => {
    const series = [day('a', 1), day('b'), day('c', 0, 1), day('d', 0, 0, 3), day('e')];
    assert.deepEqual(computeStreak(series), { current: 2, best: 2, activeToday: false });
});

test('computeStreak counts today once there is activity', () => {
    const series = [day('a', 1), day('b', 1), day('c'), day('d', 1)];
    assert.deepEqual(computeStreak(series), { current: 1, best: 2, activeToday: true });
});

test('computeStreak is zero with no recent activity', () => {
    assert.deepEqual(computeStreak([day('a', 1), day('b'), day('c')]), { current: 0, best: 1, activeToday: false });
    assert.deepEqual(computeStreak([]), { current: 0, best: 0, activeToday: false });
});

test('sumRange adds a metric from an index to the end', () => {
    assert.equal(sumRange([day('a', 1), day('b', 2), day('c', 3)], 'analyzed', 1), 5);
    assert.equal(sumRange([day('a', 1)], 'analyzed', -4), 1);
});

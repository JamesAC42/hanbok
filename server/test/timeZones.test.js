const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mongoTimeZone, utcOffset } = require('../lib/progressSeries');
const { perDay } = require('../lib/userActivity');

test('mongoTimeZone maps old browser zone names to current IANA names', () => {
    assert.equal(mongoTimeZone('Asia/Calcutta'), 'Asia/Kolkata');
    assert.equal(mongoTimeZone('Asia/Saigon'), 'Asia/Ho_Chi_Minh');
    assert.equal(mongoTimeZone('America/New_York'), 'America/New_York');
});

test('utcOffset gives a MongoDB-style offset', () => {
    assert.equal(utcOffset('Asia/Calcutta'), '+05:30');
    assert.equal(utcOffset('UTC'), '+00:00');
    assert.equal(utcOffset('America/New_York', new Date('2026-01-15T12:00:00Z')), '-05:00');
});

test('perDay retries with the UTC offset when MongoDB rejects the zone', async () => {
    const seen = [];
    const collection = {
        aggregate: (pipeline) => ({
            toArray: async () => {
                const tz = pipeline[1].$group._id.$dateToString.timezone;
                seen.push(tz);
                if (tz.includes('/')) throw Object.assign(new Error('unrecognized time zone identifier'), { code: 40485 });
                return [{ _id: '2026-10-11', count: 2 }];
            },
        }),
    };
    const rows = await perDay(collection, {}, 'date', 'Asia/Rangoon');
    assert.deepEqual(rows, [{ _id: '2026-10-11', count: 2 }]);
    assert.deepEqual(seen, ['Asia/Yangon', '+06:30']);
});

test('perDay passes other database errors through', async () => {
    const collection = { aggregate: () => ({ toArray: async () => { throw Object.assign(new Error('boom'), { code: 1 }); } }) };
    await assert.rejects(perDay(collection, {}, 'date', 'UTC'), /boom/);
});

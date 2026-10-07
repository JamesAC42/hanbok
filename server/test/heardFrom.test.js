const test = require('node:test');
const assert = require('node:assert');

process.env.MONGODB_DB = process.env.MONGODB_DB || 'test';

const { setHeardFrom } = require('../controllers/auth/setHeardFrom');

const fakeRes = () => {
    const res = { statusCode: 200, body: null };
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (body) => { res.body = body; return res; };
    return res;
};

test('the heard-from answer must be one of the known options', async () => {
    for (const heardFrom of [undefined, '', 'myspace', { $ne: null }]) {
        const res = fakeRes();
        await setHeardFrom({ body: { heardFrom }, session: { user: { userId: 1 } } }, res);
        assert.strictEqual(res.statusCode, 400);
    }
});

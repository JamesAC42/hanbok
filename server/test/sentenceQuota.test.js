const test = require('node:test');
const assert = require('node:assert');
const { weeklySentenceQuota, quotaExceededMessage, FREE_WEEKLY_SENTENCES } = require('../utils/sentenceQuota');

const withEnv = (value, fn) => {
    const before = process.env.ANON_WEEKLY_SENTENCES;
    if (value === undefined) delete process.env.ANON_WEEKLY_SENTENCES;
    else process.env.ANON_WEEKLY_SENTENCES = value;
    try { fn(); } finally {
        if (before === undefined) delete process.env.ANON_WEEKLY_SENTENCES;
        else process.env.ANON_WEEKLY_SENTENCES = before;
    }
};

test('signed-out visitors get 3 a week by default, accounts get 10', () => withEnv(undefined, () => {
    assert.strictEqual(weeklySentenceQuota('ipAddress'), 3);
    assert.strictEqual(weeklySentenceQuota('userId'), FREE_WEEKLY_SENTENCES);
}));

test('ANON_WEEKLY_SENTENCES sets the signed-out allowance, capped at the free one', () => {
    withEnv('5', () => assert.strictEqual(weeklySentenceQuota('ipAddress'), 5));
    withEnv('50', () => assert.strictEqual(weeklySentenceQuota('ipAddress'), FREE_WEEKLY_SENTENCES));
    withEnv('nonsense', () => assert.strictEqual(weeklySentenceQuota('ipAddress'), 3));
    withEnv('0', () => assert.strictEqual(weeklySentenceQuota('ipAddress'), 0));
});

test('signed-out visitors are asked to sign up, accounts to upgrade', () => withEnv(undefined, () => {
    assert.strictEqual(quotaExceededMessage('ipAddress').type, 'signup_required');
    assert.match(quotaExceededMessage('ipAddress').message, /3 free tries/);
    assert.strictEqual(quotaExceededMessage('userId').type, 'rate_limit_exceeded');
}));

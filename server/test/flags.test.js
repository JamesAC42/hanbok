const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { applyFlags, parseFlags, flagTarget } = require('../lib/flags');

test('parseFlags reads KEY=value, skips comments, strips quotes', () => {
    assert.deepStrictEqual(parseFlags('# c\n\nA_B=true\nC = "x y"  # note\nD=\n'), { A_B: 'true', C: 'x y', D: '' });
    assert.throws(() => parseFlags('lower=1'));
});

test('flagTarget: production by default, staging by DB or URL, none in dev', () => {
    assert.strictEqual(flagTarget({ NODE_ENV: 'production' }), 'production');
    assert.strictEqual(flagTarget({ NODE_ENV: 'production', MONGODB_DB: 'hanbok_staging' }), 'staging');
    assert.strictEqual(flagTarget({ NODE_ENV: 'production', FRONTEND_URL: 'https://staging.hanbokstudy.com' }), 'staging');
    assert.strictEqual(flagTarget({ NODE_ENV: 'production', FRONTEND_URL: 'https://hanbokstudy.com' }), 'production');
    assert.strictEqual(flagTarget({}), null);
    assert.strictEqual(flagTarget({ NODE_ENV: 'production', HANBOK_FLAGS: 'none' }), null);
    assert.strictEqual(flagTarget({ HANBOK_FLAGS: 'staging' }), 'staging');
});

test('applyFlags overrides api.env values and leaves other keys alone', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'flags-'));
    fs.writeFileSync(path.join(dir, 'flags.production.env'), 'AUTO_TRIAL_ENABLED=false\nSTREAM_ANALYSIS=true\n');
    const env = { NODE_ENV: 'production', AUTO_TRIAL_ENABLED: 'true', STRIPE_SECRET_KEY: 'sk' };
    const res = applyFlags(env, dir);
    assert.strictEqual(env.AUTO_TRIAL_ENABLED, 'false');
    assert.strictEqual(env.STREAM_ANALYSIS, 'true');
    assert.strictEqual(env.STRIPE_SECRET_KEY, 'sk');
    assert.strictEqual(res.target, 'production');
    assert.match(res.version, /^[0-9a-f]{8}$/);
});

test('committed flag files parse and hold no secrets', () => {
    const dir = path.join(__dirname, '..', 'config');
    for (const name of ['flags.production.env', 'flags.staging.env']) {
        const flags = parseFlags(fs.readFileSync(path.join(dir, name), 'utf8'));
        for (const key of Object.keys(flags)) assert.doesNotMatch(key, /SECRET|PASSWORD|_KEY$|TOKEN|URI|HASH/, `${name}: ${key}`);
    }
    const prod = parseFlags(fs.readFileSync(path.join(dir, 'flags.production.env'), 'utf8'));
    assert.strictEqual(prod.AUTO_TRIAL_ENABLED, 'false');
    assert.strictEqual(prod.RETURNING_TRIAL_ENABLED, 'false');
});

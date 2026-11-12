const test = require('node:test');
const assert = require('node:assert');

const setEnv = (vars) => {
  for (const name of ['STORAGE_ENDPOINT', 'STORAGE_BUCKET', 'STORAGE_ACCESS_KEY_ID', 'STORAGE_SECRET_ACCESS_KEY', 'STORAGE_REGION', 'STORAGE_PUBLIC_URL', 'AWS_BUCKET_NAME', 'AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY']) {
    delete process.env[name];
  }
  Object.assign(process.env, vars);
  const storage = require('../lib/storage');
  storage.resetStorageForTests();
  return storage;
};

const R2 = {
  STORAGE_ENDPOINT: 'https://acct123.r2.cloudflarestorage.com',
  STORAGE_BUCKET: 'hanbok',
  STORAGE_ACCESS_KEY_ID: 'test-id',
  STORAGE_SECRET_ACCESS_KEY: 'test-secret',
};

test('R2 config defaults region to auto', () => {
  const s = setEnv(R2);
  const info = s.describeStorage();
  assert.strictEqual(info.region, 'auto');
  assert.strictEqual(info.host, 'acct123.r2.cloudflarestorage.com');
  assert.strictEqual(info.configured, true);
});

test('old AWS_* names still work as a fallback', () => {
  const s = setEnv({ AWS_BUCKET_NAME: 'old', AWS_REGION: 'us-east-2', AWS_ACCESS_KEY_ID: 'a', AWS_SECRET_ACCESS_KEY: 'b' });
  const info = s.describeStorage();
  assert.strictEqual(info.bucket, 'old');
  assert.strictEqual(info.region, 'us-east-2');
});

test('keyFromRef reads keys out of every stored form', () => {
  const s = setEnv({ ...R2, STORAGE_PUBLIC_URL: 'https://audio.example.com/' });
  const key = 'audio/uyVNoMrnUku1dZyVEXwD/speech1_1700000000000_s1.mp3';
  assert.strictEqual(s.keyFromRef(key), key);
  // old AWS virtual-hosted signed URL
  assert.strictEqual(s.keyFromRef(`https://hanbok-audio.s3.us-east-2.amazonaws.com/${key}?X-Amz-Signature=abc`), key);
  // old AWS path-style URL
  assert.strictEqual(s.keyFromRef(`https://s3.us-east-2.amazonaws.com/hanbok-audio/${key}?X-Amz-Signature=abc`), key);
  // R2 signed URL (path style, bucket first)
  assert.strictEqual(s.keyFromRef(`https://acct123.r2.cloudflarestorage.com/hanbok/${key}?X-Amz-Signature=abc`), key);
  // public URL
  assert.strictEqual(s.keyFromRef(`https://audio.example.com/${key}`), key);
  assert.strictEqual(s.keyFromRef(null), null);
  assert.strictEqual(s.keyFromRef('not a url://'), 'not a url://');
});

test('isLegacyAwsUrl only flags AWS links', () => {
  const s = setEnv(R2);
  assert.strictEqual(s.isLegacyAwsUrl('https://b.s3.us-east-2.amazonaws.com/audio/x.mp3?sig'), true);
  assert.strictEqual(s.isLegacyAwsUrl('https://acct123.r2.cloudflarestorage.com/hanbok/audio/x.mp3'), false);
  assert.strictEqual(s.isLegacyAwsUrl('audio/x.mp3'), false);
});

test('signed R2 links point at the bucket on the R2 endpoint', async () => {
  const s = setEnv(R2);
  const url = await s.getAudioUrl('audio/v/a b.mp3');
  assert.match(url, /^https:\/\/acct123\.r2\.cloudflarestorage\.com\/hanbok\/audio\/v\/a%20b\.mp3\?/);
  assert.match(url, /X-Amz-Expires=604800/);
  assert.strictEqual(s.keyFromRef(url), 'audio/v/a b.mp3');
});

test('public links when STORAGE_PUBLIC_URL is set', async () => {
  const s = setEnv({ ...R2, STORAGE_PUBLIC_URL: 'https://pub-abc.r2.dev' });
  assert.strictEqual(await s.getAudioUrl('audio/v/x.mp3'), 'https://pub-abc.r2.dev/audio/v/x.mp3');
});

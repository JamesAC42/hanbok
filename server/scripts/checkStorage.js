// Checks the audio bucket end to end: upload, exists, link, download.
//   docker compose exec api node scripts/checkStorage.js
// Prints no secrets. Exit code 0 means audio storage works.
require('dotenv').config();
const { describeStorage, getAudioUrl, objectExists, putAudio } = require('../lib/storage');

(async () => {
  const info = describeStorage();
  console.log(`Storage: ${info.host} bucket=${info.bucket} region=${info.region} links=${info.publicUrl ? `public (${info.publicUrl})` : 'signed'}`);
  if (!info.configured) {
    console.error('FAIL: STORAGE_BUCKET, STORAGE_ACCESS_KEY_ID and STORAGE_SECRET_ACCESS_KEY must all be set in api.env');
    process.exit(1);
  }
  const key = 'healthcheck/storage-check.txt';
  const body = `ok ${new Date().toISOString()}`;
  try {
    await putAudio(key, Buffer.from(body), 'text/plain');
    console.log('upload: ok');
    if (!(await objectExists(key))) throw new Error('uploaded object not found');
    console.log('exists: ok');
    const url = await getAudioUrl(key);
    const res = await fetch(url);
    const text = await res.text();
    if (!res.ok || text !== body) throw new Error(`download returned ${res.status}`);
    console.log('download: ok');
    console.log('PASS: audio storage works');
  } catch (error) {
    console.error(`FAIL: ${error.name || 'Error'}: ${error.message}`);
    if (error?.$metadata?.httpStatusCode === 403) {
      console.error('403 = the R2 token is wrong or lacks Object Read & Write on this bucket.');
    }
    process.exit(1);
  }
})();

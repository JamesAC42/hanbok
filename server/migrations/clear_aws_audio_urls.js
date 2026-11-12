// Optional clean-up after moving audio from AWS S3 to Cloudflare R2.
//
// Sentences still holding links to the old AWS bucket get those links cleared
// and are marked audioLostAt, so the next play makes new audio without using
// anyone's audio quota. The app already does this lazily on first play; this
// just does it up front. Word audio (word_audio) is left alone: it regenerates
// on its own the next time it's needed.
//
// Dry run (counts only):  docker compose exec api node migrations/clear_aws_audio_urls.js
// Apply:                   docker compose exec api node migrations/clear_aws_audio_urls.js --apply
require('dotenv').config();
const { connectToDatabase, getDb } = require('../database');

const AWS = /amazonaws\.com/i;
const FIELDS = ['voice1Key', 'voice2Key', 'voice1SlowKey', 'voice2SlowKey'];

(async () => {
  const apply = process.argv.includes('--apply');
  await connectToDatabase();
  const db = getDb();

  const filter = { $or: FIELDS.map((f) => ({ [f]: { $regex: AWS } })) };
  const sentences = await db.collection('sentences').countDocuments(filter);
  const words = await db.collection('word_audio').countDocuments({ audioUrl: { $regex: AWS } });
  console.log(`Sentences with AWS audio links: ${sentences}`);
  console.log(`Word audio with AWS links (left to regenerate on use): ${words}`);

  if (!apply) {
    console.log('Dry run. Re-run with --apply to clear the sentence links.');
    process.exit(0);
  }

  const normal = await db.collection('sentences').updateMany(
    { $or: [{ voice1Key: { $regex: AWS } }, { voice2Key: { $regex: AWS } }] },
    { $set: { voice1Key: null, voice2Key: null, dateAudioGenerated: null, audioLostAt: new Date() } }
  );
  const slow = await db.collection('sentences').updateMany(
    { $or: [{ voice1SlowKey: { $regex: AWS } }, { voice2SlowKey: { $regex: AWS } }] },
    { $set: { voice1SlowKey: null, voice2SlowKey: null } }
  );
  console.log(`Cleared normal audio on ${normal.modifiedCount} sentences, slow audio on ${slow.modifiedCount}.`);
  process.exit(0);
})().catch((error) => {
  console.error('Failed:', error);
  process.exit(1);
});

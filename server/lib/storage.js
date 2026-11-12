// Audio storage on any S3-compatible bucket (Cloudflare R2 in production).
//
// Env (STORAGE_* wins; the old AWS_* names still work as a fallback):
//   STORAGE_ENDPOINT           R2: https://<account>.r2.cloudflarestorage.com (leave empty for AWS S3)
//   STORAGE_BUCKET             bucket name, e.g. hanbok
//   STORAGE_ACCESS_KEY_ID      R2 API token's Access Key ID
//   STORAGE_SECRET_ACCESS_KEY  R2 API token's Secret Access Key
//   STORAGE_REGION             "auto" for R2 (default when an endpoint is set)
//   STORAGE_PUBLIC_URL         optional: public base URL for the bucket (r2.dev or a
//                              custom domain). When set, audio links are plain public
//                              URLs; otherwise they are 7-day signed URLs.
//
// Stored audio references in Mongo are a mix of bare keys ("audio/<voice>/x.mp3")
// and full URLs (old AWS signed URLs, R2 signed URLs, public URLs). keyFromRef
// turns any of them back into a key.
const { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const SIGNED_URL_SECONDS = 604800; // 7 days, the S3/R2 maximum

const env = (name, fallback) => {
  const value = process.env[name];
  if (value !== undefined && String(value).trim() !== '') return String(value).trim();
  return fallback !== undefined ? process.env[fallback]?.trim() || '' : '';
};

const readConfig = () => {
  const endpoint = env('STORAGE_ENDPOINT').replace(/\/+$/, '');
  return {
    endpoint,
    bucket: env('STORAGE_BUCKET', 'AWS_BUCKET_NAME'),
    accessKeyId: env('STORAGE_ACCESS_KEY_ID', 'AWS_ACCESS_KEY_ID'),
    secretAccessKey: env('STORAGE_SECRET_ACCESS_KEY', 'AWS_SECRET_ACCESS_KEY'),
    region: env('STORAGE_REGION') || (endpoint ? 'auto' : env('AWS_REGION')) || 'us-east-1',
    publicUrl: env('STORAGE_PUBLIC_URL').replace(/\/+$/, ''),
  };
};

let cached = null;
const getStorage = () => {
  if (cached) return cached;
  const config = readConfig();
  const client = new S3Client({
    region: config.region,
    ...(config.endpoint ? { endpoint: config.endpoint, forcePathStyle: true } : {}),
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    // R2 doesn't need the SDK's default extra checksums; only send them when required.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
  cached = { config, client };
  return cached;
};

const resetStorageForTests = () => { cached = null; };

const describeStorage = () => {
  const { config } = getStorage();
  let host = 'aws-s3';
  try { if (config.endpoint) host = new URL(config.endpoint).host; } catch { host = config.endpoint; }
  return {
    host,
    bucket: config.bucket || '(unset)',
    region: config.region,
    publicUrl: config.publicUrl || null,
    configured: !!(config.bucket && config.accessKeyId && config.secretAccessKey),
  };
};

// Any stored reference (bare key or URL) -> object key, or null if unusable.
const keyFromRef = (ref) => {
  if (!ref || typeof ref !== 'string') return null;
  if (!/^https?:\/\//i.test(ref)) return ref.replace(/^\/+/, '') || null;
  const { config } = getStorage();
  if (config.publicUrl && ref.startsWith(`${config.publicUrl}/`)) {
    return decodeURIComponent(ref.slice(config.publicUrl.length + 1).split(/[?#]/)[0]) || null;
  }
  let url;
  try { url = new URL(ref); } catch { return null; }
  let path = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  // Path-style URLs carry the bucket first: <endpoint>/<bucket>/<key> (R2 signed
  // URLs here, or s3.<region>.amazonaws.com/<bucket>/<key>). Virtual-hosted AWS
  // URLs (<bucket>.s3.<region>.amazonaws.com/<key>) don't.
  const host = url.hostname.toLowerCase();
  const virtualHosted = /^[^.]+\.s3[.-]/.test(host) && host.endsWith('amazonaws.com');
  if (!virtualHosted) {
    const firstSlash = path.indexOf('/');
    if (firstSlash > 0) {
      const first = path.slice(0, firstSlash);
      if (first === config.bucket || host.endsWith('r2.cloudflarestorage.com') || host.endsWith('amazonaws.com')) {
        path = path.slice(firstSlash + 1);
      }
    }
  }
  return path || null;
};

// True for full URLs that point at old AWS S3. Those links stopped working when
// the account was suspended; treat them as missing audio and regenerate.
const isLegacyAwsUrl = (ref) => typeof ref === 'string' && /^https?:\/\/[^/?#]*amazonaws\.com/i.test(ref);

const putAudio = async (key, body, contentType = 'audio/mpeg') => {
  const { client, config } = getStorage();
  await client.send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  }));
  return key;
};

const objectExists = async (key) => {
  const { client, config } = getStorage();
  try {
    await client.send(new HeadObjectCommand({ Bucket: config.bucket, Key: key }));
    return true;
  } catch (error) {
    const status = error?.$metadata?.httpStatusCode;
    if (status === 404 || error?.name === 'NotFound' || error?.name === 'NoSuchKey') return false;
    throw error;
  }
};

// A link the browser can play. Public URL when STORAGE_PUBLIC_URL is set,
// otherwise a 7-day signed URL.
const getAudioUrl = async (key) => {
  const { client, config } = getStorage();
  if (config.publicUrl) {
    return `${config.publicUrl}/${key.split('/').map(encodeURIComponent).join('/')}`;
  }
  return getSignedUrl(client, new GetObjectCommand({ Bucket: config.bucket, Key: key }), { expiresIn: SIGNED_URL_SECONDS });
};

module.exports = {
  SIGNED_URL_SECONDS,
  describeStorage,
  getAudioUrl,
  getStorage,
  isLegacyAwsUrl,
  keyFromRef,
  objectExists,
  putAudio,
  resetStorageForTests,
};

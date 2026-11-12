const client = require('./client');
const { isChinese } = require('../llm/chineseScript');
const { getAudioUrl, keyFromRef, objectExists, putAudio } = require('../lib/storage');

// Helper function to convert stream to buffer
const streamToBuffer = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

const DEFAULT_VOICE_IDS = ["uyVNoMrnUku1dZyVEXwD", "PDoCXqBQFGsvfO0hNkEs"];

const DEFAULT_MODEL_ID = "eleven_multilingual_v2";
// multilingual_v2 can't be told which language it's reading, so short Chinese
// text (e.g. a single word) often comes out with the wrong tones. Turbo v2.5
// accepts language_code, so Chinese is pinned to Mandarin with it.
const CHINESE_MODEL_ID = "eleven_turbo_v2_5";

const getTtsModel = (language) => (
  isChinese(language)
    ? { model_id: CHINESE_MODEL_ID, language_code: "zh" }
    : { model_id: DEFAULT_MODEL_ID }
);

const generateSpeech = async (text, options = {}) => {
  const {
    speed = 1,
    voiceIds = DEFAULT_VOICE_IDS,
    language = null
  } = options;
  const model = getTtsModel(language);

  try {
    console.log("Text being sent to ElevenLabs:", text, "speed:", speed, "model:", model.model_id);

    const timestamp = Date.now();
    const audioResponses = await Promise.all(
      voiceIds.map((voiceId) =>
        client.textToSpeech.convert(voiceId, {
          output_format: "mp3_44100_128",
          text,
          ...model,
          voice_settings: { speed }
        })
      )
    );

    const audioBuffers = await Promise.all(audioResponses.map(streamToBuffer));

    const audioKeys = voiceIds.map((voiceId, index) => ({
      key: `audio/${voiceId}/speech${index + 1}_${timestamp}_s${speed}.mp3`,
      voiceId
    }));

    await Promise.all(
      audioBuffers.map((buffer, index) => putAudio(audioKeys[index].key, buffer))
    );

    const signedUrls = await Promise.all(audioKeys.map(({ key }) => getAudioUrl(key)));

    const result = {
      voice1: signedUrls[0],
      voice2: signedUrls[1],
      keys: {
        voice1: audioKeys[0].key,
        voice2: audioKeys[1].key
      }
    };

    return result;

  } catch (error) {
    console.error("Error:", error);
    if (error.response) {
      console.error("Error Response Data:", error.response.data);
    }
    throw error;
  }
}

// Fresh playable link for a stored audio reference (bare key or any old URL).
// Throws when the object isn't in the bucket (e.g. audio that lived on the old
// AWS account), so callers fall back to regenerating it.
const getPresignedUrl = async (ref) => {
  const key = keyFromRef(ref);
  if (!key) throw new Error(`Invalid audio reference: ${ref}`);
  if (!(await objectExists(key))) {
    const error = new Error(`Audio object not found: ${key}`);
    error.code = 'AUDIO_NOT_FOUND';
    throw error;
  }
  return getAudioUrl(key);
};

// Speech with per-character timings, for play-along and shadowing.
// Returns { key, alignment } after storing the mp3 in the audio bucket.
const generateTimedSpeech = async (text, { voiceId = DEFAULT_VOICE_IDS[0], language = null, keyPrefix = 'audio/timed' } = {}) => {
  const model = getTtsModel(language);
  const result = await client.textToSpeech.convertWithTimestamps(voiceId, {
    output_format: "mp3_44100_128",
    text,
    ...model
  });
  if (!result?.audio_base64 || !result.alignment) throw new Error('ElevenLabs returned no timed audio');
  const key = `${keyPrefix}/${voiceId}/${Date.now()}.mp3`;
  await putAudio(key, Buffer.from(result.audio_base64, 'base64'));
  return { key, voiceId, alignment: result.alignment };
};

module.exports = {
  CHINESE_MODEL_ID,
  generateSpeech,
  generateTimedSpeech,
  getPresignedUrl
};

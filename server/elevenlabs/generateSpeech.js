const client = require('./client');
const { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { Readable } = require('stream');

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

// Helper function to convert stream to buffer
const streamToBuffer = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

const DEFAULT_VOICE_IDS = ["uyVNoMrnUku1dZyVEXwD", "PDoCXqBQFGsvfO0hNkEs"];

const generateSpeech = async (text, options = {}) => {
  const {
    speed = 1,
    voiceIds = DEFAULT_VOICE_IDS
  } = options;

  try {
    console.log("Text being sent to ElevenLabs:", text, "speed:", speed);

    const timestamp = Date.now();
    const audioResponses = await Promise.all(
      voiceIds.map((voiceId) =>
        client.textToSpeech.convert(voiceId, {
          output_format: "mp3_44100_128",
          text,
          model_id: "eleven_multilingual_v2",
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
      audioBuffers.map((buffer, index) =>
        s3Client.send(new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: audioKeys[index].key,
          Body: buffer,
          ContentType: 'audio/mpeg'
        }))
      )
    );

    const signedUrls = await Promise.all(
      audioKeys.map(({ key }) =>
        getSignedUrl(
          s3Client,
          new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key }),
          { expiresIn: 604800 }
        )
      )
    );

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

const getPresignedUrl = async (key) => {
  if (!key) {
    throw new Error('Invalid key: Key is null or undefined');
  }

  try {
    // Check if the key is actually a full URL (this happens if the database stored the URL instead of just the key)
    if (key.startsWith('http')) {
      console.log('Key appears to be a full URL, extracting actual key');
      try {
        // Try to extract the actual key from the URL
        const url = new URL(key);
        const pathParts = url.pathname.split('/');
        // The key should be everything after the bucket name in the path
        // For example: /audio/voice_id/speech_timestamp.mp3
        if (pathParts.length >= 3) {
          // Remove the first empty element and join the rest
          const actualKey = pathParts.slice(1).join('/');
          console.log('Extracted key:', actualKey);
          
          const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: actualKey
          });
          
          // Check if the object exists
          try {
            await s3Client.send(new HeadObjectCommand({
              Bucket: BUCKET_NAME,
              Key: actualKey
            }));
            
            return getSignedUrl(s3Client, command, { expiresIn: 604800 });
          } catch (error) {
            console.error(`S3 object not found for extracted key: ${actualKey}`, error);
            throw new Error(`S3 object not found for extracted key: ${actualKey}`);
          }
        }
      } catch (parseError) {
        console.error('Error parsing URL:', parseError);
      }
      
      // If we couldn't extract a valid key or the object doesn't exist, throw an error
      throw new Error(`Invalid key format or S3 object not found: ${key}`);
    }
    
    // Normal case - key is just the S3 object key
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });
    
    // First check if the object exists
    try {
      // This will throw an error if the object doesn't exist
      await s3Client.send(new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      }));
    } catch (error) {
      console.error(`S3 object not found for key: ${key}`, error);
      throw new Error(`S3 object not found for key: ${key}`);
    }
    
    return getSignedUrl(s3Client, command, { expiresIn: 604800 });
  } catch (error) {
    console.error(`Error generating presigned URL for key: ${key}`, error);
    throw error;
  }
};

module.exports = {
  generateSpeech,
  getPresignedUrl
};

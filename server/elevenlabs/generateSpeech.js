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

const generateSpeech = async (text) => {
  try {
    console.log("Text being sent to ElevenLabs:", text);

    const [response1, response2] = await Promise.all([
      client.textToSpeech.convert("uyVNoMrnUku1dZyVEXwD", {
        output_format: "mp3_44100_128",
        text: text,
        model_id: "eleven_multilingual_v2"
      }),
      client.textToSpeech.convert("PDoCXqBQFGsvfO0hNkEs", {
        output_format: "mp3_44100_128", 
        text: text,
        model_id: "eleven_multilingual_v2"
      })
    ]);

    const timestamp = Date.now();
    const key1 = `audio/uyVNoMrnUku1dZyVEXwD/speech1_${timestamp}.mp3`;
    const key2 = `audio/PDoCXqBQFGsvfO0hNkEs/speech2_${timestamp}.mp3`;

    // Convert streams to buffers
    const [buffer1, buffer2] = await Promise.all([
      streamToBuffer(response1),
      streamToBuffer(response2)
    ]);

    // Upload both files to S3
    await Promise.all([
      s3Client.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key1,
        Body: buffer1,
        ContentType: 'audio/mpeg'
      })),
      s3Client.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key2,
        Body: buffer2,
        ContentType: 'audio/mpeg'
      }))
    ]);

    // Generate presigned URLs that expire in 7 days
    const [url1, url2] = await Promise.all([
      getSignedUrl(s3Client, 
        new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key1 }), 
        { expiresIn: 604800 }
      ),
      getSignedUrl(s3Client, 
        new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key2 }), 
        { expiresIn: 604800 }
      )
    ]);

    return {
      voice1: url1,
      voice2: url2
    };

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

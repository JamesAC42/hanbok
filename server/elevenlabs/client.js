const { ElevenLabsClient } = require("elevenlabs");
require('dotenv').config();


const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY
});

module.exports = client;
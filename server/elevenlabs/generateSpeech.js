const client = require('./client');
const fs = require('fs');
const path = require('path');

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
    const filename1 = `speech1_${timestamp}.mp3`;
    const filename2 = `speech2_${timestamp}.mp3`;

    const filepath1 = path.join(__dirname, '..', '..', 'audio', 'uyVNoMrnUku1dZyVEXwD', filename1);
    const filepath2 = path.join(__dirname, '..', '..', 'audio', 'PDoCXqBQFGsvfO0hNkEs', filename2);

    const dir1 = path.dirname(filepath1);
    const dir2 = path.dirname(filepath2);
    if (!fs.existsSync(dir1)) {
      fs.mkdirSync(dir1, { recursive: true });
    }
    if (!fs.existsSync(dir2)) {
      fs.mkdirSync(dir2, { recursive: true });
    }

    await Promise.all([
      fs.promises.writeFile(filepath1, response1),
      fs.promises.writeFile(filepath2, response2)
    ]);

    return {
      voice1: filename1,
      voice2: filename2
    };

  } catch (error) {
    console.error("ElevenLabs API Error:", error);
    console.error("ElevenLabs API Error Message:", error.message);
    console.error("ElevenLabs API Error Status Code:", error.statusCode);
    if (error.response) {
      console.error("ElevenLabs API Error Response Data:", error.response.data);
    }
    throw error;
  }
}

module.exports = generateSpeech;

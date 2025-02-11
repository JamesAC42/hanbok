const { getDb } = require('../../database');
const { getPresignedUrl } = require('../../elevenlabs/generateSpeech');

const getAudioURL = async (req, res) => {
    try {
        const db = getDb();
        const sentence = await db.collection('sentences').findOne({ 
            sentenceId: parseInt(req.params.sentenceId),
            userId: req.session.user.userId  // Security: only allow access to own sentences
        });
        
        if (!sentence) {
            return res.status(404).json({ error: 'Sentence not found' });
        }

        const [url1, url2] = await Promise.all([
            getPresignedUrl(sentence.voice1Key),
            getPresignedUrl(sentence.voice2Key)
        ]);

        res.json({ voice1: url1, voice2: url2 });
    } catch (error) {
        console.error('Error generating audio URLs:', error);
        res.status(500).json({ error: 'Failed to generate audio URLs' });
    }
}

module.exports = { getAudioURL };

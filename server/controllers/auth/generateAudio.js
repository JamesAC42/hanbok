const { getDb } = require('../../database');
const { generateSpeech } = require('../../elevenlabs/generateSpeech');

const generateAudio = async (req, res) => {
    const { sentenceId } = req.params;
    const userId = req.session.user.userId;

    try {
        const db = getDb();
        
        // Find the sentence and verify ownership
        const sentence = await db.collection('sentences').findOne({ 
            sentenceId: parseInt(sentenceId),
            userId: userId
        });

        if (!sentence) {
            return res.status(404).json({ 
                success: false,
                error: 'Sentence not found or unauthorized'
            });
        }

        // Generate speech audio
        const { voice1, voice2 } = await generateSpeech(sentence.text);

        // Update sentence with audio URLs
        await db.collection('sentences').updateOne(
            { sentenceId: parseInt(sentenceId) },
            { 
                $set: { 
                    voice1Key: voice1,
                    voice2Key: voice2,
                    dateAudioGenerated: new Date()
                }
            }
        );

        res.json({ 
            success: true,
            voice1: voice1,
            voice2: voice2
        });

    } catch (error) {
        console.error('Error generating audio:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to generate audio'
        });
    }
};

module.exports = generateAudio; 
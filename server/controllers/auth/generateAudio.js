const { getDb } = require('../../database');
const { generateSpeech } = require('../../elevenlabs/generateSpeech');

const generateAudio = async (req, res) => {
    const { sentenceId } = req.params;
    const userId = req.session.user.userId;

    console.log(sentenceId, userId);

    try {
        const db = getDb();
        
        // First check if user has remaining generations
        const user = await db.collection('users').findOne({ userId });
        
        if (!user) {
            return res.status(403).json({
                success: false,
                error: 'No remaining audio generations available'
            });
        }

        if (user.tier === 0) {
            const saved = user.remainingAudioGenerations;
            if (saved <= 0) {
                return res.status(403).json({
                    success: false,
                    error: 'No remaining audio generations available'
                });
            }
        }

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

        // Decrement the remaining generations
        await db.collection('users').updateOne(
            { userId },
            { $inc: { remainingAudioGenerations: -1 } }
        );

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
            voice2: voice2,
            remainingGenerations: user.remainingAudioGenerations - 1
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
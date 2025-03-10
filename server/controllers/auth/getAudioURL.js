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

        // Check if voice keys exist
        if (!sentence.voice1Key || !sentence.voice2Key) {
            return res.json({ 
                voice1: null, 
                voice2: null,
                error: 'Voice keys not found'
            });
        }

        try {
            // Try to get presigned URLs for the existing S3 objects
            const [url1, url2] = await Promise.all([
                getPresignedUrl(sentence.voice1Key),
                getPresignedUrl(sentence.voice2Key)
            ]);

            // Update the sentence with the new URLs
            await db.collection('sentences').updateOne(
                { sentenceId: parseInt(req.params.sentenceId) },
                { 
                    $set: { 
                        voice1Key: url1,
                        voice2Key: url2,
                        dateAudioGenerated: new Date()
                    }
                }
            );

            console.log('Updated sentence with fresh audio URLs');

            res.json({ voice1: url1, voice2: url2 });
        } catch (s3Error) {
            console.error('Error generating presigned URLs:', s3Error);
            
            // If there's an S3 error (like object not found), clear the voice keys
            try {
                await db.collection('sentences').updateOne(
                    { sentenceId: parseInt(req.params.sentenceId) },
                    { 
                        $set: { 
                            voice1Key: null,
                            voice2Key: null,
                            dateAudioGenerated: null
                        }
                    }
                );
                console.log('Cleared invalid voice keys from database');
            } catch (clearError) {
                console.error('Error clearing voice keys:', clearError);
            }
            
            // Return null URLs to trigger regeneration
            return res.json({ 
                voice1: null, 
                voice2: null,
                error: 'S3 objects not found or inaccessible'
            });
        }
    } catch (error) {
        console.error('Error generating audio URLs:', error);
        res.status(500).json({ error: 'Failed to generate audio URLs' });
    }
}

module.exports = getAudioURL;

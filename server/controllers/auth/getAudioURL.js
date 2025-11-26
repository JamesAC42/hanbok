const { getDb } = require('../../database');
const { getPresignedUrl, generateSpeech } = require('../../elevenlabs/generateSpeech');

const getAudioURL = async (req, res) => {
    try {
        const db = getDb();
        const variant = req.query.variant === 'slow' ? 'slow' : 'normal';
        const parsedSentenceId = parseInt(req.params.sentenceId);
        const sentence = await db.collection('sentences').findOne({ 
            sentenceId: parsedSentenceId,
            //userId: req.session.user.userId  // Security: only allow access to own sentences
        });
        
        if (!sentence) {
            return res.status(404).json({ error: 'Sentence not found' });
        }

        const voiceKeys = variant === 'slow' 
            ? { voice1Key: sentence.voice1SlowKey, voice2Key: sentence.voice2SlowKey }
            : { voice1Key: sentence.voice1Key, voice2Key: sentence.voice2Key };

        const hasNormalAudio = !!(sentence.voice1Key && sentence.voice2Key);
        const shouldGenerateSlow = variant === 'slow' && (!voiceKeys.voice1Key || !voiceKeys.voice2Key) && hasNormalAudio;

        if (variant === 'slow' && !hasNormalAudio) {
            return res.json({
                voice1: null,
                voice2: null,
                variant,
                error: 'Original audio not available yet'
            });
        }

        // Generate slowed audio on demand for older sentences with existing normal audio
        if (shouldGenerateSlow) {
            try {
                const textToRead = sentence.originalLanguage === 'ja'
                    ? sentence?.analysis?.sentence?.reading ?? sentence.text
                    : sentence.text;
                const slowAudio = await generateSpeech(textToRead, { speed: 0.7 });

                await db.collection('sentences').updateOne(
                    { sentenceId: parsedSentenceId },
                    {
                        $set: {
                            voice1SlowKey: slowAudio.voice1,
                            voice2SlowKey: slowAudio.voice2,
                            dateAudioGenerated: sentence.dateAudioGenerated || new Date()
                        }
                    }
                );

                return res.json({ 
                    voice1: slowAudio.voice1, 
                    voice2: slowAudio.voice2,
                    variant,
                    generated: true
                });
            } catch (generationError) {
                console.error('Error generating slowed audio:', generationError);
                return res.status(500).json({ error: 'Failed to generate slowed audio' });
            }
        }

        // Check if voice keys exist
        if (!voiceKeys.voice1Key || !voiceKeys.voice2Key) {
            return res.json({ 
                voice1: null, 
                voice2: null,
                variant,
                error: 'Voice keys not found'
            });
        }

        try {
            // Try to get presigned URLs for the existing S3 objects
            const [url1, url2] = await Promise.all([
                getPresignedUrl(voiceKeys.voice1Key),
                getPresignedUrl(voiceKeys.voice2Key)
            ]);

            // Update the sentence with the new URLs
            await db.collection('sentences').updateOne(
                { sentenceId: parsedSentenceId },
                { 
                    $set: { 
                        ...(variant === 'slow' ? {
                            voice1SlowKey: url1,
                            voice2SlowKey: url2
                        } : {
                            voice1Key: url1,
                            voice2Key: url2,
                            dateAudioGenerated: new Date()
                        })
                    }
                }
            );

            console.log('Updated sentence with fresh audio URLs');

            res.json({ voice1: url1, voice2: url2, variant });
        } catch (s3Error) {
            console.error('Error generating presigned URLs:', s3Error);
            
            // If there's an S3 error (like object not found), clear the voice keys
            try {
                await db.collection('sentences').updateOne(
                    { sentenceId: parsedSentenceId },
                    { 
                        $set: { 
                            ...(variant === 'slow' ? {
                                voice1SlowKey: null,
                                voice2SlowKey: null
                            } : {
                                voice1Key: null,
                                voice2Key: null,
                                dateAudioGenerated: null
                            })
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
                variant,
                error: 'S3 objects not found or inaccessible'
            });
        }
    } catch (error) {
        console.error('Error generating audio URLs:', error);
        res.status(500).json({ error: 'Failed to generate audio URLs' });
    }
}

module.exports = getAudioURL;

const { getDb } = require('../../database');
const { generateSpeech } = require('../../elevenlabs/generateSpeech');
const { buildAudioLengthError, isLongSentenceAudioRestricted } = require('../../utils/audioAccess');
const {
    clearSentenceAudioVariant,
    getSentenceTextToRead,
    hasAudioForVariant,
    resolveSentenceAudio
} = require('../../utils/sentenceAudio');

const getAudioURL = async (req, res) => {
    try {
        const db = getDb();
        const variant = req.query.variant === 'slow' ? 'slow' : 'normal';
        const userId = req.session?.user?.userId || null;
        const isSignedIn = !!userId;
        const parsedSentenceId = parseInt(req.params.sentenceId);
        const sentence = await db.collection('sentences').findOne({ 
            sentenceId: parsedSentenceId,
            //userId: req.session.user.userId  // Security: only allow access to own sentences
        });
        
        if (!sentence) {
            return res.status(404).json({ error: 'Sentence not found' });
        }

        let user = null;
        if (userId !== null) {
            user = await db.collection('users').findOne({ userId });
        }

        if (isLongSentenceAudioRestricted(sentence.text, user)) {
            return res.status(403).json(buildAudioLengthError());
        }

        if (variant === 'slow' && !isSignedIn) {
            return res.status(403).json({
                code: 'SLOW_AUDIO_LOGIN_REQUIRED',
                error: 'Sign in to access slow audio'
            });
        }

        let currentSentence = sentence;

        if (variant === 'slow' && !hasAudioForVariant(currentSentence, 'normal')) {
            await resolveSentenceAudio(db, currentSentence, 'normal');
            currentSentence = await db.collection('sentences').findOne({ sentenceId: parsedSentenceId });
        }

        const hasNormalAudio = hasAudioForVariant(currentSentence, 'normal');

        if (variant === 'slow' && !hasNormalAudio) {
            return res.json({
                voice1: null,
                voice2: null,
                variant,
                error: 'Original audio not available yet'
            });
        }

        const existingAudio = await resolveSentenceAudio(db, currentSentence, variant);
        if (existingAudio) {
            return res.json({
                voice1: existingAudio.voice1,
                voice2: existingAudio.voice2,
                variant
            });
        }

        if (variant === 'slow') {
            try {
                const textToRead = getSentenceTextToRead(currentSentence);
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

        await clearSentenceAudioVariant(db, parsedSentenceId, variant);
        return res.json({
            voice1: null,
            voice2: null,
            variant,
            error: 'Voice keys not found'
        });
    } catch (error) {
        console.error('Error generating audio URLs:', error);
        res.status(500).json({ error: 'Failed to generate audio URLs' });
    }
}

module.exports = getAudioURL;

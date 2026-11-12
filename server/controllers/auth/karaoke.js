const { getDb } = require('../../database');
const { findSentenceByKey } = require('../../lib/sentenceKeys');
const { wordTimings, MAX_TEXT } = require('../../lib/karaoke');

const pending = new Map();

// GET /api/sentences/:sentenceId/karaoke  (Plus)
// Timed audio for play-along and shadowing: a signed mp3 URL plus each word's
// start and end. Generated once per sentence and kept.
const getKaraoke = async (req, res) => {
    const userId = req.session.user.userId;
    try {
        const db = getDb();
        const user = await db.collection('users').findOne({ userId }, { projection: { tier: 1 } });
        if ((user?.tier || 0) < 2) return res.status(403).json({ success: false, code: 'PLUS_REQUIRED', error: 'Play-along is part of Plus' });

        const sentence = await findSentenceByKey(db, req.params.sentenceId, { userId });
        if (!sentence?.analysis) return res.status(404).json({ success: false, error: 'Sentence not found' });
        const text = String(sentence.text || sentence.analysis?.sentence?.original || '').trim();
        if (!text || text.length > MAX_TEXT) return res.status(400).json({ success: false, error: 'This sentence is too long for play-along' });

        const { generateTimedSpeech, getPresignedUrl } = require('../../elevenlabs/generateSpeech');
        const make = () => {
            const id = sentence.sentenceId;
            if (!pending.has(id)) {
                pending.set(id, (async () => {
                    const timed = await generateTimedSpeech(text, { language: sentence.originalLanguage, keyPrefix: 'audio/karaoke' });
                    const doc = { key: timed.key, voiceId: timed.voiceId, words: wordTimings(timed.alignment), at: new Date() };
                    await db.collection('sentences').updateOne({ sentenceId: id }, { $set: { karaoke: doc } });
                    return doc;
                })().finally(() => pending.delete(id)));
            }
            return pending.get(id);
        };

        let karaoke = sentence.karaoke;
        if (!karaoke?.key || !Array.isArray(karaoke.words)) karaoke = await make();

        let url;
        try {
            url = await getPresignedUrl(karaoke.key);
        } catch (error) {
            // The stored file is gone (e.g. made while audio lived on AWS): make it again.
            if (error.code !== 'AUDIO_NOT_FOUND') throw error;
            karaoke = await make();
            url = await getPresignedUrl(karaoke.key);
        }
        res.set('Cache-Control', 'private, no-store');
        return res.json({ success: true, url, words: karaoke.words });
    } catch (error) {
        console.error('Karaoke failed:', error.message);
        return res.status(502).json({ success: false, error: 'Could not make the play-along audio' });
    }
};

module.exports = { getKaraoke };

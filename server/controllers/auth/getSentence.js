const { getDb } = require('../../database');
const { isLongSentenceAudioRestricted } = require('../../utils/audioAccess');
const { findSentenceByKey } = require('../../lib/sentenceKeys');
const ADMIN_EMAILS = require('../../lib/adminEmails');

const getSentence = async (req, res) => {
    const { sentenceId } = req.params;

    try {
        const db = getDb();
        const userId = req.session?.user?.userId || null;

        let user = null;
        if (userId !== null) {
            user = await db.collection('users').findOne({ userId });
        }
        const isAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

        // sentenceId here is whatever the link carried: a publicId or an old numeric id.
        const sentence = await findSentenceByKey(db, sentenceId, { userId, isAdmin });

        if (!sentence) {
            return res.status(404).json({ 
                success: false,
                error: 'Sentence not found or unauthorized'
            });
        }

        const responseSentence = isLongSentenceAudioRestricted(sentence.text, user)
            ? {
                ...sentence,
                voice1Key: null,
                voice2Key: null,
                voice1SlowKey: null,
                voice2SlowKey: null
            }
            : sentence;

        res.json({
            success: true,
            sentence: responseSentence
        });

    } catch (error) {
        console.error('Error fetching sentence:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch sentence'
        });
    }
};

module.exports = getSentence;

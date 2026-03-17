const { getDb } = require('../../database');
const { isLongSentenceAudioRestricted } = require('../../utils/audioAccess');

const getSentence = async (req, res) => {
    const { sentenceId } = req.params;
    //const userId = req.session.user.userId;

    try {
        const db = getDb();
        const userId = req.session?.user?.userId || null;
        const sentence = await db.collection('sentences').findOne({ 
            sentenceId: parseInt(sentenceId),
            //userId: userId
        });

        if (!sentence) {
            return res.status(404).json({ 
                success: false,
                error: 'Sentence not found or unauthorized'
            });
        }

        let user = null;
        if (userId !== null) {
            user = await db.collection('users').findOne({ userId });
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

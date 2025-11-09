const { getDb } = require('../../database');

const normalizeId = (raw) => {
    if (raw == null) {
        return raw;
    }
    let value = raw;
    if (typeof value === 'object' && typeof value.valueOf === 'function') {
        value = value.valueOf();
    }
    const numericValue = Number(value);
    if (!Number.isNaN(numericValue)) {
        return numericValue;
    }
    return value;
};

const getExtendedText = async (req, res) => {
    const { textId } = req.params;
    const userId = req.session.user ? req.session.user.userId : null;

    // Require login
    if (!userId) {
        return res.status(401).json({
            success: false,
            error: "Authentication required"
        });
    }

    const db = getDb();

    try {
        // Find the extended text by textId
        const extendedText = await db.collection('extended_texts').findOne({
            textId: parseInt(textId)
        });

        if (!extendedText) {
            return res.status(404).json({
                success: false,
                error: "Extended text not found"
            });
        }

        // Check if the user owns this text
        const textOwnerId = normalizeId(extendedText.userId);
        const requesterId = normalizeId(userId);

        if (textOwnerId !== requesterId) {
            return res.status(403).json({
                success: false,
                error: "You don't have permission to access this text"
            });
        }

        const sentenceGroup = await db.collection('extended_text_sentence_groups').findOne({
            textId: extendedText.textId
        });

        if (!sentenceGroup) {
            if (extendedText.analysis && extendedText.analysis.sentences) {
                return res.json({
                    success: true,
                    extendedText
                });
            }

            return res.status(404).json({
                success: false,
                error: "Sentence group not found for this text"
            });
        }

        const orderedSentenceRefs = [...(sentenceGroup.sentences || [])].sort((a, b) => a.order - b.order);
        const sentenceIds = orderedSentenceRefs.map(ref => ref.sentenceId);

        let analysisSentences = [];
        if (sentenceIds.length > 0) {
            const sentences = await db.collection('sentences').find({
                sentenceId: { $in: sentenceIds }
            }).toArray();

            const sentenceMap = sentences.reduce((map, sentence) => {
                map[sentence.sentenceId] = sentence;
                return map;
            }, {});

            analysisSentences = orderedSentenceRefs
                .map(ref => {
                    const sentenceDoc = sentenceMap[ref.sentenceId];
                    if (!sentenceDoc) {
                        return null;
                    }

                    return {
                        sentenceId: sentenceDoc.sentenceId,
                        text: sentenceDoc.text,
                        analysis: sentenceDoc.analysis
                    };
                })
                .filter(Boolean);
        }

        extendedText.analysis = {
            sentences: analysisSentences,
            overallAnalysis: extendedText.overallAnalysis || null
        };

        res.json({
            success: true,
            extendedText
        });
    } catch (error) {
        console.error('Error retrieving extended text:', error);
        res.status(500).json({
            success: false,
            error: "Failed to retrieve extended text"
        });
    }
};

module.exports = getExtendedText;

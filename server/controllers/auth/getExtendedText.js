const { getDb } = require('../../database');
const { readerFromAnalyses } = require('../../lib/extendedTextReader');

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

        const refs = [...(sentenceGroup?.sentences || [])].sort((a, b) => a.order - b.order);
        const sentenceDocs = refs.length > 0
            ? await db.collection('sentences').find({ sentenceId: { $in: refs.map((ref) => ref.sentenceId) } }).toArray()
            : [];
        const docsById = new Map(sentenceDocs.map((doc) => [doc.sentenceId, doc]));

        // Full breakdowns made so far, by sentence index.
        const analyses = {};
        for (const ref of refs) {
            const doc = docsById.get(ref.sentenceId);
            if (!doc) continue;
            analyses[ref.order] = {
                sentenceId: doc.sentenceId,
                analysis: doc.analysis,
                voice1Key: doc.voice1Key || null,
                voice2Key: doc.voice2Key || null,
                voice1SlowKey: doc.voice1SlowKey || null,
                voice2SlowKey: doc.voice2SlowKey || null
            };
        }

        const reader = Array.isArray(extendedText.reading)
            ? extendedText.reading.map((item, index) => ({ index, ...item }))
            : readerFromAnalyses(refs, docsById, extendedText.text);

        if (reader.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Sentence group not found for this text"
            });
        }

        delete extendedText.reading;
        delete extendedText._id;
        extendedText.reader = reader;
        extendedText.analyses = analyses;
        extendedText.overallAnalysis = extendedText.overallAnalysis || {};

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

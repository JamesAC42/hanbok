const { getDb } = require('../../database');

const addFeedback = async (req, res) => {
    const { text, parentId } = req.body;
    const userId = req.session.user.userId;

    if (!text || text.length > 2000) {
        return res.status(400).json({
            success: false,
            error: 'Text must be between 1 and 2000 characters'
        });
    }

    try {
        const db = getDb();

        // Check last feedback time for this user
        const lastFeedback = await db.collection('feedback').findOne(
            { 
                userId,
                dateCreated: { 
                    $gt: new Date(Date.now() - 60000) // Last minute
                }
            },
            { 
                sort: { dateCreated: -1 },
                projection: { _id: 1, dateCreated: 1 }
            }
        );

        if (lastFeedback) {
            const timeLeft = Math.ceil((60000 - (Date.now() - lastFeedback.dateCreated.getTime())) / 1000);
            return res.status(429).json({
                success: false,
                error: `Please wait ${timeLeft} seconds before submitting another comment`
            });
        }

        // If this is a reply, verify parent exists
        if (parentId) {
            const parent = await db.collection('feedback').findOne({ 
                feedbackId: parseInt(parentId)
            });

            if (!parent) {
                return res.status(404).json({
                    success: false,
                    error: 'Parent feedback not found'
                });
            }
        }

        // Get next feedback ID
        const counterDoc = await db.collection('counters').findOneAndUpdate(
            { _id: 'feedbackId' },
            { $inc: { seq: 1 } },
            { upsert: true, returnDocument: 'after' }
        );

        // Create feedback document
        const feedbackDoc = {
            feedbackId: counterDoc.seq,
            userId,
            text,
            parentId: parentId ? parseInt(parentId) : null,
            dateCreated: new Date()
        };

        await db.collection('feedback').insertOne(feedbackDoc);

        res.json({
            success: true,
            feedback: feedbackDoc
        });

    } catch (error) {
        console.error('Error adding feedback:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add feedback'
        });
    }
};

module.exports = addFeedback; 
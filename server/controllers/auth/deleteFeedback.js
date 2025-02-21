const { getDb } = require('../../database');

const deleteFeedback = async (req, res) => {
    const { feedbackId } = req.params;
    const userId = req.session.user.userId;

    try {
        const db = getDb();
        
        // Soft delete by updating the text field
        const result = await db.collection('feedback').updateOne(
            {
                feedbackId: parseInt(feedbackId),
                userId // Only allow users to delete their own feedback
            },
            {
                $set: {
                    text: '[deleted]',
                    isDeleted: true
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Feedback not found or unauthorized'
            });
        }

        res.json({ success: true });

    } catch (error) {
        console.error('Error deleting feedback:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete feedback'
        });
    }
};

module.exports = deleteFeedback; 
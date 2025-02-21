const { getDb } = require('../../database');

const getFeedback = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    try {
        const db = getDb();
        
        // Get total count of top-level feedback (no parentId)
        const totalCount = await db.collection('feedback').countDocuments({
            isDeleted: { $ne: true },
            parentId: null // Only count top-level comments for pagination
        });

        // First get top-level feedback
        const topLevelFeedback = await db.collection('feedback')
            .aggregate([
                {
                    $match: {
                        parentId: null // Get only top-level comments
                    }
                },
                {
                    $sort: { dateCreated: -1 }
                },
                {
                    $skip: skip
                },
                {
                    $limit: limit
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: 'userId',
                        as: 'user'
                    }
                },
                {
                    $unwind: '$user'
                },
                {
                    $project: {
                        feedbackId: 1,
                        text: {
                            $cond: {
                                if: { $eq: ['$isDeleted', true] },
                                then: '[deleted]',
                                else: '$text'
                            }
                        },
                        dateCreated: 1,
                        parentId: 1,
                        userName: '$user.name',
                        userId: 1,
                        isDeleted: 1
                    }
                }
            ]).toArray();

        // Recursive function to get all replies for a feedback
        const getReplies = async (parentId) => {
            const replies = await db.collection('feedback')
                .aggregate([
                    {
                        $match: {
                            parentId: parentId
                        }
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'userId',
                            foreignField: 'userId',
                            as: 'user'
                        }
                    },
                    {
                        $unwind: '$user'
                    },
                    {
                        $project: {
                            feedbackId: 1,
                            text: {
                                $cond: {
                                    if: { $eq: ['$isDeleted', true] },
                                    then: '[deleted]',
                                    else: '$text'
                                }
                            },
                            dateCreated: 1,
                            parentId: 1,
                            userName: '$user.name',
                            userId: 1,
                            isDeleted: 1
                        }
                    },
                    {
                        $sort: { dateCreated: 1 }
                    }
                ]).toArray();

            // Recursively get replies for each reply
            for (let reply of replies) {
                reply.replies = await getReplies(reply.feedbackId);
            }

            return replies;
        };

        // Get all nested replies for each top-level feedback
        for (let feedback of topLevelFeedback) {
            feedback.replies = await getReplies(feedback.feedbackId);
        }

        res.json({
            success: true,
            feedback: topLevelFeedback,
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit)
        });

    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch feedback'
        });
    }
};

module.exports = getFeedback; 
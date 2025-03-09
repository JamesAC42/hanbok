const { getDb } = require('../../database');

// List of admin emails with access to feature usage data
const ADMIN_EMAILS = ['jamescrovo450@gmail.com'];

const getFeatureUsage = async (req, res) => {
    try {
        const db = getDb();
        const userId = req.session.user?.userId;
        if(!userId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized access'
            });
        }
        
        // Verify the user is an admin
        const user = await db.collection('users').findOne({ userId });
        if (!user || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized access'
            });
        }
        
        // Get query parameters
        const feature = req.query.feature; // Optional filter by feature
        const filterUserId = req.query.userId ? parseInt(req.query.userId) : null; // Optional filter by user
        const limit = parseInt(req.query.limit) || 100;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        const sortBy = req.query.sortBy || 'count'; // count, lastUsed, firstUsed
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        
        // Build query
        const query = {};
        if (feature) {
            query.feature = feature;
        }
        if (filterUserId) {
            query.userId = filterUserId;
        }
        
        // Get total count for pagination
        const totalCount = await db.collection('feature_usage').countDocuments(query);
        
        // Get feature usage data with user information - with pagination
        const usageData = await db.collection('feature_usage')
            .aggregate([
                { $match: query },
                { $sort: { [sortBy]: sortOrder } },
                { $skip: skip },
                { $limit: limit },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: 'userId',
                        as: 'user'
                    }
                },
                { $unwind: '$user' },
                {
                    $project: {
                        _id: 0,
                        userId: 1,
                        feature: 1,
                        count: 1,
                        firstUsed: 1,
                        lastUsed: 1,
                        userName: '$user.name',
                        userEmail: '$user.email',
                        userTier: '$user.tier'
                    }
                }
            ])
            .toArray();
        
        // Get summary statistics - without pagination, to include all matching data
        const summaryStats = await db.collection('feature_usage')
            .aggregate([
                { $match: query },
                {
                    $group: {
                        _id: '$feature',
                        totalUsage: { $sum: '$count' },
                        avgUsagePerUser: { $avg: '$count' },
                        maxUsageByUser: { $max: '$count' },
                        userCount: { $sum: 1 }
                    }
                }
            ])
            .toArray();
        
        // Get feature list for filtering
        const features = await db.collection('feature_usage')
            .distinct('feature');
        
        // Get all users who have feature usage data for the user filter
        const users = await db.collection('feature_usage')
            .aggregate([
                { $match: query.feature ? { feature: query.feature } : {} },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: 'userId',
                        as: 'user'
                    }
                },
                { $unwind: '$user' },
                {
                    $group: {
                        _id: '$userId',
                        name: { $first: '$user.name' },
                        email: { $first: '$user.email' }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        userId: '$_id',
                        name: 1,
                        email: 1
                    }
                }
            ])
            .toArray();
        
        res.json({
            success: true,
            usageData,
            summaryStats,
            features,
            users,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        });
        
    } catch (error) {
        console.error('Error fetching feature usage data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch feature usage data'
        });
    }
};

module.exports = getFeatureUsage; 
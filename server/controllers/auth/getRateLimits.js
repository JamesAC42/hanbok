const { getDb } = require('../../database');

// List of admin emails with access to admin data
const ADMIN_EMAILS = require('../../lib/adminEmails');

const getRateLimits = async (req, res) => {
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
        const identifierType = req.query.identifierType || 'ipAddress'; // Filter by identifier type: 'ipAddress' or 'userId'
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        const sortBy = req.query.sortBy || 'weekSentences'; // totalSentences, weekSentences, weekStartDate, lastUpdated
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        
        // Build query
        const query = { identifierType };
        
        // Get total count for pagination
        const totalCount = await db.collection('rate_limits').countDocuments(query);
        
        // Get rate limit data with pagination
        const rateLimits = await db.collection('rate_limits')
            .find(query)
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(limit)
            .toArray();
        
        // Get summary statistics
        const summaryStats = await db.collection('rate_limits')
            .aggregate([
                { $match: query },
                {
                    $group: {
                        _id: '$identifierType',
                        totalUsers: { $sum: 1 },
                        totalSentences: { $sum: '$totalSentences' },
                        totalWeekSentences: { $sum: '$weekSentences' },
                        avgSentencesPerUser: { $avg: '$totalSentences' },
                        maxSentencesByUser: { $max: '$totalSentences' }
                    }
                }
            ])
            .toArray();
        
        // Calculate summary values
        const totalAnonymousUsers = summaryStats.length > 0 ? summaryStats[0].totalUsers : 0;
        const totalAnonymousSentences = summaryStats.length > 0 ? summaryStats[0].totalSentences : 0;
        
        res.json({
            success: true,
            rateLimits,
            totalAnonymousUsers,
            totalAnonymousSentences,
            summaryStats,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        });
        
    } catch (error) {
        console.error('Error fetching rate limit data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch rate limit data'
        });
    }
};

module.exports = getRateLimits; 
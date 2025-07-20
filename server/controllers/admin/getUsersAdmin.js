const { getDb } = require('../../database');

// List of admin emails with access to user management
const ADMIN_EMAILS = ['jamescrovo450@gmail.com'];

const getUsersAdmin = async (req, res) => {
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
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        const sortBy = req.query.sortBy || 'dateCreated';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        const search = req.query.search || '';
        const tierFilter = req.query.tier;
        
        // Build query
        const query = {};
        
        // Add search filter (email or name)
        if (search) {
            query.$or = [
                { email: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Add tier filter
        if (tierFilter !== undefined && tierFilter !== '') {
            query.tier = parseInt(tierFilter);
        }
        
        // Get total count for pagination
        const totalCount = await db.collection('users').countDocuments(query);
        
        // Get users with pagination
        const users = await db.collection('users')
            .find(query)
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(limit)
            .project({
                // Exclude sensitive data
                password: 0
            })
            .toArray();
        
        // Get summary statistics
        const summaryStats = await db.collection('users')
            .aggregate([
                {
                    $group: {
                        _id: '$tier',
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { _id: 1 }
                }
            ])
            .toArray();
        
        // Add tier names in JavaScript (more compatible)
        const summaryStatsWithNames = summaryStats.map(stat => ({
            ...stat,
            tierName: stat._id === 0 ? 'Free' : 
                     stat._id === 1 ? 'Basic' : 
                     stat._id === 2 ? 'Plus' : 'Unknown'
        }));
        
        res.json({
            success: true,
            users,
            summaryStats: summaryStatsWithNames,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        });
        
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users'
        });
    }
};

module.exports = { getUsersAdmin }; 
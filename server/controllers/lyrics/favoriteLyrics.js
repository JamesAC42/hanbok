const { getDb } = require('../../database');

// Get user's favorite lyrics with basic info
const getFavorites = async (req, res) => {
    try {
        const { user } = req.session;
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const db = getDb();
        
        // Get user's favorites with lyric information
        const favorites = await db.collection('user_favorite_lyrics').aggregate([
            {
                $match: { userId: user.userId }
            },
            {
                $lookup: {
                    from: 'lyrics',
                    localField: 'lyricId',
                    foreignField: 'lyricId',
                    as: 'lyricData'
                }
            },
            {
                $unwind: '$lyricData'
            },
            {
                $lookup: {
                    from: 'lyric_views',
                    localField: 'lyricId',
                    foreignField: 'lyricId',
                    as: 'viewData'
                }
            },
            {
                $project: {
                    lyricId: '$lyricData.lyricId',
                    title: '$lyricData.title',
                    artist: '$lyricData.artist',
                    anime: '$lyricData.anime',
                    genre: '$lyricData.genre',
                    language: '$lyricData.language',
                    isNew: '$lyricData.isNew',
                    dateFavorited: '$dateFavorited',
                    viewCount: { $ifNull: [{ $arrayElemAt: ['$viewData.viewCount', 0] }, 0] }
                }
            },
            {
                $sort: { dateFavorited: -1 }
            }
        ]).toArray();

        res.json({
            success: true,
            favorites
        });
    } catch (error) {
        console.error('Error getting favorite lyrics:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Add lyric to user's favorites
const addFavorite = async (req, res) => {
    try {
        const { user } = req.session;
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const { lyricId } = req.params;
        const db = getDb();

        // Check if lyric exists and is published
        const lyric = await db.collection('lyrics').findOne({ 
            lyricId, 
            published: true 
        });

        if (!lyric) {
            return res.status(404).json({
                success: false,
                message: 'Lyric not found'
            });
        }

        // Add to favorites (upsert to handle duplicates)
        const result = await db.collection('user_favorite_lyrics').updateOne(
            { userId: user.userId, lyricId },
            { 
                $setOnInsert: { 
                    userId: user.userId, 
                    lyricId, 
                    dateFavorited: new Date() 
                } 
            },
            { upsert: true }
        );

        const isNewFavorite = result.upsertedCount > 0;

        res.json({
            success: true,
            message: isNewFavorite ? 'Added to favorites' : 'Already in favorites',
            isFavorited: true
        });
    } catch (error) {
        console.error('Error adding favorite lyric:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Remove lyric from user's favorites
const removeFavorite = async (req, res) => {
    try {
        const { user } = req.session;
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const { lyricId } = req.params;
        const db = getDb();

        const result = await db.collection('user_favorite_lyrics').deleteOne({
            userId: user.userId,
            lyricId
        });

        res.json({
            success: true,
            message: result.deletedCount > 0 ? 'Removed from favorites' : 'Not in favorites',
            isFavorited: false
        });
    } catch (error) {
        console.error('Error removing favorite lyric:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Check if lyric is favorited by user
const checkFavorite = async (req, res) => {
    try {
        const { user } = req.session;
        if (!user) {
            return res.json({
                success: true,
                isFavorited: false
            });
        }

        const { lyricId } = req.params;
        const db = getDb();

        const favorite = await db.collection('user_favorite_lyrics').findOne({
            userId: user.userId,
            lyricId
        });

        res.json({
            success: true,
            isFavorited: !!favorite
        });
    } catch (error) {
        console.error('Error checking favorite lyric:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    getFavorites,
    addFavorite,
    removeFavorite,
    checkFavorite
}; 
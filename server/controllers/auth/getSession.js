const { getDb } = require('../../database');

const getSession = async (req, res) => {
    console.log('Session data:', req.session);
    console.log('Session user:', req.session.user);
    
    if (!req.session.user) {
        return res.status(401).json({ 
            success: false,
            message: 'No active session'
        });
    }

    try {
        const db = getDb();
        const user = await db.collection('users').findOne(
            { userId: req.session.user.userId }
        );

        console.log('Found user:', user);

        if (!user) {
            req.session.destroy();
            return res.status(401).json({ 
                success: false,
                message: 'Invalid session'
            });
        }

        res.json({
            success: true,
            user: {
                userId: user.userId,
                name: user.name,
                email: user.email,
                dateCreated: user.dateCreated
            }
        });

    } catch (error) {
        console.error('Session retrieval error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to retrieve session'
        });
    }
};

module.exports = getSession;

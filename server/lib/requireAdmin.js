const { getDb } = require('../database');
const ADMIN_EMAILS = require('./adminEmails');

// Lets the request through only for signed-in admins.
const requireAdmin = async (req, res, next) => {
    const userId = req.session?.user?.userId;
    if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized access' });
    }
    try {
        const user = await getDb().collection('users').findOne({ userId }, { projection: { email: 1 } });
        if (!user || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
            return res.status(403).json({ success: false, error: 'Unauthorized access' });
        }
        next();
    } catch (error) {
        console.error('Admin check failed:', error);
        res.status(500).json({ success: false, error: 'Admin check failed' });
    }
};

module.exports = requireAdmin;

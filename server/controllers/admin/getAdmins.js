const ADMIN_EMAILS = require('../../lib/adminEmails');
const getAdmins = async (req, res) => {
    res.status(200).json({admins: ADMIN_EMAILS});
}

module.exports = getAdmins;
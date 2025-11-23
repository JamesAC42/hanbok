const getAdmins = async (req, res) => {
    res.status(200).json({admins: ["james@jamescrovo.com", "jamescrovo450@gmail.com"]});
}

module.exports = getAdmins;
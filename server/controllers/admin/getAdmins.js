const getAdmins = async (req, res) => {
    res.status(200).json({admins: ["jamescrovo450@gmail.com"]});
}

module.exports = getAdmins;
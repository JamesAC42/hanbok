const { getDb } = require('../../database');
const { HEARD_FROM_OPTIONS } = require('../../utils/attribution');

// Saves the "How did you find Hanbok?" answer from the one-tap question new
// learners see after signing up. Only fills it in when signup didn't.
const setHeardFrom = async (req, res) => {
    const { heardFrom } = req.body || {};
    if (!HEARD_FROM_OPTIONS.includes(heardFrom)) {
        return res.status(400).json({ success: false, error: 'Unknown answer' });
    }
    try {
        await getDb().collection('users').updateOne(
            { userId: req.session.user.userId, 'attribution.heardFrom': { $exists: false } },
            { $set: { 'attribution.heardFrom': heardFrom, 'attribution.heardFromAskedAfterSignup': true } }
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Saving heardFrom failed:', error);
        res.status(500).json({ success: false, error: 'Could not save' });
    }
};

module.exports = { setHeardFrom };

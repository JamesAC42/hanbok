const { getDb } = require('../../database');
const ADMIN_EMAILS = require('../../lib/adminEmails');

async function assertAdmin(req, res) {
  const userId = req.session.user?.userId;

  if (!userId) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized access'
    });
    return null;
  }

  const db = getDb();
  const user = await db.collection('users').findOne({ userId });

  if (!user || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    res.status(403).json({
      success: false,
      error: 'Unauthorized access'
    });
    return null;
  }

  return user;
}

async function markSentenceDoNotCache(req, res) {
  try {
    const adminUser = await assertAdmin(req, res);
    if (!adminUser) return;

    const sentenceId = parseInt(req.params.sentenceId, 10);
    if (!Number.isInteger(sentenceId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid sentence ID'
      });
    }

    const db = getDb();
    const result = await db.collection('sentences').findOneAndUpdate(
      { sentenceId },
      {
        $set: {
          doNotCache: true,
          cacheDisabledAt: new Date(),
          cacheDisabledBy: adminUser.userId
        }
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Sentence not found'
      });
    }

    res.json({
      success: true,
      sentence: result
    });
  } catch (error) {
    console.error('Error marking sentence do-not-cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update sentence cache status'
    });
  }
}

module.exports = { markSentenceDoNotCache };

const { getDb } = require('../../database');
const ADMIN_EMAILS = require('../../lib/adminEmails');
const { getWordAudio } = require('../../utils/wordAudio');
const { getPresignedUrl } = require('../../elevenlabs/generateSpeech');

// Shared helper to enforce admin access
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

// GET /api/admin/word-audio
async function searchWordAudio(req, res) {
  try {
    const adminUser = await assertAdmin(req, res);
    if (!adminUser) return;

    const db = getDb();
    const wordAudioCollection = db.collection('word_audio');

    const { word, language } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 25, 1), 100);
    const skip = (page - 1) * limit;

    const query = {};

    if (word) {
      query.word = { $regex: word, $options: 'i' };
    }

    if (language) {
      query.language = language;
    }

    const total = await wordAudioCollection.countDocuments(query);

    const results = await wordAudioCollection
      .find(query)
      .sort({ dateGenerated: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Refresh expired presigned URLs (older than 6 days)
    const now = Date.now();
    const sixDaysInMs = 6 * 24 * 60 * 60 * 1000;
    
    const updatedResults = await Promise.all(results.map(async (item) => {
      const audioAge = item.dateGenerated ? (now - new Date(item.dateGenerated).getTime()) : Infinity;
      
      if (item.audioUrl && audioAge > sixDaysInMs) {
        try {
          const newUrl = await getPresignedUrl(item.audioUrl);
          // Update in DB
          await wordAudioCollection.updateOne(
            { _id: item._id },
            { $set: { audioUrl: newUrl, dateGenerated: new Date() } }
          );
          return { ...item, audioUrl: newUrl, dateGenerated: new Date() };
        } catch (err) {
          console.error(`Failed to refresh URL for ${item.word}:`, err);
          return item;
        }
      }
      return item;
    }));

    const sanitized = updatedResults.map((item) => ({
      _id: item._id?.toString(),
      word: item.word,
      language: item.language,
      hiraganaReading: item.hiraganaReading || null,
      audioUrl: item.audioUrl || null,
      dateGenerated: item.dateGenerated || null
    }));

    res.status(200).json({
      success: true,
      total,
      page,
      limit,
      items: sanitized
    });
  } catch (error) {
    console.error('Error searching word audio:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search word audio'
    });
  }
}

// POST /api/admin/word-audio/regenerate
async function regenerateWordAudio(req, res) {
  try {
    const adminUser = await assertAdmin(req, res);
    if (!adminUser) return;

    const { word, language, translation } = req.body || {};

    if (!word || !language) {
      return res.status(400).json({
        success: false,
        error: 'Word and language are required'
      });
    }

    if (language === 'ja' && !translation) {
      return res.status(400).json({
        success: false,
        error: 'Translation is required for Japanese words'
      });
    }

    const audioUrl = await getWordAudio(
      word,
      language,
      translation || null,
      true // force refresh
    );

    const db = getDb();
    const refreshed = await db.collection('word_audio')
      .find({ word, language })
      .sort({ dateGenerated: -1 })
      .limit(1)
      .next();

    res.status(200).json({
      success: true,
      audioUrl,
      record: refreshed
        ? {
            _id: refreshed._id?.toString(),
            word: refreshed.word,
            language: refreshed.language,
            hiraganaReading: refreshed.hiraganaReading || null,
            audioUrl: refreshed.audioUrl || audioUrl,
            dateGenerated: refreshed.dateGenerated || new Date()
          }
        : null
    });
  } catch (error) {
    console.error('Error regenerating word audio:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to regenerate word audio'
    });
  }
}

module.exports = {
  searchWordAudio,
  regenerateWordAudio
};

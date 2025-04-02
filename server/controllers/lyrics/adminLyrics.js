const { getDb } = require('../../database');
const { ObjectId } = require('mongodb');

// Admin emails with permission to manage lyrics
const ADMIN_EMAILS = ['admin@example.com', 'your-email@gmail.com']; // Update with your actual admin emails

// Helper function to check if user is admin
async function isAdmin(req) {
  if (!req.session.user) {
    return false;
  }
  
  const db = getDb();
  const user = await db.collection('users').findOne({ userId: req.session.user.userId });
  
  return user && ADMIN_EMAILS.includes(user.email);
}

// Get all lyrics (admin only)
async function getAllLyrics(req, res) {
  try {
    if (!await isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin access required'
      });
    }

    const db = getDb();
    
    // Get all lyrics with their analysis information
    const lyrics = await db.collection('lyrics').find({}).sort({ dateCreated: -1 }).toArray();
    
    // For each lyric, check if it has an analysis
    const lyricsWithAnalysisInfo = await Promise.all(lyrics.map(async lyric => {
      const analyses = await db.collection('lyrics_analysis')
        .find({ lyricId: lyric.lyricId })
        .project({ analysisId: 1, language: 1 })
        .toArray();
      
      return {
        ...lyric,
        hasAnalysis: analyses.length > 0,
        analyses: analyses
      };
    }));

    return res.status(200).json({
      success: true,
      lyrics: lyricsWithAnalysisInfo
    });
  } catch (error) {
    console.error('Error getting all lyrics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get lyrics',
      error: error.message
    });
  }
}

// Add new lyrics (admin only)
async function addLyrics(req, res) {
  try {
    if (!await isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin access required'
      });
    }

    const { title, artist, genre, youtubeUrl, lyricsText, language } = req.body;
    
    // Validation
    if (!title || !artist || !genre || !lyricsText || !language) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const db = getDb();
    
    // Get next lyricId from counter
    const counterUpdate = await db.collection('counters').findOneAndUpdate(
      { _id: 'lyricId' },
      { $inc: { seq: 1 } },
      { returnDocument: 'after' }
    );
    
    const lyricId = counterUpdate.value.seq;
    
    // Create new lyrics document
    const newLyric = {
      lyricId,
      title,
      artist,
      genre,
      youtubeUrl: youtubeUrl || null,
      published: false, // Default to unpublished
      dateCreated: new Date(),
      lyricsText,
      language
    };
    
    await db.collection('lyrics').insertOne(newLyric);
    
    return res.status(201).json({
      success: true,
      lyric: newLyric
    });
  } catch (error) {
    console.error('Error adding lyrics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add lyrics',
      error: error.message
    });
  }
}

// Update lyrics (admin only)
async function updateLyrics(req, res) {
  try {
    if (!await isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin access required'
      });
    }

    const lyricId = parseInt(req.params.lyricId);
    const { title, artist, genre, youtubeUrl, lyricsText, language, published } = req.body;
    
    // Validation
    if (!title && !artist && !genre && youtubeUrl === undefined && !lyricsText && !language && published === undefined) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    const db = getDb();
    
    // Build update object with only the fields that are provided
    const updateFields = {};
    if (title) updateFields.title = title;
    if (artist) updateFields.artist = artist;
    if (genre) updateFields.genre = genre;
    if (youtubeUrl !== undefined) updateFields.youtubeUrl = youtubeUrl;
    if (lyricsText) updateFields.lyricsText = lyricsText;
    if (language) updateFields.language = language;
    if (published !== undefined) updateFields.published = published;
    
    const result = await db.collection('lyrics').findOneAndUpdate(
      { lyricId },
      { $set: updateFields },
      { returnDocument: 'after' }
    );
    
    if (!result.value) {
      return res.status(404).json({
        success: false,
        message: 'Lyrics not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      lyric: result.value
    });
  } catch (error) {
    console.error('Error updating lyrics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update lyrics',
      error: error.message
    });
  }
}

// Toggle published status (admin only)
async function togglePublished(req, res) {
  try {
    if (!await isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin access required'
      });
    }

    const lyricId = parseInt(req.params.lyricId);
    
    const db = getDb();
    
    // Get current lyric
    const lyric = await db.collection('lyrics').findOne({ lyricId });
    
    if (!lyric) {
      return res.status(404).json({
        success: false,
        message: 'Lyrics not found'
      });
    }
    
    // Toggle published status
    const result = await db.collection('lyrics').findOneAndUpdate(
      { lyricId },
      { $set: { published: !lyric.published } },
      { returnDocument: 'after' }
    );
    
    return res.status(200).json({
      success: true,
      lyric: result.value
    });
  } catch (error) {
    console.error('Error toggling published status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to toggle published status',
      error: error.message
    });
  }
}

// Delete lyrics (admin only)
async function deleteLyrics(req, res) {
  try {
    if (!await isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin access required'
      });
    }

    const lyricId = parseInt(req.params.lyricId);
    
    const db = getDb();
    
    // Delete the lyrics
    const result = await db.collection('lyrics').deleteOne({ lyricId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lyrics not found'
      });
    }
    
    // Also delete any analyses for this lyric
    await db.collection('lyrics_analysis').deleteMany({ lyricId });
    
    return res.status(200).json({
      success: true,
      message: 'Lyrics and associated analyses deleted'
    });
  } catch (error) {
    console.error('Error deleting lyrics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete lyrics',
      error: error.message
    });
  }
}

module.exports = {
  getAllLyrics,
  addLyrics,
  updateLyrics,
  togglePublished,
  deleteLyrics,
  isAdmin // Export for use in other controllers
}; 
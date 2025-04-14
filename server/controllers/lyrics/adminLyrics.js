const { getDb } = require('../../database');
const { ObjectId } = require('mongodb');

// Admin email with permission to manage lyrics
const ADMIN_EMAIL = 'jamescrovo450@gmail.com';

// Helper function to generate URL-friendly lyricId
function generateLyricId(artist, title) {
  // Convert to lowercase and replace spaces with hyphens
  const sanitizedArtist = (artist || 'unknown').toLowerCase().replace(/\s+/g, '-');
  const sanitizedTitle = title.toLowerCase().replace(/\s+/g, '-');
  
  // Remove any non-alphanumeric characters except hyphens
  const cleanArtist = sanitizedArtist.replace(/[^a-z0-9-]/g, '');
  const cleanTitle = sanitizedTitle.replace(/[^a-z0-9-]/g, '');
  
  return `${cleanArtist}-${cleanTitle}`;
}

// Check if the user is an admin
async function isAdmin(req) {
  try {
    // Check if user is authenticated
    if (!req.session || !req.session.user || !req.session.user.userId) {
      return false;
    }
    
    const db = getDb();
    
    // Get the user from the database
    const user = await db.collection('users').findOne({ 
      userId: req.session.user.userId 
    });
    
    if (!user) {
      return false;
    }
    
    // Check if the user's email matches the admin email
    return user.email === ADMIN_EMAIL;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Get all lyrics (admin only)
async function getAllLyrics(req, res) {
  try {
    if (!isAdmin(req)) {
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
      const hasAnalysis = await db.collection('lyrics_analysis')
        .find({ lyricId: lyric._id.toString() })
        .limit(1) // Limit to 1 to check existence
        .count(); // Count the number of documents

      return {
        ...lyric,
        hasAnalysis: hasAnalysis > 0
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
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin access required'
      });
    }

    const { title, artist, genre, youtubeUrl, lyricsText, language, published } = req.body;
    
    // Validation
    if (!title || !genre || !lyricsText || !language) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const db = getDb();
    
    // Generate URL-friendly ID
    const lyricId = generateLyricId(artist, title);
    
    // Create new lyrics document
    const newLyric = {
      title,
      artist: artist || null,
      genre,
      youtubeUrl: youtubeUrl || null,
      published: published || false,
      dateCreated: new Date(),
      lyricsText,
      language,
      isNew: true,
      lyricId
    };
    
    const result = await db.collection('lyrics').insertOne(newLyric);
    
    // Add the _id to the response
    newLyric._id = result.insertedId;
    
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
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin access required'
      });
    }

    const lyricId = req.params.lyricId;
    const { title, artist, genre, youtubeUrl, anime, lyricsText, language, published } = req.body;
    
    // Validation
    if (!title || !genre || !lyricsText || !language) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const db = getDb();
    
    // Generate new URL-friendly ID if title or artist changed
    const newLyricId = generateLyricId(artist, title);
    
    const updateResult = await db.collection('lyrics').updateOne(
      { _id: new ObjectId(lyricId) },
      {
        $set: {
          title,
          artist: artist || null,
          anime: anime || null,
          genre,
          youtubeUrl: youtubeUrl || null,
          lyricsText,
          language,
          published: published || false,
          lastModified: new Date(),
          lyricId: newLyricId
        }
      }
    );
    
    if (updateResult.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lyric not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Lyric updated successfully'
    });
  } catch (error) {
    console.error('Error updating lyric:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update lyric',
      error: error.message
    });
  }
}

// Delete lyrics (admin only)
async function deleteLyrics(req, res) {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin access required'
      });
    }

    const lyricId = req.params.lyricId;
    const db = getDb();
    
    // Get the lyric to retrieve its lyricId string
    const lyric = await db.collection('lyrics').findOne({ _id: new ObjectId(lyricId) });
    
    if (!lyric) {
      return res.status(404).json({
        success: false,
        message: 'Lyric not found'
      });
    }
    
    // Delete the lyric
    const deleteResult = await db.collection('lyrics').deleteOne({ _id: new ObjectId(lyricId) });
    
    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lyric not found'
      });
    }
    
    // Delete associated analyses
    await db.collection('lyrics_analysis').deleteMany({ lyricId: lyric._id.toString() });
    
    // Delete the view count record
    await db.collection('lyric_views').deleteOne({ lyricId: lyric.lyricId });
    
    return res.status(200).json({
      success: true,
      message: 'Lyric and associated data deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting lyric:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete lyric',
      error: error.message
    });
  }
}

// Toggle published status (admin only)
async function togglePublished(req, res) {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin access required'
      });
    }

    const lyricId = parseInt(req.params.lyricId);
    const { published } = req.body;
    
    if (published === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Published status is required'
      });
    }

    const db = getDb();
    
    const updateResult = await db.collection('lyrics').updateOne(
      { lyricId },
      {
        $set: {
          published,
          lastModified: new Date()
        }
      }
    );
    
    if (updateResult.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lyric not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: `Lyric ${published ? 'published' : 'unpublished'} successfully`
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

module.exports = {
  getAllLyrics,
  addLyrics,
  updateLyrics,
  deleteLyrics,
  togglePublished,
  isAdmin
}; 
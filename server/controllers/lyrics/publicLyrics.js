const { getDb } = require('../../database');

// Get all published lyrics
async function getPublishedLyrics(req, res) {
  try {
    const db = getDb();
    
    // Filter options
    const language = req.query.language;
    const genre = req.query.genre;
    const artist = req.query.artist;
    const query = { published: true };
    
    // Add filter conditions if provided
    if (language) query.language = language;
    if (genre) query.genre = genre;
    if (artist) query.artist = artist;
    
    // Get all published lyrics with optional filtering
    const lyrics = await db.collection('lyrics')
      .find(query)
      .project({
        lyricId: 1,
        title: 1,
        artist: 1,
        genre: 1,
        language: 1,
        dateCreated: 1
      })
      .sort({ dateCreated: -1 })
      .toArray();
    
    // Get available languages for each lyric
    const lyricsWithLanguages = await Promise.all(
      lyrics.map(async lyric => {
        const availableAnalyses = await db.collection('lyrics_analysis')
          .find({ 
            lyricId: lyric.lyricId,
            published: true 
          })
          .project({ language: 1 })
          .toArray();
        
        return {
          ...lyric,
          availableLanguages: availableAnalyses.map(a => a.language)
        };
      })
    );
    
    return res.status(200).json({
      success: true,
      lyrics: lyricsWithLanguages
    });
  } catch (error) {
    console.error('Error getting published lyrics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get published lyrics',
      error: error.message
    });
  }
}

// Get a single published lyric by ID
async function getPublishedLyric(req, res) {
  try {
    const lyricId = parseInt(req.params.lyricId);
    
    const db = getDb();
    
    // Get the lyric
    const lyric = await db.collection('lyrics').findOne({ 
      lyricId, 
      published: true 
    });
    
    if (!lyric) {
      return res.status(404).json({
        success: false,
        message: 'Lyrics not found or not published'
      });
    }
    
    // Get available analysis languages
    const availableAnalyses = await db.collection('lyrics_analysis')
      .find({ 
        lyricId: lyric.lyricId,
        published: true 
      })
      .project({ language: 1 })
      .toArray();
    
    return res.status(200).json({
      success: true,
      lyric: {
        ...lyric,
        availableLanguages: availableAnalyses.map(a => a.language)
      }
    });
  } catch (error) {
    console.error('Error getting published lyric:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get published lyric',
      error: error.message
    });
  }
}

// Get available filter options (languages, genres, artists)
async function getFilterOptions(req, res) {
  try {
    const db = getDb();
    
    // Get distinct languages, genres, and artists from published lyrics
    const languages = await db.collection('lyrics')
      .distinct('language', { published: true });
    
    const genres = await db.collection('lyrics')
      .distinct('genre', { published: true });
    
    const artists = await db.collection('lyrics')
      .distinct('artist', { published: true });
    
    return res.status(200).json({
      success: true,
      filterOptions: {
        languages,
        genres,
        artists
      }
    });
  } catch (error) {
    console.error('Error getting filter options:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get filter options',
      error: error.message
    });
  }
}

module.exports = {
  getPublishedLyrics,
  getPublishedLyric,
  getFilterOptions
}; 
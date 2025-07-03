const { getDb } = require('../../database');
const { getCachedLyricsData, cacheLyricsData } = require('../../utils/lyricsCache');
const {isAdmin} = require("./adminLyrics");

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
        anime: 1,
        genre: 1,
        language: 1,
        dateCreated: 1
      })
      .sort({ dateCreated: -1 })
      .toArray();
    
    // Get view counts for all lyrics
    const lyricIds = lyrics.map(lyric => lyric.lyricId);
    const viewCounts = await db.collection('lyric_views')
      .find({ lyricId: { $in: lyricIds } })
      .project({ lyricId: 1, viewCount: 1 })
      .toArray();
    
    // Create a map of lyricId to viewCount for efficient lookup
    const viewCountMap = {};
    viewCounts.forEach(view => {
      viewCountMap[view.lyricId] = view.viewCount;
    });
    
    // Add view counts to lyrics
    const lyricsWithViews = lyrics.map(lyric => ({
      ...lyric,
      viewCount: viewCountMap[lyric.lyricId] || 0
    }));
    
    // Return the lyrics with view counts
    return res.status(200).json({
      success: true,
      lyrics: lyricsWithViews
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
    const lyricId = req.params.lyricId;
    const language = req.query.language || 'en'; // Default to English if not specified
    
    const db = getDb();
    
    // Get the lyric
    const lyric = await db.collection('lyrics').findOne({ 
      lyricId
    });
    
    if (!lyric) {
      return res.status(404).json({
        success: false,
        message: 'Lyrics not found or not published'
      });
    }

    const userIsAdmin = await isAdmin(req);

    if (!lyric.published && !userIsAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Lyrics not found or not published'
      });
    }
    
    // Increment view count or create a new view record if it doesn't exist
    let viewData = await db.collection('lyric_views').findOne({ lyricId });
    
    if (viewData) {
      await db.collection('lyric_views').updateOne(
        { lyricId },
        { 
          $inc: { viewCount: 1 },
          $set: { lastViewed: new Date() }
        }
      );
      viewData.viewCount += 1;
    } else {
      viewData = { 
        lyricId, 
        viewCount: 1, 
        lastViewed: new Date() 
      };
      await db.collection('lyric_views').insertOne(viewData);
    }
    
    const cachedData = await getCachedLyricsData(lyricId, language);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        cached: true,
        lyric: {
          ...cachedData,
          viewCount: viewData.viewCount
        }
      });
    }
    
    // Get the analysis for the requested language
    const analysis = await db.collection('lyrics_analysis').findOne({
      lyricId: lyric._id.toString(),
      language: language
    });
    
    if (!analysis) {
      // Return the lyric without analysis if no analysis is available
      const result = {
        ...lyric,
        analysis: null,
        sentences: [],
        viewCount: viewData.viewCount
      };
      
      // Cache the result without viewCount (we'll add it later when serving from cache)
      const cacheResult = {
        ...result
      };
      delete cacheResult.viewCount;
      await cacheLyricsData(lyricId, language, cacheResult);
      
      return res.status(200).json({
        success: true,
        lyric: result
      });
    }
    
    // Parse the analysis data from JSON string
    const analysisData = JSON.parse(analysis.analysisData || '[]');
    
    // Get all sentences for this analysis
    const sentenceIds = analysisData.map(item => item.sentenceId);
    const sentences = await db.collection('sentences')
      .find({ sentenceId: { $in: sentenceIds } })
      .toArray();
    
    // Create a mapping of sentenceId to sentence data
    const sentenceMap = {};
    sentences.forEach(sentence => {
      sentenceMap[sentence.sentenceId] = sentence;
    });
    
    // Combine the analysis data with sentence data
    const analysisWithSentences = analysisData.map(item => ({
      ...item,
      sentence: sentenceMap[item.sentenceId] || null
    }));
    
    // Create the final result
    const result = {
      ...lyric,
      analysis: {
        ...analysis,
        analysisData: analysisWithSentences
      },
      viewCount: viewData.viewCount
    };
    
    // Cache the result without viewCount (we'll add it later when serving from cache)
    const cacheResult = {
      ...result
    };
    delete cacheResult.viewCount;
    await cacheLyricsData(lyricId, language, cacheResult);
    
    return res.status(200).json({
      success: true,
      lyric: result
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

// Get recently published lyrics (last 7 days)
async function getRecentLyrics(req, res) {
  try {
    const db = getDb();
    
    // Calculate date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Get all published lyrics from the last 7 days
    const lyrics = await db.collection('lyrics')
      .find({ 
        published: true,
        dateCreated: { $gte: sevenDaysAgo }
      })
      .project({
        lyricId: 1,
        title: 1,
        artist: 1,
        anime: 1,
        genre: 1,
        language: 1,
        dateCreated: 1
      })
      .sort({ dateCreated: -1 })
      .toArray();
    
    // Get view counts for all recent lyrics
    const lyricIds = lyrics.map(lyric => lyric.lyricId);
    const viewCounts = await db.collection('lyric_views')
      .find({ lyricId: { $in: lyricIds } })
      .project({ lyricId: 1, viewCount: 1 })
      .toArray();
    
    // Create a map of lyricId to viewCount for efficient lookup
    const viewCountMap = {};
    viewCounts.forEach(view => {
      viewCountMap[view.lyricId] = view.viewCount;
    });
    
    // Add view counts to lyrics
    const lyricsWithViews = lyrics.map(lyric => ({
      ...lyric,
      viewCount: viewCountMap[lyric.lyricId] || 0
    }));
    
    return res.status(200).json({
      success: true,
      lyrics: lyricsWithViews
    });
  } catch (error) {
    console.error('Error getting recent lyrics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get recent lyrics',
      error: error.message
    });
  }
}

module.exports = {
  getPublishedLyrics,
  getPublishedLyric,
  getFilterOptions,
  getRecentLyrics
}; 
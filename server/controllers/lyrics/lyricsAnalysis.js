const { getDb } = require('../../database');
const { isAdmin } = require('./adminLyrics');

// Initialize lyrics analysis (admin only)
async function initializeAnalysis(req, res) {
  try {
    if (!await isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin access required'
      });
    }

    const lyricId = parseInt(req.params.lyricId);
    const { language } = req.body;
    
    if (!language) {
      return res.status(400).json({
        success: false,
        message: 'Language is required'
      });
    }

    const db = getDb();
    
    // Check if the lyric exists
    const lyric = await db.collection('lyrics').findOne({ lyricId });
    
    if (!lyric) {
      return res.status(404).json({
        success: false,
        message: 'Lyrics not found'
      });
    }
    
    // Check if an analysis already exists for this lyric in this language
    const existingAnalysis = await db.collection('lyrics_analysis').findOne({ 
      lyricId, 
      language 
    });
    
    if (existingAnalysis) {
      return res.status(409).json({
        success: false,
        message: 'Analysis already exists for this lyric in this language'
      });
    }
    
    // Get next analysisId from counter
    const counterUpdate = await db.collection('counters').findOneAndUpdate(
      { _id: 'analysisId' },
      { $inc: { seq: 1 } },
      { returnDocument: 'after' }
    );
    
    const analysisId = counterUpdate.value.seq;
    
    // Create empty analysis
    const newAnalysis = {
      analysisId,
      lyricId,
      language,
      dateCreated: new Date(),
      analysisData: JSON.stringify([]), // Empty array for now
      translationText: null,
      published: false
    };
    
    await db.collection('lyrics_analysis').insertOne(newAnalysis);
    
    return res.status(201).json({
      success: true,
      analysis: newAnalysis
    });
  } catch (error) {
    console.error('Error initializing analysis:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to initialize analysis',
      error: error.message
    });
  }
}

// Update lyrics analysis (admin only)
async function updateAnalysis(req, res) {
  try {
    if (!await isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin access required'
      });
    }

    const analysisId = parseInt(req.params.analysisId);
    const { analysisData, translationText, published } = req.body;
    
    // Validation
    if (!analysisData && !translationText && published === undefined) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    const db = getDb();
    
    // Build update object with only the fields that are provided
    const updateFields = {};
    if (analysisData) {
      // Ensure analysisData is a string (JSON)
      updateFields.analysisData = typeof analysisData === 'string' 
        ? analysisData 
        : JSON.stringify(analysisData);
    }
    if (translationText !== undefined) updateFields.translationText = translationText;
    if (published !== undefined) updateFields.published = published;
    
    const result = await db.collection('lyrics_analysis').findOneAndUpdate(
      { analysisId },
      { $set: updateFields },
      { returnDocument: 'after' }
    );
    
    if (!result.value) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      analysis: result.value
    });
  } catch (error) {
    console.error('Error updating analysis:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update analysis',
      error: error.message
    });
  }
}

// Delete lyrics analysis (admin only)
async function deleteAnalysis(req, res) {
  try {
    if (!await isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin access required'
      });
    }

    const analysisId = parseInt(req.params.analysisId);
    
    const db = getDb();
    
    // Delete the analysis
    const result = await db.collection('lyrics_analysis').deleteOne({ analysisId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Analysis deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting analysis:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete analysis',
      error: error.message
    });
  }
}

// Get analysis for a lyric
async function getAnalysis(req, res) {
  try {
    const lyricId = parseInt(req.params.lyricId);
    const language = req.query.language || 'en'; // Default to English if not specified
    
    const db = getDb();
    
    // Get the lyric
    const lyric = await db.collection('lyrics').findOne({ lyricId });
    
    if (!lyric) {
      return res.status(404).json({
        success: false,
        message: 'Lyrics not found'
      });
    }
    
    // For non-published lyrics, only allow admin
    if (!lyric.published && !await isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin access required for unpublished lyrics'
      });
    }
    
    // Get the analysis
    const analysis = await db.collection('lyrics_analysis').findOne({ 
      lyricId, 
      language 
    });
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: `Analysis not found for language: ${language}`
      });
    }
    
    // For non-published analysis, only allow admin
    if (analysis.published === false && !await isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin access required for unpublished analysis'
      });
    }
    
    // Parse the analysis data from JSON string to object
    let parsedAnalysis = { ...analysis };
    try {
      parsedAnalysis.analysisData = JSON.parse(analysis.analysisData);
    } catch (e) {
      console.error('Error parsing analysis data:', e);
      parsedAnalysis.analysisData = [];
    }
    
    return res.status(200).json({
      success: true,
      lyric,
      analysis: parsedAnalysis
    });
  } catch (error) {
    console.error('Error getting analysis:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get analysis',
      error: error.message
    });
  }
}

module.exports = {
  initializeAnalysis,
  updateAnalysis,
  deleteAnalysis,
  getAnalysis
}; 
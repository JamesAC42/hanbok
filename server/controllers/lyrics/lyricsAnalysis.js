const { getDb } = require('../../database');
const { isAdmin } = require('./adminLyrics');
const { ObjectId } = require('mongodb');

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

    const db = getDb();
    const { lyricId } = req.params;
    
    // Find the analysis first to get the sentenceIds
    let analysis;
    
    // Check if lyricId is an ObjectId format
    if (lyricId.match(/^[0-9a-fA-F]{24}$/)) {
      analysis = await db.collection('lyrics_analysis').findOne({ 
        lyricId: lyricId
      });
    }
    
    // If not found, try with the numeric lyricId
    if (!analysis) {
      const lyric = await db.collection('lyrics').findOne({ 
        _id: new ObjectId(lyricId) 
      });
      
      if (lyric) {
        analysis = await db.collection('lyrics_analysis').findOne({ 
          lyricId: lyric._id.toString()
        });
      }
    }
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }
    
    // Parse the analysisData to get all sentenceIds
    let sentenceIds = [];
    try {
      const analysisData = JSON.parse(analysis.analysisData);
      sentenceIds = analysisData.map(item => item.sentenceId).filter(id => id);
      console.log(`Found ${sentenceIds.length} sentences to delete for lyric ${lyricId}`);
    } catch (e) {
      console.error('Error parsing analysis data:', e);
      // Continue with deletion even if parsing fails
    }
    
    // Delete all associated sentences if any were found
    if (sentenceIds.length > 0) {
      const deleteResult = await db.collection('sentences').deleteMany({
        sentenceId: { $in: sentenceIds }
      });
      
      console.log(`Deleted ${deleteResult.deletedCount} sentences for lyric ${lyricId}`);
    }
    
    // Delete the analysis entry
    const result = await db.collection('lyrics_analysis').deleteOne({ 
      _id: analysis._id
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Failed to delete analysis'
      });
    }
    
    // Update the lyric to reflect that it no longer has analysis
    await db.collection('lyrics').updateOne(
      { _id: new ObjectId(lyricId) },
      { $set: { hasAnalysis: false } }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Analysis and associated sentences deleted successfully',
      deletedSentences: sentenceIds.length
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
    const { lyricId } = req.params;
    
    const db = getDb();
    
    // Get the lyric - lyricId can now be either ObjectId or a string ID
    let lyric;
    
    // Try to look up by ObjectId if valid format
    if (lyricId.match(/^[0-9a-fA-F]{24}$/)) {
      lyric = await db.collection('lyrics').findOne({ _id: new ObjectId(lyricId) });
    } 
    
    // If not found, try as a string ID
    if (!lyric) {
      lyric = await db.collection('lyrics').findOne({ lyricId });
    }
    
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
    
    // Check if analysis exists - just check for existence, don't load data
    const hasAnalysis = await db.collection('lyrics_analysis').countDocuments({
      lyricId: lyric._id.toString()
    }, { limit: 1 }) > 0;
    
    // Return the lyric with the hasAnalysis field
    return res.status(200).json({
      success: true,
      lyric: {
        ...lyric,
        hasAnalysis
      }
    });
  } catch (error) {
    console.error('Error checking analysis existence:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get analysis status',
      error: error.message
    });
  }
}

// Get full analysis data for a lyric
async function getFullAnalysis(req, res) {
  try {
    const { lyricId } = req.params;
    const language = req.query.language || 'en'; // Default to English if not specified
    
    const db = getDb();
    
    // Get the lyric - lyricId can now be either ObjectId or a string ID
    let lyric;
    
    // Try to look up by ObjectId if valid format
    if (lyricId.match(/^[0-9a-fA-F]{24}$/)) {
      lyric = await db.collection('lyrics').findOne({ _id: new ObjectId(lyricId) });
    } 
    
    // If not found, try as a string ID
    if (!lyric) {
      lyric = await db.collection('lyrics').findOne({ lyricId });
    }
    
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
    
    // Get the analysis - support both ObjectId and string ID formats
    let analysis;
    
    // Try with the ObjectId string
    analysis = await db.collection('lyrics_analysis').findOne({ 
      lyricId: lyric._id.toString(),
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
    
    // Get the sentence data for each analysis
    const sentenceIds = parsedAnalysis.analysisData.map(item => item.sentenceId);
    
    if (sentenceIds.length > 0) {
      const sentences = await db.collection('sentences').find({ 
        sentenceId: { $in: sentenceIds } 
      }).toArray();
      
      // Create a map for quick lookup
      const sentenceMap = sentences.reduce((map, sentence) => {
        map[sentence.sentenceId] = sentence;
        return map;
      }, {});
      
      // Add complete sentence data to each analysis item
      parsedAnalysis.analysisData = parsedAnalysis.analysisData.map(item => {
        return {
          ...item,
          sentence: sentenceMap[item.sentenceId] || null
        };
      });
    }
    
    return res.status(200).json({
      success: true,
      lyric,
      analysis: parsedAnalysis
    });
  } catch (error) {
    console.error('Error getting full analysis:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get full analysis',
      error: error.message
    });
  }
}

module.exports = {
  initializeAnalysis,
  updateAnalysis,
  deleteAnalysis,
  getAnalysis,
  getFullAnalysis
}; 
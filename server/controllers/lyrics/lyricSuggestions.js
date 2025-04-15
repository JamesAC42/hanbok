const { getDb } = require('../../database');
const { isAdmin } = require('./adminLyrics');

// Get all lyric suggestions
async function getSuggestions(req, res) {

  try {
    const db = getDb();
    
    // Default status filter for users is 'pending' or 'approved'
    // Admins can see all by passing status=all or specific status
    let statusFilter = {};
    const requestedStatus = req.query.status;
    if (await isAdmin(req)) {
      if (requestedStatus && requestedStatus !== 'all') {
        statusFilter = { status: requestedStatus };
      }
    } else {
      // Non-admins can only see pending or approved
      statusFilter = { 
        $or: [
          { status: 'pending' }, 
          { status: 'approved' }
        ]
      };
    }
    
    // Define sort order
    const sortField = req.query.sort || 'upvotes';
    const sortOrder = parseInt(req.query.order) || -1; // Default to descending
    const sortOptions = {};
    sortOptions[sortField] = sortOrder;
    
    // Get suggestions with optional filtering
    const suggestions = await db.collection('lyric_suggestions')
      .find(statusFilter)
      .sort(sortOptions)
      .toArray();
    
    // For each suggestion, check if the current user has upvoted it
    let suggestionsWithUserUpvoteStatus = suggestions;
    
    if (req.session.user) {
      const userId = req.session.user.userId;
      
      suggestionsWithUserUpvoteStatus = await Promise.all(
        suggestions.map(async suggestion => {
          const userUpvote = await db.collection('lyric_suggestion_upvotes').findOne({
            userId,
            suggestionId: suggestion.suggestionId
          });
          
          return {
            ...suggestion,
            userHasUpvoted: !!userUpvote
          };
        })
      );
    }
    
    return res.status(200).json({
      success: true,
      suggestions: suggestionsWithUserUpvoteStatus
    });
  } catch (error) {
    console.error('Error getting suggestions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get suggestions',
      error: error.message
    });
  }
}

// Add a new lyric suggestion
async function addSuggestion(req, res) {
  try {
    // User must be logged in
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { songName, artist, genre, youtubeUrl, language } = req.body;
    
    // Validation
    if (!songName || !artist) {
      return res.status(400).json({
        success: false,
        message: 'Song name and artist are required'
      });
    }

    const db = getDb();
    
    // Get next suggestionId from counter
    let suggestionId = 1;
    try {
      // First make sure the counter exists, create it if it doesn't
      const counterExists = await db.collection('counters').findOne({ _id: 'suggestionId' });
      if (!counterExists) {
        await db.collection('counters').insertOne({ _id: 'suggestionId', seq: 1 });
        suggestionId = 1;
      } else {
        // Use findOneAndUpdate with returnDocument set to 'after'
        const result = await db.collection('counters').findOneAndUpdate(
          { _id: 'suggestionId' },
          { $inc: { seq: 1 } },
          { returnDocument: 'after' }
        );
        
        // Check if result and result.value exist before accessing
        if (result && result.value) {
          suggestionId = result.value.seq;
        } else {
          // Fallback - get the current value
          const current = await db.collection('counters').findOne({ _id: 'suggestionId' });
          suggestionId = current ? current.seq : 1;
        }
      }
    } catch (counterError) {
      console.error('Error with suggestion counter:', counterError);
      // Fallback strategy - find max existing ID and add 1
      const highestSuggestion = await db.collection('lyric_suggestions')
        .find({})
        .sort({ suggestionId: -1 })
        .limit(1)
        .toArray();
      
      if (highestSuggestion.length > 0) {
        suggestionId = highestSuggestion[0].suggestionId + 1;
      }
      
      // Also try to fix the counter for next time
      try {
        await db.collection('counters').updateOne(
          { _id: 'suggestionId' }, 
          { $set: { seq: suggestionId } },
          { upsert: true }
        );
      } catch (fixError) {
        console.error('Could not fix counter:', fixError);
      }
    }
    
    // Create new suggestion
    const newSuggestion = {
      suggestionId,
      songName,
      artist,
      userId: req.session.user.userId,
      dateCreated: new Date(),
      upvotes: 1, // Initial upvote from the creator
      genre: genre || null,
      youtubeUrl: youtubeUrl || null,
      language: language || null,
      status: 'pending'
    };
    
    await db.collection('lyric_suggestions').insertOne(newSuggestion);
    
    // Add the creator's upvote to the upvotes collection
    await db.collection('lyric_suggestion_upvotes').insertOne({
      userId: req.session.user.userId,
      suggestionId,
      dateUpvoted: new Date()
    });
    
    // Return with userHasUpvoted flag
    return res.status(201).json({
      success: true,
      suggestion: {
        ...newSuggestion,
        userHasUpvoted: true
      }
    });
  } catch (error) {
    console.error('Error adding suggestion:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add suggestion',
      error: error.message
    });
  }
}

// Upvote a suggestion
async function upvoteSuggestion(req, res) {
  try {
    // User must be logged in
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const suggestionId = parseInt(req.params.suggestionId);
    const userId = req.session.user.userId;
    
    const db = getDb();
    
    // Check if suggestion exists
    const suggestion = await db.collection('lyric_suggestions').findOne({ suggestionId });
    
    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Suggestion not found'
      });
    }
    
    // Check if user already upvoted
    const existingUpvote = await db.collection('lyric_suggestion_upvotes').findOne({
      userId,
      suggestionId
    });
    
    let updatedSuggestion;
    let userHasUpvoted;
    
    if (existingUpvote) {
      // User already upvoted, so remove the upvote
      await db.collection('lyric_suggestion_upvotes').deleteOne({
        userId,
        suggestionId
      });

      // Decrease upvote count
      updatedSuggestion = await db.collection('lyric_suggestions').findOneAndUpdate(
        { suggestionId },
        { $inc: { upvotes: -1 } },
        { returnDocument: 'after' }
      );
      
      userHasUpvoted = false;
    } else {
      // User hasn't upvoted yet, so add the upvote
      await db.collection('lyric_suggestion_upvotes').insertOne({
        userId,
        suggestionId,
        dateUpvoted: new Date()
      });

      // Increase upvote count
      updatedSuggestion = await db.collection('lyric_suggestions').findOneAndUpdate(
        { suggestionId },
        { $inc: { upvotes: 1 } },
        { returnDocument: 'after' }
      );
      
      userHasUpvoted = true;
    }
    
    // Return updated suggestion with user upvote status
    return res.status(200).json({
      success: true,
      suggestion: {
        ...updatedSuggestion,
        userHasUpvoted
      }
    });
  } catch (error) {
    console.error('Error upvoting suggestion:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upvote suggestion',
      error: error.message
    });
  }
}

// Update suggestion status (admin only)
async function updateSuggestionStatus(req, res) {
  try {
    if (!await isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin access required'
      });
    }

    const suggestionId = parseInt(req.params.suggestionId);
    const { status } = req.body;
    
    // Validation
    if (!status || !['pending', 'approved', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (pending, approved, rejected, or completed)'
      });
    }

    const db = getDb();
    
    const result = await db.collection('lyric_suggestions').findOneAndUpdate(
      { suggestionId },
      { $set: { status } },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Suggestion not found'
      });
    }
    
    // Check if the current user has upvoted this suggestion
    let userHasUpvoted = false;
    if (req.session.user) {
      const upvote = await db.collection('lyric_suggestion_upvotes').findOne({
        userId: req.session.user.userId,
        suggestionId
      });
      userHasUpvoted = !!upvote;
    }
    
    return res.status(200).json({
      success: true,
      suggestion: {
        ...result,
        userHasUpvoted
      }
    });
  } catch (error) {
    console.error('Error updating suggestion status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update suggestion status',
      error: error.message
    });
  }
}

// Delete a suggestion (admin only)
async function deleteSuggestion(req, res) {
  try {
    if (!await isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin access required'
      });
    }

    const suggestionId = parseInt(req.params.suggestionId);
    
    const db = getDb();
    
    const result = await db.collection('lyric_suggestions').deleteOne({ suggestionId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Suggestion not found'
      });
    }
    
    // Also clean up any upvotes for this suggestion
    await db.collection('lyric_suggestion_upvotes').deleteMany({ suggestionId });
    
    return res.status(200).json({
      success: true,
      message: 'Suggestion deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting suggestion:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete suggestion',
      error: error.message
    });
  }
}

module.exports = {
  getSuggestions,
  addSuggestion,
  upvoteSuggestion,
  updateSuggestionStatus,
  deleteSuggestion
}; 
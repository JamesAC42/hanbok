const { getDb } = require('../../database');

// Get next sequence number for IDs
const getNextSequence = async (name) => {
  const db = getDb();
  const result = await db.collection('counters').findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true }
  );
  return result.seq;
};

// Get comments for a lyric
const getComments = async (req, res) => {
  try {
    const { lyricId } = req.params;
    const db = getDb();
    
    // Get comments with user information
    const comments = await db.collection('lyric_comments').aggregate([
      {
        $match: { 
          lyricId: lyricId,
          isDeleted: { $ne: true }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: 'userId',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          commentId: 1,
          content: 1,
          dateCreated: 1,
          upvotes: 1,
          downvotes: 1,
          'user.name': 1,
          'user.userId': 1
        }
      },
      {
        $sort: { dateCreated: -1 }
      }
    ]).toArray();
    
    // Get user's votes if authenticated
    let userVotes = {};
    if (req.session.user) {
      const votes = await db.collection('lyric_comment_votes').find({
        userId: req.session.user.userId,
        commentId: { $in: comments.map(c => c.commentId) }
      }).toArray();
      
      userVotes = votes.reduce((acc, vote) => {
        acc[vote.commentId] = vote.voteType;
        return acc;
      }, {});
    }
    
    // Add user vote information to comments
    const commentsWithVotes = comments.map(comment => ({
      ...comment,
      userVote: userVotes[comment.commentId] || null
    }));
    
    res.json({
      success: true,
      comments: commentsWithVotes
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comments'
    });
  }
};

// Get comment count for a lyric
const getCommentCount = async (req, res) => {
  try {
    const { lyricId } = req.params;
    const db = getDb();
    
    const count = await db.collection('lyric_comments').countDocuments({
      lyricId: lyricId,
      isDeleted: { $ne: true }
    });
    
    res.json({
      success: true,
      count: count
    });
  } catch (error) {
    console.error('Error fetching comment count:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comment count'
    });
  }
};

// Add a comment
const addComment = async (req, res) => {
  try {
    const { lyricId } = req.params;
    const { content } = req.body;
    const userId = req.session.user.userId;
    
    // Validate content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content cannot be empty'
      });
    }
    
    if (content.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 1000 characters'
      });
    }
    
    const db = getDb();
    
    // Check rate limit - 10 seconds between comments
    const lastComment = await db.collection('lyric_comments').findOne(
      { userId: userId },
      { sort: { dateCreated: -1 } }
    );
    
    if (lastComment) {
      const timeSinceLastComment = Date.now() - lastComment.dateCreated.getTime();
      const tenSeconds = 10 * 1000;
      
      if (timeSinceLastComment < tenSeconds) {
        const remainingTime = Math.ceil((tenSeconds - timeSinceLastComment) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${remainingTime} seconds before posting another comment`
        });
      }
    }
    
    // Verify lyric exists
    const lyric = await db.collection('lyrics').findOne({ lyricId: lyricId });
    if (!lyric) {
      return res.status(404).json({
        success: false,
        message: 'Lyric not found'
      });
    }
    
    // Create comment
    const commentId = await getNextSequence('commentId');
    const comment = {
      commentId,
      lyricId,
      userId,
      content: content.trim(),
      dateCreated: new Date(),
      upvotes: 0,
      downvotes: 0,
      isDeleted: false
    };
    
    await db.collection('lyric_comments').insertOne(comment);
    
    // Get user info for response
    const user = await db.collection('users').findOne({ userId }, { projection: { name: 1, userId: 1 } });
    
    res.json({
      success: true,
      comment: {
        commentId: comment.commentId,
        content: comment.content,
        dateCreated: comment.dateCreated,
        upvotes: comment.upvotes,
        downvotes: comment.downvotes,
        user: user,
        userVote: null
      }
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding comment'
    });
  }
};

// Vote on a comment
const voteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    let { voteType } = req.body;
    const userId = req.session.user.userId;

    
    // Validate vote type
    if (!['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vote type'
      });
    }
    
    const db = getDb();
    
    // Check if comment exists
    const comment = await db.collection('lyric_comments').findOne({ 
      commentId: parseInt(commentId),
      isDeleted: { $ne: true }
    });
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }
    
    // Check if user already voted
    const existingVote = await db.collection('lyric_comment_votes').findOne({
      userId: userId,
      commentId: parseInt(commentId)
    });
    
    let upvoteChange = 0;
    let downvoteChange = 0;
    
    if (existingVote) {
      // User is changing their vote or removing it
      if (existingVote.voteType === voteType) {
        // Remove vote
        await db.collection('lyric_comment_votes').deleteOne({
          userId: userId,
          commentId: parseInt(commentId)
        });
        
        if (voteType === 'upvote') {
          upvoteChange = -1;
        } else {
          downvoteChange = -1;
        }
        
        voteType = null; // For response
      } else {
        // Change vote
        await db.collection('lyric_comment_votes').updateOne(
          { userId: userId, commentId: parseInt(commentId) },
          { 
            $set: { 
              voteType: voteType,
              dateVoted: new Date()
            } 
          }
        );
        
        if (voteType === 'upvote') {
          upvoteChange = 1;
          downvoteChange = -1;
        } else {
          upvoteChange = -1;
          downvoteChange = 1;
        }
      }
    } else {
      // New vote
      await db.collection('lyric_comment_votes').insertOne({
        userId: userId,
        commentId: parseInt(commentId),
        voteType: voteType,
        dateVoted: new Date()
      });
      
      if (voteType === 'upvote') {
        upvoteChange = 1;
      } else {
        downvoteChange = 1;
      }
    }
    
    // Update comment vote counts
    await db.collection('lyric_comments').updateOne(
      { commentId: parseInt(commentId) },
      { 
        $inc: { 
          upvotes: upvoteChange,
          downvotes: downvoteChange
        } 
      }
    );
    
    // Get updated comment
    const updatedComment = await db.collection('lyric_comments').findOne({
      commentId: parseInt(commentId)
    });
    
    res.json({
      success: true,
      upvotes: updatedComment.upvotes,
      downvotes: updatedComment.downvotes,
      userVote: voteType
    });
  } catch (error) {
    console.error('Error voting on comment:', error);
    res.status(500).json({
      success: false,
      message: 'Error voting on comment'
    });
  }
};

// Delete a comment (user can only delete their own)
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.session.user.userId;
    
    const db = getDb();
    
    // Check if comment exists and belongs to user
    const comment = await db.collection('lyric_comments').findOne({
      commentId: parseInt(commentId),
      userId: userId,
      isDeleted: { $ne: true }
    });
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found or you do not have permission to delete it'
      });
    }
    
    // Soft delete the comment
    await db.collection('lyric_comments').updateOne(
      { commentId: parseInt(commentId) },
      { $set: { isDeleted: true } }
    );
    
    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting comment'
    });
  }
};

module.exports = {
  getComments,
  getCommentCount,
  addComment,
  voteComment,
  deleteComment
}; 
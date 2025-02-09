const getUserWords = async (req, res) => {

    
  const { userId } = req.params;

  try {
    const userWords = await db.collection('user_progress')
      .aggregate([
        { 
          $match: { 
            userId: new ObjectId(userId),
            type: 'word'
          }
        },
        {
          $lookup: {
            from: 'words',
            localField: 'itemId',
            foreignField: '_id',
            as: 'wordDetails'
          }
        },
        {
          $unwind: '$wordDetails'
        }
      ]).toArray();

    res.json(userWords);
  } catch (error) {
    console.error('Error fetching user words:', error);
    res.status(500).json({ error: 'Failed to fetch words' });
  }
}

module.exports = getUserWords;
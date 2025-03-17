const { getWordAudio } = require('../../utils/wordAudio');

/**
 * Get audio for a word
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getWordAudioController = async (req, res) => {
  try {
    const { word, language, translation, forceRefresh } = req.query;
    
    if (!word || !language) {
      return res.status(400).json({
        success: false,
        message: 'Word and language are required'
      });
    }
    
    // For Japanese words, translation is required
    if (language === 'ja' && !translation) {
      return res.status(400).json({
        success: false,
        message: 'Translation is required for Japanese words'
      });
    }
    
    const audioUrl = await getWordAudio(
      word, 
      language, 
      translation, // Pass the translation for Japanese words
      forceRefresh === 'true'
    );
    
    return res.status(200).json({
      success: true,
      audioUrl
    });
  } catch (error) {
    console.error('Error getting word audio:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get word audio',
      error: error.message
    });
  }
};

module.exports = getWordAudioController; 
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

const session = require('express-session');
const {createClient} = require('redis');
const {RedisStore} = require('connect-redis');

// Import Bull queue and cleanup function
const { analysisQueue } = require('./jobs/queue');
const { cleanupRedisConnections } = require('./controllers/lyrics/generateLyricAnalysis');

// Create Redis client with configuration
const redisClient = createClient({
  password: process.env.REDIS_PW || undefined,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Redis connection failed after multiple retries');
        return false;
      }
      return Math.min(retries * 100, 3000);
    }
  }
});

// Handle Redis connection events
redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));

// Initialize Redis store
const redisStore = new RedisStore({ 
    client: redisClient,
    prefix: "hanbok:"
});

const { connectToDatabase, getDb, initializeCounters } = require('./database');
const { setRedisClient } = require('./utils/lyricsCache');

const submitSentence = require('./controllers/auth/submitSentence');
const getQuota = require('./controllers/auth/getQuota');
const getAudioURL = require('./controllers/auth/getAudioURL');
const generateAudio = require('./controllers/auth/generateAudio');
const getSentence = require('./controllers/auth/getSentence');
const submitExtendedText = require('./controllers/auth/submitExtendedText');
const getExtendedText = require('./controllers/auth/getExtendedText');
const streamExtendedTextProgress = require('./controllers/auth/streamExtendedTextProgress');
const saveExtendedText = require('./controllers/auth/saveExtendedText');
const unsaveExtendedText = require('./controllers/auth/unsaveExtendedText');
const checkSavedExtendedText = require('./controllers/auth/checkSavedExtendedText');

const login = require('./controllers/auth/login');
const loginEmail = require('./controllers/auth/loginEmail');
const register = require('./controllers/auth/register');
const verifyEmail = require('./controllers/auth/verifyEmail');
const resendVerification = require('./controllers/auth/resendVerification');
const getSession = require('./controllers/auth/getSession');
const logout = require('./controllers/auth/logout');

const saveSentence = require('./controllers/auth/saveSentence');
const unsaveSentence = require('./controllers/auth/unsaveSentence');
const checkSavedSentence = require('./controllers/auth/checkSavedSentence');
const getSavedItems = require('./controllers/auth/getSavedItems');
const getUserHistory = require('./controllers/auth/getUserHistory');

const addWord = require('./controllers/auth/addWord');
const removeWord = require('./controllers/auth/removeWord');
const getUserWords = require('./controllers/auth/getUserWords');

const checkSavedWords = require('./controllers/auth/checkSavedWords');

const createCheckoutSession = require('./controllers/createCheckoutSession');
const handleWebhook = require('./controllers/handleWebhook');

const getSiteStats = require('./controllers/auth/getSiteStats');

const getWordRelations = require('./controllers/auth/getWordRelations');

const getFeedback = require('./controllers/auth/getFeedback');
const addFeedback = require('./controllers/auth/addFeedback');
const deleteFeedback = require('./controllers/auth/deleteFeedback');

const getFeatureUsage = require('./controllers/auth/getFeatureUsage');
const getDecks = require('./controllers/auth/getDecks');
const getDeckCards = require('./controllers/auth/getDeckCards');
const getDeckSettings = require('./controllers/auth/getDeckSettings');
const updateDeckSettings = require('./controllers/auth/updateDeckSettings');
const initiateStudySession = require('./controllers/auth/initiateStudySession');
const updateCardProgress = require('./controllers/auth/updateCardProgress');
const getStudyStats = require('./controllers/auth/getStudyStats');
const exportDeck = require('./controllers/auth/exportDeck');
const editDeckCard = require('./controllers/auth/editDeckCard');
const addDeckCard = require('./controllers/auth/addDeckCard');

const getRateLimits = require('./controllers/auth/getRateLimits');
const { searchWordAudio, regenerateWordAudio } = require('./controllers/admin/wordAudioAdmin');

const getEmailList = require('./controllers/admin/getEmailList');
const getAdmins = require('./controllers/admin/getAdmins');
const { getUsersAdmin } = require('./controllers/admin/getUsersAdmin');
const { updateUser } = require('./controllers/admin/updateUser');

// Import admin lyrics controllers
const { getAllLyrics, addLyrics, updateLyrics, deleteLyrics, togglePublished } = require('./controllers/lyrics/adminLyrics');
const { generateLyricAnalysis } = require('./controllers/lyrics/generateLyricAnalysis');

const PORT = 5666;

app.use(cors({
  origin: process.env.LOCAL === 'true' ? 'http://localhost:3000' : 'https://hanbokstudy.com',
  credentials: true
}));

app.post('/api/webhook', express.raw({type: 'application/json'}), handleWebhook);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.setTimeout(300000, () => {
    console.log('Request has timed out.');
    res.status(408).send('Request has timed out.');
  });
  next();
});
app.use(
  session({
    store: redisStore,
    secret: 'domoarigato',
    resave: false,
    name: 'hanbok-session',
    saveUninitialized: false,
    cookie: {
      secure: process.env.SECURE_SESSION === 'true',
      domain: process.env.LOCAL === 'true' ? 'localhost' : 'hanbokstudy.com',
      path: '/',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    },
  })
);
app.set('trust proxy', 1);

// Auth middleware
const isAuthenticated = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ 
            success: false,
            message: 'Authentication required'
        });
    }
    next();
};

app.get('/api/session', async (req, res) => {
    await getSession(req, res);
});

app.post('/api/login', (req, res) => {
    login(req, res, redisClient);
});

app.post('/api/login-email', (req, res) => {
    loginEmail(req, res, redisClient);
});

app.post('/api/register', (req, res) => {
    register(req, res, redisClient);
});

app.get('/api/verify/:code', (req, res) => {
    verifyEmail(req, res, redisClient);
});

app.post('/api/resend-verification', (req, res) => {
    resendVerification(req, res, redisClient);
});

app.post('/api/logout', (req, res) => {
    logout(req, res);
});

// Password reset routes
app.post('/api/request-password-reset', (req, res) => {
    const requestPasswordReset = require('./controllers/auth/requestPasswordReset');
    requestPasswordReset(req, res, redisClient);
});

app.post('/api/reset-password', (req, res) => {
    const resetPassword = require('./controllers/auth/resetPassword');
    resetPassword(req, res, redisClient);
});


app.post('/api/submit', async (req, res) => {
    submitSentence(req, res);
});

app.get('/api/quota', async (req, res) => {
    getQuota(req, res);
});

app.get('/api/audio-url/:sentenceId', async (req, res) => {
    getAudioURL(req, res);
});

app.post('/api/sentences/:sentenceId/generate-audio', async (req, res) => {
    generateAudio(req, res);
});

app.get('/api/word-audio', async (req, res) => {
    const getWordAudioController = require('./controllers/words/getWordAudio');
    getWordAudioController(req, res);
});

app.get('/api/sentences/:sentenceId', async (req, res) => {
    getSentence(req, res);
});

// Extended text routes
app.post('/api/extended-text/submit', isAuthenticated, async (req, res) => {
    submitExtendedText(req, res);
});

app.get('/api/extended-text/:textId', isAuthenticated, async (req, res) => {
    getExtendedText(req, res);
});

app.get('/api/extended-text/progress/:jobId', isAuthenticated, async (req, res) => {
    streamExtendedTextProgress(req, res);
});

app.post('/api/extended-text/:textId/save', isAuthenticated, async (req, res) => {
    saveExtendedText(req, res);
});

app.delete('/api/extended-text/:textId/save', isAuthenticated, async (req, res) => {
    unsaveExtendedText(req, res);
});

app.get('/api/extended-text/:textId/saved', isAuthenticated, async (req, res) => {
    checkSavedExtendedText(req, res);
});

app.get('/api/user/sentences', isAuthenticated, async (req, res) => {
    const getUserSentences = require('./controllers/auth/getUserSentences');
    getUserSentences(req, res);
});

app.get('/api/user/history', isAuthenticated, async (req, res) => {
    getUserHistory(req, res);
});

app.post('/api/sentences/:sentenceId/save', isAuthenticated, async (req, res) => {
    saveSentence(req, res);
});

app.delete('/api/sentences/:sentenceId/save', isAuthenticated, async (req, res) => {
    unsaveSentence(req, res);
});

app.get('/api/sentences/:sentenceId/saved', isAuthenticated, async (req, res) => {
    checkSavedSentence(req, res);
});

app.get('/api/saved-sentences', isAuthenticated, async (req, res) => {
    getSavedItems(req, res);
});

app.get('/api/saved-items', isAuthenticated, async (req, res) => {
    getSavedItems(req, res);
});

// Word routes
app.post('/api/words', isAuthenticated, async (req, res) => {
    addWord(req, res);
});

app.delete('/api/words/', isAuthenticated, async (req, res) => {
    removeWord(req, res);
});

app.get('/api/words', isAuthenticated, async (req, res) => {
    getUserWords(req, res);
});

app.post('/api/words/check', isAuthenticated, async (req, res) => {
    checkSavedWords(req, res);
});

// Flashcard routes
app.get('/api/decks', isAuthenticated, async (req, res) => {
    getDecks(req, res);
});

app.get('/api/decks/:deckId/cards', isAuthenticated, async (req, res) => {
    getDeckCards(req, res);
});

app.get('/api/decks/:deckId/study', isAuthenticated, async (req, res) => {
    initiateStudySession(req, res);
});

app.post('/api/decks/:deckId/study', isAuthenticated, async (req, res) => {
    updateCardProgress(req, res);
});

app.get('/api/decks/:deckId/settings', isAuthenticated, async (req, res) => {
    getDeckSettings(req, res);
});

app.put('/api/decks/:deckId/settings', isAuthenticated, async (req, res) => {
    updateDeckSettings(req, res);
});

// New route for exporting deck data in Anki format
app.get('/api/decks/:deckId/export', isAuthenticated, async (req, res) => {
    exportDeck(req, res);
});

// New route for editing/deleting deck cards
app.put('/api/decks/:deckId/cards/:cardId', isAuthenticated, async (req, res) => {
    editDeckCard(req, res);
});

// New route for adding cards to a deck
app.post('/api/decks/:deckId/cards', isAuthenticated, async (req, res) => {
    addDeckCard(req, res);
});

// New route for study statistics
app.get('/api/study/stats', isAuthenticated, async (req, res) => {
    getStudyStats(req, res);
});

// Stripe endpoints
app.post('/api/create-checkout-session', isAuthenticated, createCheckoutSession);

// Add this with other route definitions
app.get('/api/stats', async (req, res) => {
    getSiteStats(req, res);
});

app.get('/api/word-relations', isAuthenticated, async (req, res) => {
    getWordRelations(req, res);
});

// Feedback forum routes
app.get('/api/feedback', async (req, res) => {
    getFeedback(req, res);
});

app.post('/api/feedback', isAuthenticated, async (req, res) => {
    addFeedback(req, res, redisClient);
});

app.delete('/api/feedback/:feedbackId', isAuthenticated, async (req, res) => {
    deleteFeedback(req, res);
});

// Admin routes
app.get('/api/admin/feature-usage', isAuthenticated, async (req, res) => {
    getFeatureUsage(req, res);
});

app.get('/api/admin/rate-limits', isAuthenticated, async (req, res) => {
    getRateLimits(req, res);
});

app.get('/api/admin/email-list', isAuthenticated, async (req, res) => {
    getEmailList(req, res);
});

app.get('/api/admin/admins', isAuthenticated, async (req, res) => {
    getAdmins(req, res);
});

app.get('/api/admin/users', isAuthenticated, async (req, res) => {
    getUsersAdmin(req, res);
});

app.put('/api/admin/users/:userId', isAuthenticated, async (req, res) => {
    updateUser(req, res);
});

app.get('/api/admin/word-audio', isAuthenticated, async (req, res) => {
    searchWordAudio(req, res);
});

app.post('/api/admin/word-audio/regenerate', isAuthenticated, async (req, res) => {
    regenerateWordAudio(req, res);
});

// Admin lyrics routes
app.get('/api/lyrics/admin', isAuthenticated, getAllLyrics);
app.post('/api/lyrics/admin', isAuthenticated, addLyrics);
app.put('/api/lyrics/admin/:lyricId', isAuthenticated, updateLyrics);
app.delete('/api/lyrics/admin/:lyricId', isAuthenticated, deleteLyrics);
app.put('/api/lyrics/admin/:lyricId/published', isAuthenticated, togglePublished);

// Add the route for generating lyric analysis (SSE endpoint)
app.get('/api/lyrics/admin/generate-analysis/:lyricId', isAuthenticated, async (req, res) => {
    generateLyricAnalysis(req, res);
});

// Public lyrics routes
app.get('/api/lyrics', async (req, res) => {
    const { getPublishedLyrics } = require('./controllers/lyrics/publicLyrics');
    getPublishedLyrics(req, res);
});

app.get('/api/lyrics/filters', async (req, res) => {
    const { getFilterOptions } = require('./controllers/lyrics/publicLyrics');
    getFilterOptions(req, res);
});

app.get('/api/lyrics/recent', async (req, res) => {
    const { getRecentLyrics } = require('./controllers/lyrics/publicLyrics');
    getRecentLyrics(req, res);
});

// SEO routes
app.get('/api/sitemap/lyrics', async (req, res) => {
    const { generateLyricsSitemap } = require('./controllers/seo/sitemap');
    generateLyricsSitemap(req, res);
});

app.get('/robots.txt', async (req, res) => {
    const { generateRobotsTxt } = require('./controllers/seo/sitemap');
    generateRobotsTxt(req, res);
});

// Lyric suggestions routes
app.get('/api/lyrics/suggestions', async (req, res) => {
    const { getSuggestions } = require('./controllers/lyrics/lyricSuggestions');
    getSuggestions(req, res);
});

app.post('/api/lyrics/suggestions', isAuthenticated, async (req, res) => {
    const { addSuggestion } = require('./controllers/lyrics/lyricSuggestions');
    addSuggestion(req, res);
});

app.post('/api/lyrics/suggestions/:suggestionId/upvote', isAuthenticated, async (req, res) => {
    const { upvoteSuggestion } = require('./controllers/lyrics/lyricSuggestions');
    upvoteSuggestion(req, res);
});

app.put('/api/admin/lyrics/suggestions/:suggestionId/status', isAuthenticated, async (req, res) => {
    const { updateSuggestionStatus } = require('./controllers/lyrics/lyricSuggestions');
    updateSuggestionStatus(req, res);
});

app.delete('/api/admin/lyrics/suggestions/:suggestionId', isAuthenticated, async (req, res) => {
    const { deleteSuggestion } = require('./controllers/lyrics/lyricSuggestions');
    deleteSuggestion(req, res);
});

// Favorite lyrics routes
app.get('/api/lyrics/favorites', isAuthenticated, async (req, res) => {
    const { getFavorites } = require('./controllers/lyrics/favoriteLyrics');
    getFavorites(req, res);
});

app.post('/api/lyrics/favorites/:lyricId', isAuthenticated, async (req, res) => {
    const { addFavorite } = require('./controllers/lyrics/favoriteLyrics');
    addFavorite(req, res);
});

app.delete('/api/lyrics/favorites/:lyricId', isAuthenticated, async (req, res) => {
    const { removeFavorite } = require('./controllers/lyrics/favoriteLyrics');
    removeFavorite(req, res);
});

app.get('/api/lyrics/:lyricId/favorited', async (req, res) => {
    const { checkFavorite } = require('./controllers/lyrics/favoriteLyrics');
    checkFavorite(req, res);
});

// Single lyric and analysis routes (must come after specific routes)
app.get('/api/lyrics/:lyricId', async (req, res) => {
    const { getPublishedLyric } = require('./controllers/lyrics/publicLyrics');
    getPublishedLyric(req, res);
});

app.get('/api/lyrics/:lyricId/analysis', async (req, res) => {
    const { getAnalysis } = require('./controllers/lyrics/lyricsAnalysis');
    getAnalysis(req, res);
});

app.get('/api/lyrics/:lyricId/fullAnalysis', async (req, res) => {
    const { getFullAnalysis } = require('./controllers/lyrics/lyricsAnalysis');
    getFullAnalysis(req, res);
});

// Add API route for deleting an analysis
app.delete('/api/lyrics/:lyricId/analysis', isAuthenticated, async (req, res) => {
    const { deleteAnalysis } = require('./controllers/lyrics/lyricsAnalysis');
    deleteAnalysis(req, res);
});

// Lyric comment routes
app.get('/api/lyrics/:lyricId/comments', async (req, res) => {
    const { getComments } = require('./controllers/lyrics/lyricComments');
    getComments(req, res);
});

app.get('/api/lyrics/:lyricId/comments/count', async (req, res) => {
    const { getCommentCount } = require('./controllers/lyrics/lyricComments');
    getCommentCount(req, res);
});

app.post('/api/lyrics/:lyricId/comments', isAuthenticated, async (req, res) => {
    const { addComment } = require('./controllers/lyrics/lyricComments');
    addComment(req, res);
});

app.post('/api/lyrics/comments/:commentId/vote', isAuthenticated, async (req, res) => {
    const { voteComment } = require('./controllers/lyrics/lyricComments');
    voteComment(req, res);
});

app.delete('/api/lyrics/comments/:commentId', isAuthenticated, async (req, res) => {
    const { deleteComment } = require('./controllers/lyrics/lyricComments');
    deleteComment(req, res);
});

// Conversation routes
app.post('/api/conversations', isAuthenticated, async (req, res) => {
    const { createConversation } = require('./controllers/conversations/conversations');
    createConversation(req, res);
});

app.get('/api/conversations', isAuthenticated, async (req, res) => {
    const { getConversations } = require('./controllers/conversations/conversations');
    getConversations(req, res);
});

// Get conversation rate limits (must be before parameterized routes)
app.get('/api/conversations/limits', async (req, res) => {
    const { getConversationLimits } = require('./controllers/conversations/conversations');
    getConversationLimits(req, res);
});

app.get('/api/conversations/:conversationId', isAuthenticated, async (req, res) => {
    const { getConversation } = require('./controllers/conversations/conversations');
    getConversation(req, res);
});

// New endpoint to get conversation count for a sentence
app.get('/api/sentences/:sentenceId/conversations/count', isAuthenticated, async (req, res) => {
    const { getConversationCount } = require('./controllers/conversations/conversations');
    getConversationCount(req, res);
});

app.post('/api/conversations/:conversationId/messages', isAuthenticated, async (req, res) => {
    const { addMessage } = require('./controllers/conversations/conversations');
    addMessage(req, res);
});

app.post('/api/conversations/:conversationId/messages/stream', isAuthenticated, async (req, res) => {
    const { addMessageStream } = require('./controllers/conversations/conversations');
    addMessageStream(req, res);
});

app.put('/api/conversations/:conversationId/title', isAuthenticated, async (req, res) => {
    const { updateConversationTitle } = require('./controllers/conversations/conversations');
    updateConversationTitle(req, res);
});

app.delete('/api/conversations/:conversationId', isAuthenticated, async (req, res) => {
    const { deleteConversation } = require('./controllers/conversations/conversations');
    deleteConversation(req, res);
});

// Debug endpoint to initialize counters manually (remove in production)
app.post('/api/debug/init-counters', async (req, res) => {
    try {
        await initializeCounters();
        res.json({ success: true, message: 'Counters initialized successfully' });
    } catch (error) {
        console.error('Error initializing counters:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Debug endpoint to migrate conversation index (remove in production)
app.post('/api/debug/migrate-conversation-index', async (req, res) => {
    try {
        const { migrateConversationIndex } = require('./utils/migrateConversationIndex');
        const result = await migrateConversationIndex();
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('Error migrating conversation index:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Debug endpoint to fix counters (remove in production)
app.post('/api/debug/fix-counters', async (req, res) => {
    try {
        const { fixCounters } = require('./utils/fixCounters');
        const result = await fixCounters();
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('Error fixing counters:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Debug endpoint to check database state (remove in production)
app.get('/api/debug/database-state', async (req, res) => {
    try {
        const db = getDb();
        
        // Get counters
        const counters = await db.collection('counters').find({}).toArray();
        
        // Get conversations
        const conversations = await db.collection('conversations').find({}).toArray();
        
        // Get messages
        const messages = await db.collection('conversation_messages').find({}).toArray();
        
        res.json({
            success: true,
            data: {
                counters,
                conversations,
                messages,
                stats: {
                    totalConversations: conversations.length,
                    activeConversations: conversations.filter(c => !c.isDeleted).length,
                    deletedConversations: conversations.filter(c => c.isDeleted).length,
                    totalMessages: messages.length
                }
            }
        });
    } catch (error) {
        console.error('Error checking database state:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Debug endpoint to check conversations only (remove in production)
app.get('/api/debug/conversations', async (req, res) => {
    try {
        const db = getDb();
        const conversations = await db.collection('conversations').find({}).toArray();
        res.json({ success: true, conversations });
    } catch (error) {
        console.error('Error checking conversations:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Debug endpoint to check messages only (remove in production)
app.get('/api/debug/messages', async (req, res) => {
    try {
        const db = getDb();
        const messages = await db.collection('conversation_messages').find({}).toArray();
        res.json({ success: true, messages });
    } catch (error) {
        console.error('Error checking messages:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Debug endpoint to force fix counters (remove in production)
app.post('/api/debug/force-fix-counters', async (req, res) => {
    try {
        const { forceFixCounters } = require('./utils/forceFixCounters');
        const result = await forceFixCounters();
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('Error force fixing counters:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Debug endpoint to cleanup conflicting data (remove in production)
app.post('/api/debug/cleanup-conflicts', async (req, res) => {
    try {
        const { cleanupConflictingData } = require('./utils/cleanupConflictingData');
        const result = await cleanupConflictingData();
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('Error cleaning up conflicts:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Debug endpoint to delete specific conversation (remove in production)
app.post('/api/debug/delete-conversation/:id', async (req, res) => {
    try {
        const { deleteSpecificConversation } = require('./utils/deleteSpecificConversation');
        const conversationId = parseInt(req.params.id);
        const result = await deleteSpecificConversation(conversationId);
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('Error deleting specific conversation:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Connect to Redis before starting the server
async function startServer() {
  try {
    await redisClient.connect();
    // Initialize lyricsCache with the Redis client
    setRedisClient(redisClient);
    
    await connectToDatabase();
    
    // Log any active jobs
    const activeJobs = await analysisQueue.getActive();
    console.log(`Found ${activeJobs.length} active analysis jobs on startup`);
    
    // Initialize job event listeners
    analysisQueue.on('completed', (job) => {
      console.log(`Job ${job.id} completed for lyric analysis`);
    });
    
    analysisQueue.on('failed', (job, error) => {
      console.error(`Job ${job.id} failed with error:`, error);
    });
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    
    // Set up graceful shutdown
    setupGracefulShutdown();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Cleanup function for graceful shutdown
function setupGracefulShutdown() {
  const shutdown = async () => {
    console.log('Server is shutting down...');
    
    try {
      // Close Bull queue
      console.log('Closing Bull queue...');
      await analysisQueue.close();
      
      // Clean up Redis connections in generateLyricAnalysis
      console.log('Cleaning up Redis connections...');
      await cleanupRedisConnections();
      
      // Close main Redis client
      console.log('Closing main Redis client...');
      await redisClient.quit();
      
      console.log('Cleanup complete, exiting process');
      process.exit(0);
    } catch (err) {
      console.error('Error during cleanup:', err);
      process.exit(1);
    }
  };
  
  // Handle termination signals
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch(console.error);

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

const session = require('express-session');
const {createClient} = require('redis');
const {RedisStore} = require('connect-redis');

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

const { connectToDatabase } = require('./database');

const submitSentence = require('./controllers/auth/submitSentence');
const getAudioURL = require('./controllers/auth/getAudioURL');
const generateAudio = require('./controllers/auth/generateAudio');
const getSentence = require('./controllers/auth/getSentence');

const login = require('./controllers/auth/login');
const getSession = require('./controllers/auth/getSession');
const logout = require('./controllers/auth/logout');

const saveSentence = require('./controllers/auth/saveSentence');
const unsaveSentence = require('./controllers/auth/unsaveSentence');
const checkSavedSentence = require('./controllers/auth/checkSavedSentence');
const getSavedSentences = require('./controllers/auth/getSavedSentences');

const addWord = require('./controllers/auth/addWord');
const removeWord = require('./controllers/auth/removeWord');
const getUserWords = require('./controllers/auth/getUserWords');

const checkSavedWords = require('./controllers/auth/checkSavedWords');

const createCheckoutSession = require('./controllers/createCheckoutSession');
const handleWebhook = require('./controllers/handleWebhook');

const getSiteStats = require('./controllers/auth/getSiteStats');

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

app.post('/api/logout', (req, res) => {
    logout(req, res);
});


app.post('/api/submit', async (req, res) => {
    submitSentence(req, res);
});

app.get('/api/audio-url/:sentenceId', isAuthenticated, async (req, res) => {
    getAudioURL(req, res);
});

app.post('/api/sentences/:sentenceId/generate-audio', isAuthenticated, async (req, res) => {
    generateAudio(req, res);
});

app.get('/api/sentences/:sentenceId', isAuthenticated, async (req, res) => {
    getSentence(req, res);
});

app.get('/api/user/sentences', isAuthenticated, async (req, res) => {
    const getUserSentences = require('./controllers/auth/getUserSentences');
    getUserSentences(req, res);
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
    getSavedSentences(req, res);
});

// Word routes
app.post('/api/words', isAuthenticated, async (req, res) => {
    addWord(req, res);
});

app.delete('/api/words/:wordId', isAuthenticated, async (req, res) => {
    removeWord(req, res);
});

app.get('/api/words', isAuthenticated, async (req, res) => {
    getUserWords(req, res);
});

app.post('/api/words/check', isAuthenticated, async (req, res) => {
    checkSavedWords(req, res);
});

// Stripe endpoints
app.post('/api/create-checkout-session', isAuthenticated, createCheckoutSession);

// Add this with other route definitions
app.get('/api/stats', async (req, res) => {
    getSiteStats(req, res);
});

// Connect to Redis before starting the server
async function startServer() {
  try {
    await redisClient.connect();
    await connectToDatabase();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer().catch(console.error);
const express = require('express');
const cors = require('cors');
const app = express();

const session = require('express-session');
const {createClient} = require('redis');
const {RedisStore} = require('connect-redis');
const redisClient = createClient();
if (process.env.REDIS_PW) {
  redisClient.auth({ password: process.env.REDIS_PW })
    .catch(console.error);
}
redisClient.connect().catch(console.error);
const redisStore = new RedisStore({ 
    client: redisClient,
    prefix: "hanbok:"
});

const { connectToDatabase } = require('./database');

const submitSentence = require('./controllers/auth/submitSentence');
const getAudioURL = require('./controllers/auth/getAudioURL');

const login = require('./controllers/auth/login');
const getSession = require('./controllers/auth/getSession');
const logout = require('./controllers/auth/logout');

const PORT = 5666;

app.use(cors({
  origin: process.env.LOCAL ? 'http://localhost:3001' : '',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use('/webhook', express.raw({ type: 'application/json' }));
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
      domain: process.env.LOCAL ? 'localhost' : '',
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

async function startServer() {
  await connectToDatabase();
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(console.error);
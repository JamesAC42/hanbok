const { getDb } = require('../../database');
const { ObjectId } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const { analysisQueue } = require('../../jobs/queue');
const { createClient } = require('redis');

const ADMIN_EMAILS = require('../../lib/adminEmails');

// Redis connection options
const redisOptions = {
  password: process.env.REDIS_PW || undefined,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) return false;
      return Math.min(retries * 100, 3000);
    }
  }
};

// Create a Redis client to be reused
let progressRedisClient = null;

// Initialize Redis client
async function getProgressRedisClient() {
  if (!progressRedisClient) {
    progressRedisClient = createClient(redisOptions);
    progressRedisClient.on('error', (err) => console.error('Progress Redis client error:', err));
    await progressRedisClient.connect();
  }
  return progressRedisClient;
}

// Controller that sets up SSE and delegates the actual processing to a background job
const generateLyricAnalysis = async (req, res) => {
    console.log('=== Starting generateLyricAnalysis ===');
    console.log('Request method:', req.method);
    console.log('Request params:', req.params);
    console.log('Request session:', req.session?.user?.userId);

    let eventStreamStarted = false;
    let keepAliveInterval;
    let progressCheckInterval;
    req.setTimeout(600000);

    // Generate a unique client ID for this SSE connection
    const clientId = uuidv4();

    // SSE setup with proper headers
    const setupSSE = () => {
        if (!res.headersSent) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Content-Encoding', 'none');
            res.setHeader('X-Accel-Buffering', 'no');
            res.flushHeaders();
            eventStreamStarted = true;
            
            // Set up keep-alive to prevent connection timeout
            keepAliveInterval = setInterval(() => {
                res.write(':keepalive\n\n');
            }, 15000); // Send keep-alive every 15 seconds
        }
    };

    // Format and send SSE event according to the standard
    const sendEvent = (event, data) => {
        setupSSE();
        
        const formattedData = JSON.stringify(data);
        if (event === 'message') {
            res.write(`data: ${formattedData}\n\n`);
        } else {
            res.write(`event: ${event}\ndata: ${formattedData}\n\n`);
        }
    };

    const handleError = (message, statusCode = 500) => {
        console.error("Error in generateLyricAnalysis:", message);
        
        if (!eventStreamStarted) {
            return res.status(statusCode).json({
                success: false,
                message: message
            });
        }

        sendEvent('error', { message });
        
        // Clear all intervals
        clearIntervals();
        
        res.end();
    };

    const clearIntervals = () => {
        // Clear the keep-alive interval
        if (keepAliveInterval) {
            clearInterval(keepAliveInterval);
        }
        
        // Clear the progress check interval
        if (progressCheckInterval) {
            clearInterval(progressCheckInterval);
        }
    };

    // Handle client disconnect
    req.on('close', () => {
        clearIntervals();
    });

    try {
        // Check if user is authenticated
        if (!req.session || !req.session.user || !req.session.user.userId) {
            return handleError('Unauthorized', 401);
        }
        
        // Get the user from the database
        const db = getDb();
        const user = await db.collection('users').findOne({ 
            userId: req.session.user.userId 
        });
        if (!user || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
            return handleError('Unauthorized: Admin access required', 403);
        }
        
        const { lyricId } = req.params;
        
        // Validate the lyricId
        if (!ObjectId.isValid(lyricId)) {
            return handleError('Invalid lyric ID format', 400);
        }

        // Get the lyric
        const lyric = await db.collection('lyrics').findOne({ _id: new ObjectId(lyricId) });
        
        if (!lyric) {
            return handleError('Lyric not found', 404);
        }

        // Send initial connection confirmation event
        setupSSE();
        sendEvent('status', { message: 'Starting lyric analysis in background...' });

        // Add the job to the queue
        const job = await analysisQueue.add({
            lyricId: lyricId,
            userId: user.userId,
            clientId: clientId,
            lyricTitle: lyric.title
        });
        
        sendEvent('status', { message: `Job ${job.id} queued for processing...` });
        
        let lastTimestamp = null;
        // Set up progress checker to poll Redis for updates
        progressCheckInterval = setInterval(async () => {
            try {
                const progress = await getProgress(clientId);
                if (progress) {
                    if (progress.timestamp > lastTimestamp) {
                        lastTimestamp = progress.timestamp;
                        // Forward the progress event to the client
                        sendEvent(progress.type, progress);
                        
                        // If job is complete or failed, end the connection
                        if (progress.type === 'complete' || progress.type === 'error') {
                            clearIntervals();
                            res.end();
                        }
                    }
                }
            } catch (err) {
                console.error('Error checking progress:', err);
            }
        }, 500); // Check every second
        
    } catch (error) {
        console.error('Caught error in generateLyricAnalysis:', error);
        handleError(error.message || 'An unexpected error occurred while generating lyric analysis');
    }
};

// Helper function to get job progress from Redis
async function getProgress(clientId) {
    try {
        // Get the shared Redis client
        const client = await getProgressRedisClient();
        
        const key = `lyrics:analysis:progress:${clientId}`;
        const progressData = await client.get(key);
        
        if (progressData) {
            return JSON.parse(progressData);
        }
        return null;
    } catch (error) {
        console.error('Error getting progress from Redis:', error);
        return null;
    }
}

// Clean up Redis connections when the module is unloaded or server shuts down
async function cleanupRedisConnections() {
    if (progressRedisClient) {
        try {
            await progressRedisClient.quit();
        } catch (err) {
            console.error('Error closing Progress Redis client:', err);
        }
    }
}

// Export controller and cleanup function
module.exports = {
    generateLyricAnalysis,
    cleanupRedisConnections
}

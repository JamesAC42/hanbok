const Queue = require('bull');

// Redis connection options - reuse the same configuration as the main app
const redisOptions = {
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
};

// Create the analysis queue
const analysisQueue = new Queue('lyrics-analysis', {
  redis: redisOptions,
  prefix: 'bull:lyrics:',
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: false, // Keep completed jobs for history
    removeOnFail: false, // Keep failed jobs for debugging
  }
});

// Handle global queue events
analysisQueue.on('error', (error) => {
  console.error('Lyrics analysis queue error:', error);
});

analysisQueue.on('failed', (job, error) => {
  console.error(`Job ${job.id} failed:`, error);
});

module.exports = {
  analysisQueue
};
const Queue = require('bull');

const { bullRedis } = require('../lib/redisConfig');

// Create the analysis queue
const analysisQueue = new Queue('lyrics-analysis', {
  redis: bullRedis(),
  prefix: process.env.BULL_QUEUE_PREFIX || 'bull:lyrics:',
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: false, // Keep completed jobs for history
    removeOnFail: false, // Keep failed jobs for debugging
    retry: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      shouldRetry: (error) => {
        const errorMessage = error.message || '';
        return !errorMessage.toLowerCase().includes('duplicate') && !errorMessage.includes('E11000');
      }
    }
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
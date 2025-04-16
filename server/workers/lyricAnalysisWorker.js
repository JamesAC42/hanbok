require('dotenv').config();
const { analysisQueue } = require('../jobs/queue');
const { processLyricAnalysis, shutdown } = require('../jobs/lyricAnalysisProcessor');
const { connectToDatabase } = require('../database');

// Connect to database
connectToDatabase()
  .then(() => {
    console.log('Lyric analysis worker connected to database');
    
    // Process jobs
    analysisQueue.process(async (job) => {
      console.log(`Worker processing job ${job.id} for lyric ${job.data.lyricId}`);
      return await processLyricAnalysis(job);
    });
    
    console.log('Lyric analysis worker started and waiting for jobs');
  })
  .catch(err => {
    console.error('Error starting lyric analysis worker:', err);
    process.exit(1);
  });

// Handle worker process events
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown() {
  console.log('Lyric analysis worker shutting down...');
  
  try {
    // Close Redis connections used for progress updates
    await shutdown();
    
    // Close queue
    await analysisQueue.close();
    console.log('Lyric analysis worker closed queue connection');
    
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
}

// Log job progress
analysisQueue.on('progress', (job, progress) => {
  console.log(`Job ${job.id} is ${progress}% complete`);
});

// Log completed jobs
analysisQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed with result:`, result);
});

// Log failed jobs
analysisQueue.on('failed', (job, error) => {
  console.error(`Job ${job.id} failed with error:`, error);
});
// Runs lyric analysis jobs inside the API process. Prod only runs the API
// under pm2, so without this nothing consumed the queue and jobs sat at
// "queued" forever. Set LYRICS_WORKER=separate to leave the queue to
// workers/lyricAnalysisWorker.js instead.

// The admin card waits on its own job; anything older than this was queued
// while no consumer was running, and re-running it would only burn model and
// voice calls for a page nobody is watching.
const MAX_JOB_AGE_MS = 15 * 60 * 1000;

function isStaleJob(job, now = Date.now()) {
  return typeof job.timestamp === 'number' && now - job.timestamp > MAX_JOB_AGE_MS;
}

function startLyricAnalysisConsumer(queue, processLyricAnalysis) {
  if (process.env.LYRICS_WORKER === 'separate') {
    console.log('Lyric analysis jobs left to the separate worker');
    return false;
  }
  queue.process(async (job) => {
    if (isStaleJob(job)) {
      console.log(`Skipping stale lyric analysis job ${job.id} for lyric ${job.data.lyricId}`);
      return { skipped: true, reason: 'stale' };
    }
    console.log(`Processing lyric analysis job ${job.id} for lyric ${job.data.lyricId}`);
    return processLyricAnalysis(job);
  });
  console.log('Lyric analysis jobs processed in the API process');
  return true;
}

module.exports = { startLyricAnalysisConsumer, isStaleJob, MAX_JOB_AGE_MS };

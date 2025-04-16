module.exports = {
  apps: [
    {
      name: 'hanbok-server',
      script: 'index.js',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '1G',
      watch: false,
      instances: 1,
      exec_mode: 'fork',
    },
    {
      name: 'hanbok-lyrics-worker',
      script: 'workers/lyricAnalysisWorker.js',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '1G',
      watch: false,
      instances: 1,
      exec_mode: 'fork',
    }
  ]
};
// Node.js 24 + PM2. Runs alongside mcp-daftra on port 8766.
module.exports = {
  apps: [{
    name: 'az-mcp',
    cwd: '/mnt/mcp/mcphub',
    script: 'dist/index.js',
    interpreter: 'node',
    exec_mode: 'fork',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '700M',
    kill_timeout: 10000,
    min_uptime: '10s',
    max_restarts: 10,
    time: true,
    env: {
      NODE_ENV: 'production',
      PORT: '3000',
      USE_DB: 'false'
    }
  }]
};

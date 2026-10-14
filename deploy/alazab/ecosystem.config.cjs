// Alazab MCP Hub — native Node.js/PM2, no Docker.
// Set AZ_MCP_PORT in the process environment to a VERIFIED, unused port.
// Deliberately no default: 3000 and several other ports are already in use.
const port = Number(process.env.AZ_MCP_PORT);
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  throw new Error('Set AZ_MCP_PORT to a verified free TCP port before PM2 start/restart.');
}
module.exports = {
  apps: [{
    name: 'az-mcp',
    cwd: '/mnt/mcp/az-mcp',
    script: 'dist/index.js',
    interpreter: 'node',
    exec_mode: 'fork',
    instances: 1,
    watch: false,
    autorestart: true,
    max_memory_restart: '800M',
    kill_timeout: 12000,
    time: true,
    env: {
      NODE_ENV: 'production',
      PORT: String(port),
    },
  }],
};

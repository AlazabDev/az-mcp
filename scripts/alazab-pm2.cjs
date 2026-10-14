// Invoke only this app's PM2 process; never restart all PM2 workloads.
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const action = process.argv[2];
const allowed = new Set(['start', 'restart', 'reload', 'stop', 'delete', 'logs', 'status', 'describe']);
if (!allowed.has(action)) {
  console.error('Usage: node scripts/alazab-pm2.cjs <start|restart|reload|stop|delete|logs|status|describe>');
  process.exit(2);
}
const pm2Executable = process.env.AZ_PM2_BIN || 'pm2';
const config = path.join(__dirname, '..', 'deploy', 'alazab', 'ecosystem.config.cjs');
const args = action === 'start'
  ? ['start', config, '--only', 'az-mcp']
  : action === 'restart' || action === 'reload'
    ? [action, 'az-mcp', '--update-env']
    : [action, 'az-mcp'];
if (action === 'start') {
  const port = Number(process.env.AZ_MCP_PORT);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    console.error('AZ_MCP_PORT must be set to a verified unused port.');
    process.exit(2);
  }
  if (!fs.existsSync(path.join(__dirname, '..', 'dist', 'index.js'))) {
    console.error('Build first: pnpm build');
    process.exit(2);
  }
}
const result = spawnSync(pm2Executable, args, { stdio: 'inherit', env: process.env });
if (result.error) {
  console.error('PM2 CLI not available in PATH. Set AZ_PM2_BIN to your existing PM2 executable, or install the CLI for this user. Existing PM2 daemon alone is not a CLI.');
  process.exit(127);
}
process.exit(result.status ?? 1);

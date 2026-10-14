# Alazab MCP Hub — PM2 shortcuts

Use the checkout at `/mnt/mcp/az-mcp`. The PM2 process is named
`az-mcp` and none of these commands manages other services.

```bash
cd /mnt/mcp/az-mcp
pnpm build
# Inspect available ports first; never assume 3000 is available.
ss -ltnp
export AZ_MCP_PORT=YOUR_VERIFIED_FREE_PORT
pnpm pm2:start
pnpm pm2:status
pnpm pm2:logs
```

Other shortcuts: `pnpm pm2:restart`, `pnpm pm2:reload`,
`pnpm pm2:stop`, `pnpm pm2:delete`, `pnpm pm2:describe`.
Start requires an explicit port. Restart/reload use the existing PM2
process, whose port should be checked with `pm2 describe az-mcp`.

If the daemon exists but the `pm2` command is missing, discover its
real CLI location and set `AZ_PM2_BIN=/absolute/path/to/pm2`. Do not
install or start a second PM2 daemon as a workaround. Running PM2
as a different user points at a different daemon.

Do not change the existing Nginx upstream until the new service responds
on its verified local port. The dedicated Nginx vhost must not clobber
Daftra's 8766 endpoint or Supabase's 3110 endpoint.

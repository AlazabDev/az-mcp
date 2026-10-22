# Local MCP directory discovery

The hub can list immediate child directories under `/mnt/mcp`, including directories that have not been registered as MCP servers. This is a read-only inventory, not execution or automatic activation.

- Default root: `/mnt/mcp`
- Override root: `AZ_MCP_DISCOVERY_ROOT=/mnt/mcp`
- API: `GET /api/local-mcp/directories`
- Authentication: existing dashboard authentication **plus admin requirement**
- Each result: directory name, absolute path, recognized manifest names, number of top-level entries, basic project kind, and whether an environment file is present (not its contents).
- Excludes hidden directories, symlink directories, `az-mcp`, `.git` and `node_modules`.
- The list is scanned on each API request, so additions/removals become visible without a restart.

## Production

Add `AZ_MCP_DISCOVERY_ROOT=/mnt/mcp` to the az-mcp .env file if you want an explicit root. After building and restarting the PM2-hosted az-mcp app, authenticate as a dashboard administrator and request `https://mcp.alazab.com/api/local-mcp/directories`.

Folders are not necessarily runnable MCP servers. Linking them to the hub registry requires a separate validated integration step for each project's transport, command and credentials. This endpoint **does not** enumerate secret files or automatically launch arbitrary code.

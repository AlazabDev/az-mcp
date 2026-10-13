# Alazab MCPHub — production pull/run checklist (no Docker)

The repository extends the existing MCPHub backend and React frontend. The
24 service pages use MCPHub's real registered-server API. A directory name alone
is not an MCP connection. Manually attached service/page mappings are stored in
the current browser's localStorage; they are NOT a shared backend registry.

## Before startup

- Keep the existing **mcp-daftra** process and its port **8766** untouched.
- Use **Node.js 24**, **Corepack/pnpm**. Use a separate app port **3000**.
- Ensure the checkout at /mnt/mcp/mcphub contains this branch.
- Preserve existing data/config/secrets on the server; do not copy repo demo
  `mcp_settings.json` over your production settings.
- Leave OAuth configuration to the existing MCPHub Settings UI and configured
  origin. A published endpoint isn't proof a ChatGPT client can authenticate.

## Build and launch (only after checking port 3000 is free)

```bash
cd /mnt/mcp/mcphub || exit 1
node -v
corepack pnpm install --frozen-lockfile
corepack pnpm frontend:typecheck
corepack pnpm build
node scripts/verify-dist.js
ss -ltnp | grep ':3000 ' && echo 'Port 3000 already occupied: resolve before PM2' || true
pm2 start deploy/alazab/ecosystem.config.cjs
pm2 status
```

If the port is in use, choose a free port and update the PM2 config before
starting. No Nginx modification is done by these commands. Merge the example
proxy location into the existing Nginx HTTPS vhost carefully, preserving
`/daftra/mcp`.

## Acceptance
- Dashboard login and `/servers` API work.
- Each /integrations/:serviceId page loads registered server status and tools.
- Admin can add/edit and toggle a server and see correct updated state.
- OAuth discovery, consent, group endpoint tools/list and an actual read-only
  Daftra tool call succeed from the target client.
- These criteria have NOT yet been run against the production server.

## Multi-agent chat configuration

The authenticated dashboard includes `/chat` and `/chat/settings`.
The chat uses the server-side `POST /api/alazab-chat/respond` endpoint
to run up to six independent agents concurrently and return individual results.
It is not an autonomous agent-orchestration engine and does not yet execute
MCP tools inside model conversations.

Set provider credentials only on the server environment (not in the browser):

- `AZ_CHAT_OPENAI_API_KEY`: OpenAI API key
- `AZ_CHAT_AZURE_API_KEY`: Azure AI endpoint key
- `AZ_CHAT_AZURE_ENDPOINT`: complete HTTPS Azure chat-completions endpoint,
  including any required API version.

The OpenAI adapter uses `/v1/chat/completions` and requires a compatible
model. The Azure adapter expects an endpoint accepting OpenAI-style chat
completions; Azure Foundry Responses/Agents APIs require another adapter.

Provider credentials are not returned to the frontend. Agent preferences
are presently saved in the user's browser; chat history lives in component
memory and is lost on reload. Verify real model responses after deployment.

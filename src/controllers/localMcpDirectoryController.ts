import fs from 'node:fs/promises';
import path from 'node:path';
import type { Request, Response } from 'express';

/** Read-only inventory of direct child directories; never execute discovered code. */
const ROOT = process.env.AZ_MCP_DISCOVERY_ROOT || '/mnt/mcp';
const EXCLUDED = new Set(['az-mcp', '.git', 'node_modules', '.agents']);
const MANIFESTS = ['package.json', 'pyproject.toml', 'requirements.txt', 'server.json', 'mcp.json', 'docker-compose.yml', 'compose.yaml', 'README.md'];

export async function scanLocalMcpDirectories(root = ROOT) {
  const rootReal = await fs.realpath(root);
  const entries = await fs.readdir(rootReal, { withFileTypes: true });
  const results = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory() || entry.isSymbolicLink() || entry.name.startsWith('.') || EXCLUDED.has(entry.name)) continue;
    const directory = path.join(rootReal, entry.name);
    const files = await fs.readdir(directory, { withFileTypes: true }).catch(() => []);
    const manifests = files.filter(item => item.isFile() && MANIFESTS.includes(item.name)).map(item => item.name);
    // Expose only names and indicators. Never read .env, credentials or source content.
    results.push({
      name: entry.name,
      directory,
      manifests,
      entryCount: files.length,
      kind: manifests.includes('package.json') ? 'node' : manifests.includes('pyproject.toml') || manifests.includes('requirements.txt') ? 'python' : 'directory',
      hasEnvironmentFile: files.some(item => item.name === '.env'),
    });
  }
  return { root: rootReal, count: results.length, directories: results };
}

export async function getLocalMcpDirectories(_req: Request, res: Response): Promise<void> {
  try {
    res.json({ success: true, ...await scanLocalMcpDirectories() });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Directory scan failed' });
  }
}

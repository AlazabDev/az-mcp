import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, ExternalLink, KeyRound, PlugZap } from 'lucide-react';
import { getBasePath } from '@/utils/runtime';
import { useGroupData } from '@/hooks/useGroupData';
import { useServerContext } from '@/contexts/ServerContext';

const AIConnectionsPage: React.FC = () => {
  const { groups, loading: groupsLoading, error: groupsError } = useGroupData();
  const { allServers, isLoading: serversLoading, error: serversError } = useServerContext();
  const [target, setTarget] = useState('');
  const [copied, setCopied] = useState(false);
  const hubRoot = useMemo(() => {
    const path = getBasePath().replace(/\/$/, '');
    return `${window.location.origin}${path}`;
  }, []);

  const available = useMemo(() => [
    ...groups.map((group) => ({ value: group.name, label: `Group: ${group.name}` })),
    ...allServers.map((server) => ({ value: server.name, label: `Server: ${server.name} (${server.status})` })),
  ], [groups, allServers]);
  const endpoint = target ? `${hubRoot}/mcp/${encodeURIComponent(target)}` : '';
  const copy = async () => {
    if (!endpoint) return;
    try {
      await navigator.clipboard.writeText(endpoint);
      setCopied(true);
    } catch { setCopied(false); }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <header>
        <h1 className="hub-h1">ChatGPT & AI connections</h1>
        <p className="hub-sub">Select an existing MCPHub server or group to obtain its actual endpoint.</p>
      </header>
      <div className="hub-card hub-card-pad space-y-4">
        <div className="flex items-center gap-2 font-semibold"><PlugZap size={18} /> Remote MCP endpoint</div>
        <label htmlFor="ai-mcp-target" className="block text-sm">MCP target</label>
        <select id="ai-mcp-target" className="hub-input max-w-lg" value={target} onChange={(event) => { setTarget(event.target.value); setCopied(false); }}>
          <option value="">Choose a registered server or group...</option>
          {available.map((item, index) => <option key={`${item.value}-${index}`} value={item.value}>{item.label}</option>)}
        </select>
        {(groupsLoading || serversLoading) && <p className="hub-sub">Loading registered connections...</p>}
        {(groupsError || serversError) && <p role="alert" className="text-red-600 text-sm">{groupsError || serversError}</p>}
        {endpoint ? (
          <div className="flex items-center gap-2 flex-wrap">
            <code className="hub-tag break-all">{endpoint}</code>
            <button type="button" className="hub-btn" onClick={copy}>
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? 'Copied' : 'Copy MCP URL'}
            </button>
          </div>
        ) : <p className="hub-sub">Register a server or group to generate its endpoint URL.</p>}
        <div className="flex flex-wrap gap-2">
          <Link to="/servers" className="hub-btn primary">Manage servers</Link>
          <Link to="/groups" className="hub-btn">Manage groups</Link>
          <Link to="/settings" className="hub-btn"><KeyRound size={15} /> OAuth settings</Link>
        </div>
      </div>
      <div className="hub-card hub-card-pad space-y-3">
        <h2 className="font-semibold">Connect ChatGPT</h2>
        <ol className="list-decimal pl-6 space-y-2 text-sm" style={{ color: 'var(--hub-ink-2)' }}>
          <li>Confirm that the selected MCPHub group/server exposes the expected tools.</li>
          <li>Configure MCPHub OAuth and HTTPS for the public origin. This page does not turn on OAuth for you.</li>
          <li>In ChatGPT, create a custom MCP connection with the endpoint above.</li>
          <li>Authorize it and verify tools/list and one real read-only tools/call.</li>
        </ol>
        <a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer" className="hub-btn inline-flex">
          Open ChatGPT <ExternalLink size={14} />
        </a>
      </div>
      <p className="hub-sub">The URL reflects a registered configuration, not a verified external connection. Client OAuth and protocol support must still be tested.</p>
    </div>
  );
};

export default AIConnectionsPage;

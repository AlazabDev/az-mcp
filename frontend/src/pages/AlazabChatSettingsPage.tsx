import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, Settings2 } from 'lucide-react';
import { apiGet } from '@/utils/fetchInterceptor';
import { ChatAgent, ChatPreferences, readChatSettings, writeChatSettings } from '@/chat/chatConfig';

type Providers = { openai: boolean; azure: boolean };
const AlazabChatSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<ChatPreferences>(readChatSettings);
  const [providers, setProviders] = useState<Providers | null>(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    void apiGet<{ success: boolean; data?: Providers }>('/alazab-chat/providers')
      .then((result) => { if (result.success && result.data) setProviders(result.data); });
  }, []);
  const update = (id: string, changes: Partial<ChatAgent>) => {
    setSettings((current) => ({
      ...current, agents: current.agents.map((a) => a.id === id ? { ...a, ...changes } : a),
    }));
    setSaved(false);
  };
  const add = () => {
    if (settings.agents.length >= 6) return;
    setSettings((current) => ({
      ...current,
      agents: [...current.agents, {
        id: `agent-${crypto.randomUUID()}`, name: 'New agent', provider: 'openai',
        model: 'gpt-5.1', instruction: 'You are a helpful assistant.', enabled: true,
      }],
    }));
    setSaved(false);
  };
  const save = () => {
    writeChatSettings(settings);
    setSaved(true);
  };
  return <div className="mx-auto max-w-5xl space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="hub-h1">Chat settings</h1><p className="hub-sub">Configure which AI agents answer, their roles, models and layout.</p></div>
      <Link className="hub-btn" to="/chat"><ArrowLeft size={15} /> Chat workspace</Link>
    </header>
    <section className="hub-card hub-card-pad space-y-3">
      <div className="flex items-center gap-2 font-semibold"><Settings2 size={17}/> Providers on this server</div>
      <p className="hub-sub">API keys remain server-side. Set AZ_CHAT_OPENAI_API_KEY or AZ_CHAT_AZURE_API_KEY and AZ_CHAT_AZURE_ENDPOINT in the runtime environment.</p>
      <div className="flex gap-3 text-sm flex-wrap">
        <span className="hub-tag">OpenAI: {providers?.openai ? 'Configured' : 'Not configured'}</span>
        <span className="hub-tag">Azure Foundry: {providers?.azure ? 'Configured' : 'Not configured'}</span>
      </div>
    </section>
    <section className="hub-card hub-card-pad space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Agents ({settings.agents.length}/6)</h2>
        <button className="hub-btn" type="button" onClick={add} disabled={settings.agents.length >= 6}><Plus size={15}/> Add agent</button>
      </div>
      {settings.agents.map((agent, i) => <div key={agent.id} className="rounded-lg border p-4 space-y-3" style={{borderColor:'var(--hub-line)'}}>
        <div className="flex items-center justify-between gap-3">
          <strong>Agent {i + 1}</strong>
          <div className="flex gap-3 items-center">
            <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={agent.enabled} onChange={e=>update(agent.id,{enabled:e.target.checked})}/> Enabled</label>
            <button type="button" aria-label={`Remove ${agent.name}`} className="hub-icon-btn" onClick={()=>{setSettings(v=>({...v,agents:v.agents.filter(a=>a.id!==agent.id)}));setSaved(false);}}><Trash2 size={15}/></button>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm space-y-1">Name<input className="hub-input" maxLength={80} value={agent.name} onChange={e=>update(agent.id,{name:e.target.value})}/></label>
          <label className="text-sm space-y-1">Provider<select className="hub-input" value={agent.provider} onChange={e=>update(agent.id,{provider:e.target.value as ChatAgent['provider']})}><option value="openai">OpenAI</option><option value="azure">Azure Foundry</option></select></label>
          <label className="text-sm space-y-1">Model / deployment<input className="hub-input" maxLength={100} value={agent.model} onChange={e=>update(agent.id,{model:e.target.value})}/></label>
        </div>
        <label className="block text-sm space-y-1">System instructions<textarea rows={3} maxLength={3000} className="hub-input h-auto py-2" value={agent.instruction} onChange={e=>update(agent.id,{instruction:e.target.value})}/></label>
      </div>)}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Result layout<select className="hub-input mt-1" value={settings.layout} onChange={e=>{setSettings(s=>({...s,layout:e.target.value as ChatPreferences['layout']}));setSaved(false);}}><option value="columns">Side-by-side</option><option value="stack">Stacked</option></select></label>
        <label className="flex items-center gap-2 text-sm pt-5"><input type="checkbox" checked={settings.includeHistory} onChange={e=>{setSettings(s=>({...s,includeHistory:e.target.checked}));setSaved(false);}}/> Include conversation history in prompts</label>
      </div>
      <div className="flex items-center gap-3"><button type="button" className="hub-btn primary" onClick={save}><Save size={15}/> Save settings</button>{saved && <span className="text-sm text-green-700" role="status">Saved in this browser</span>}</div>
      <p className="hub-sub">Agent preferences are stored locally in this browser, not shared between team members. The server handles provider credentials.</p>
    </section>
  </div>;
};
export default AlazabChatSettingsPage;

import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Send, Settings2, Trash2, RotateCcw } from 'lucide-react';
import { apiGet, apiPost } from '@/utils/fetchInterceptor';
import { ChatAgent, readChatSettings } from '@/chat/chatConfig';

type Message = { role: 'user' | 'assistant'; content: string };
type Result = { id: string; name: string; provider: string; model: string; content: string | null; error: string | null };
type ChatResponse = { success: boolean; message?: string; data?: { results: Result[] } };
const AlazabChatPage: React.FC = () => {
  const [agents, setAgents] = useState<ChatAgent[]>([]);
  const [layout, setLayout] = useState<'stack' | 'columns'>('columns');
  const [includeHistory, setIncludeHistory] = useState(true);
  const [history, setHistory] = useState<Message[]>([]);
  const [responses, setResponses] = useState<Result[]>([]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [providers, setProviders] = useState<{openai:boolean;azure:boolean}|null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const conf = readChatSettings();
    setAgents(conf.agents.filter(a => a.enabled));
    setLayout(conf.layout); setIncludeHistory(conf.includeHistory);
    void apiGet<{success:boolean;data?:{openai:boolean;azure:boolean}}>('/alazab-chat/providers')
      .then(r=>{if(r.success && r.data)setProviders(r.data);});
  }, []);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:'smooth'});},[history,responses]);
  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt || pending) return;
    if (!agents.length) {setError('Enable at least one agent in Chat settings.');return;}
    const messages: Message[] = [...(includeHistory ? history.slice(-28) : []),{role:'user',content:prompt}];
    setHistory(current=>[...current,{role:'user',content:prompt}]);
    setInput('');setPending(true);setError('');setResponses([]);
    try {
      const reply = await apiPost<ChatResponse>('/alazab-chat/respond',{
        agents: agents.map(({id,name,provider,model,instruction})=>({id,name,provider,model,instruction})),
        messages,
      });
      if (!reply.success || !reply.data) {
        setError(reply.message || 'The request failed. Check server provider settings.');
        return;
      }
      setResponses(reply.data.results);
      // Only successful responses join history to prevent treating provider errors as model outputs.
      const successful = reply.data.results.filter(r=>r.content);
      if (successful.length) {
        setHistory(current=>[...current,{role:'assistant',content:successful.map(r=>`${r.name}: ${r.content}`).join('\n\n')}]);
      }
    } catch(e) {setError(e instanceof Error ? e.message : 'Failed to send message');}
    finally {setPending(false);}
  };
  return <div className="flex flex-col gap-4" style={{minHeight:'calc(100vh - 160px)'}}>
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="hub-h1 flex items-center gap-2"><Bot size={23} style={{color:'#FFB900'}}/> Alazab Multi-Agent Chat</h1>
      <p className="hub-sub">Ask multiple independent AI agents in parallel. Compare their answers in one workspace.</p></div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="hub-btn" onClick={()=>{setHistory([]);setResponses([]);setError('');}}><Trash2 size={14}/> New conversation</button>
        <Link to="/chat/settings" className="hub-btn"><Settings2 size={15}/> Chat settings</Link>
      </div>
    </header>
    <div className="flex flex-wrap gap-2">
      {agents.map(a=><span key={a.id} className="hub-tag">{a.name} · {a.provider}/{a.model}</span>)}
      {!agents.length && <span className="hub-sub">No active agents. Configure them in Chat settings.</span>}
      {providers && <span className="hub-tag">Providers: {Object.entries(providers).filter(([,value])=>value).map(([key])=>key).join(', ') || 'none configured'}</span>}
    </div>
    <section aria-label="Conversation" className="hub-card hub-card-pad flex-1 space-y-4 overflow-auto" style={{minHeight:320,maxHeight:'65vh'}}>
      {!history.length && <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <Bot size={40} style={{color:'#030957'}}/>
        <h2 className="text-lg font-semibold">One question. Multiple perspectives.</h2>
        <p className="hub-sub max-w-md">Select agents, models and roles in Chat settings, then ask a question to compare their responses.</p>
      </div>}
      {history.filter(m=>m.role==='user').map((m,i)=><div key={i} className="flex justify-end">
        <div className="rounded-xl px-4 py-3 text-sm whitespace-pre-wrap max-w-[85%]" style={{background:'#030957',color:'#fff'}}>{m.content}</div>
      </div>)}
      {pending && <p role="status" className="hub-sub flex items-center gap-2"><RotateCcw size={15} className="animate-spin"/> Waiting for agents...</p>}
      {responses.length>0 && <div className={layout==='columns'?'grid gap-3 lg:grid-cols-2':'flex flex-col gap-3'}>
        {responses.map(r=><article key={r.id} className="hub-card hub-card-pad space-y-2 min-w-0">
          <header className="flex flex-wrap justify-between items-center gap-2"><strong>{r.name}</strong><span className="hub-tag">{r.provider} · {r.model}</span></header>
          {r.error?<p role="alert" className="text-sm text-red-600">{r.error}</p>:<div className="text-sm whitespace-pre-wrap break-words leading-relaxed">{r.content}</div>}
        </article>)}
      </div>}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div ref={bottomRef}/>
    </section>
    <form onSubmit={e=>{void send(e);}} className="hub-card hub-card-pad flex gap-3 items-end">
      <label className="flex-1 text-sm" htmlFor="chat-prompt">
        <span className="sr-only">Message</span>
        <textarea id="chat-prompt" rows={3} maxLength={12000} value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{if(e.key==='Enter' && !e.shiftKey && !e.nativeEvent.isComposing){e.preventDefault();void send(e);}}}
          placeholder="Message your selected agents…  (Enter to send · Shift+Enter for a new line)"
          className="hub-input h-auto min-h-[78px] py-2 resize-y" disabled={pending}/>
      </label>
      <button type="submit" className="hub-btn primary" disabled={pending||!input.trim()||!agents.length}><Send size={15}/> Send</button>
    </form>
    <p className="hub-sub">Results are generated by configured remote models. Chats are kept in memory for this page session; they are not saved to the server.</p>
  </div>;
};
export default AlazabChatPage;

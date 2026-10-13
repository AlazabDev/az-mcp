import type { Request, Response } from 'express';

type AgentInput = { id: string; name: string; provider: 'openai' | 'azure'; model: string; instruction: string };
type ChatMessage = { role: 'user' | 'assistant'; content: string };
const MAX_AGENTS = 6;
const textValue = (v: unknown, max: number) => typeof v === 'string' ? v.trim().slice(0, max) : '';

export const getChatProviders = (_req: Request, res: Response): void => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ success: true, data: {
    openai: Boolean(process.env.AZ_CHAT_OPENAI_API_KEY),
    azure: Boolean(process.env.AZ_CHAT_AZURE_API_KEY && process.env.AZ_CHAT_AZURE_ENDPOINT),
  } });
};

const runAgent = async (agent: AgentInput, messages: ChatMessage[], signal: AbortSignal) => {
  const azure = agent.provider === 'azure';
  const token = azure ? process.env.AZ_CHAT_AZURE_API_KEY : process.env.AZ_CHAT_OPENAI_API_KEY;
  if (!token) throw new Error(`${agent.provider} is not configured on the server`);
  let url = 'https://api.openai.com/v1/chat/completions';
  let headers: Record<string, string> = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  if (azure) {
    const endpoint = process.env.AZ_CHAT_AZURE_ENDPOINT || '';
    const parsed = new URL(endpoint);
    if (parsed.protocol !== 'https:') throw new Error('Azure endpoint must use HTTPS');
    // The trusted endpoint is configured by the server operator, never supplied by a browser.
    url = endpoint;
    headers = { 'Content-Type': 'application/json', 'api-key': token };
  }
  const response = await fetch(url, {
    method: 'POST',
    headers,
    signal,
    body: JSON.stringify({
      model: agent.model,
      messages: [
        { role: 'system', content: agent.instruction || 'You are a helpful assistant.' },
        ...messages,
      ],
      stream: false,
    }),
  });
  if (!response.ok) throw new Error(`${agent.provider} returned HTTP ${response.status}`);
  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const answer = payload.choices?.[0]?.message?.content;
  if (!answer) throw new Error('The provider returned an empty response');
  return answer.slice(0, 40000);
};

export const multiAgentChat = async (req: Request, res: Response): Promise<void> => {
  res.setHeader('Cache-Control', 'no-store');
  const agents = req.body?.agents;
  const history = req.body?.messages;
  if (!Array.isArray(agents) || agents.length < 1 || agents.length > MAX_AGENTS ||
      !Array.isArray(history) || history.length < 1 || history.length > 30) {
    res.status(400).json({ success: false, message: 'Invalid agents or messages' });
    return;
  }
  const parsedAgents: AgentInput[] = agents.map((item: Record<string, unknown>) => ({
    id: textValue(item?.id, 60), name: textValue(item?.name, 80),
    provider: item?.provider, model: textValue(item?.model, 100),
    instruction: textValue(item?.instruction, 3000),
  }));
  const messages: ChatMessage[] = history.map((item: Record<string, unknown>) => ({
    role: item?.role === 'assistant' ? 'assistant' : 'user',
    content: textValue(item?.content, 12000),
  }));
  if (parsedAgents.some((a) => !a.id || !a.model || !['openai', 'azure'].includes(a.provider)) ||
      messages.some((m) => !m.content || !['user', 'assistant'].includes(m.role)) ||
      new Set(parsedAgents.map((a) => a.id)).size !== parsedAgents.length ||
      history.some((m: Record<string, unknown>) => !['user', 'assistant'].includes(String(m?.role)))) {
    res.status(400).json({ success: false, message: 'Invalid agent configuration or message format' });
    return;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);
  try {
    const results = await Promise.all(parsedAgents.map(async (agent) => {
      try {
        return { id: agent.id, name: agent.name, provider: agent.provider, model: agent.model,
          content: await runAgent(agent, messages, controller.signal), error: null };
      } catch (err) {
        return { id: agent.id, name: agent.name, provider: agent.provider, model: agent.model,
          content: null, error: err instanceof Error ? err.message : 'Agent request failed' };
      }
    }));
    res.json({ success: true, data: { results } });
  } finally {
    clearTimeout(timeout);
  }
};

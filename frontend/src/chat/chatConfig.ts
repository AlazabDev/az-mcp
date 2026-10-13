export type ChatProvider = 'openai' | 'azure';
export interface ChatAgent {
  id: string;
  name: string;
  provider: ChatProvider;
  model: string;
  instruction: string;
  enabled: boolean;
}
export interface ChatPreferences {
  agents: ChatAgent[];
  layout: 'columns' | 'stack';
  includeHistory: boolean;
}
export const DEFAULT_CHAT_SETTINGS: ChatPreferences = {
  agents: [
    { id: 'architect', name: 'Architect', provider: 'openai', model: 'gpt-5.1', instruction: 'You are a software architect. Give practical, verifiable suggestions.', enabled: true },
    { id: 'reviewer', name: 'Reviewer', provider: 'openai', model: 'gpt-5.1', instruction: 'Review the request critically and identify risks and edge cases.', enabled: false },
  ],
  layout: 'columns',
  includeHistory: true,
};
const KEY = 'alazab-chat-v1';
export function readChatSettings(): ChatPreferences {
  try {
    const item = window.localStorage.getItem(KEY);
    if (!item) return DEFAULT_CHAT_SETTINGS;
    const value: unknown = JSON.parse(item);
    if (!value || typeof value !== 'object') return DEFAULT_CHAT_SETTINGS;
    const raw = value as Partial<ChatPreferences>;
    if (!Array.isArray(raw.agents)) return DEFAULT_CHAT_SETTINGS;
    const agents = raw.agents.filter((item): item is ChatAgent =>
      Boolean(item && typeof item.id === 'string' && typeof item.name === 'string' &&
      (item.provider === 'openai' || item.provider === 'azure') &&
      typeof item.model === 'string' && typeof item.instruction === 'string' &&
      typeof item.enabled === 'boolean')).slice(0, 6);
    return { agents, layout: raw.layout === 'stack' ? 'stack' : 'columns', includeHistory: raw.includeHistory !== false };
  } catch { return DEFAULT_CHAT_SETTINGS; }
}
export function writeChatSettings(settings: ChatPreferences): void {
  window.localStorage.setItem(KEY, JSON.stringify(settings));
}

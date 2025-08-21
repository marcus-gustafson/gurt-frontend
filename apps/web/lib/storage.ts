import type { ChatMessage, Settings } from './types';

const SETTINGS_KEY = 'gurt.settings.v1';
const CHAT_KEY = 'gurt.chats.v1';

const defaultSystemPrompt = process.env.NEXT_PUBLIC_DEFAULT_SYSTEM_PROMPT ??
  'You are Gurt, a private, local-first assistant. Keep data on this machine. Be concise by default, expand on request. Prefer actionable steps, avoid fluff. If a request needs external access, say so and ask before proceeding.';

export function loadSettings(): Settings {
  if (typeof window === 'undefined') {
    return {
      model: process.env.NEXT_PUBLIC_MODEL_ID ?? 'oss-20b',
      temperature: 0.7,
      systemPrompt: defaultSystemPrompt
    };
  }
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    model: process.env.NEXT_PUBLIC_MODEL_ID ?? 'oss-20b',
    temperature: 0.7,
    systemPrompt: defaultSystemPrompt
  };
}

export function saveSettings(s: Settings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch {}
}

export function loadChats(): ChatMessage[][] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveChats(chats: ChatMessage[][]) {
  try { localStorage.setItem(CHAT_KEY, JSON.stringify(chats)); } catch {}
}

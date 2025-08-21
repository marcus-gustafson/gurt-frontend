export type Role = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
}

export interface Settings {
  baseUrlOverride?: string;
  model: string;
  temperature: number;
  systemPrompt: string;
}

export interface HealthInfo {
  ok: boolean;
  baseUrl?: string;
  models?: string[];
  error?: string;
}

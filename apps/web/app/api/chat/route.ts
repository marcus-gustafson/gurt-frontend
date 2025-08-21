// app/api/chat/route.ts
import { NextRequest } from 'next/server';
export const runtime = 'nodejs';

let cachedBase: string | null = null;

async function probe(url: string) {
  try {
    const r = await fetch(url.replace(/\/?$/, '') + '/models', {
      headers: { Authorization: 'Bearer LOCAL', Accept: 'application/json' },
      cache: 'no-store',
    });
    return r.ok;
  } catch { return false; }
}

async function detectBaseUrl(override?: string) {
  if (override) return override.replace(/\/?$/, '');
  if (process.env.OPENAI_BASE_URL) return process.env.OPENAI_BASE_URL.replace(/\/?$/, '');
  if (cachedBase) return cachedBase;
  const candidates = ['http://127.0.0.1:8080/v1', 'http://localhost:8080/v1', 'http://localhost:1234/v1'];
  for (const url of candidates) if (await probe(url)) { cachedBase = url; return url; }
  throw new Error('No local LLM detected on 8080/1234. Start llama-server.exe or set OPENAI_BASE_URL.');
}

// Flat prompt built from the last user turn — best for completion-only models
function buildPrompt(systemPrompt: string | undefined, msgs: { role: string; content: string }[]) {
  const sys = (systemPrompt?.trim() ||
    'You are Gurt, a concise local-first assistant. Do NOT repeat or restate the prompt.')
    .replace(/\r/g, '');
  const lastUser = [...msgs].reverse().find(m => m.role === 'user')?.content ?? '';
  return `System: ${sys}

### Instruction:
${lastUser}

### Response:`;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, model, temperature, systemPrompt, baseUrlOverride } = await req.json();

    const base = await detectBaseUrl(baseUrlOverride);
    const key = process.env.OPENAI_API_KEY || 'LOCAL';
    const modelId = model || process.env.MODEL_ID || 'oss-20b';

    const prompt = buildPrompt(systemPrompt, Array.isArray(messages) ? messages : []);
    const body: Record<string, unknown> = {
      model: modelId,
      prompt,
      temperature: typeof temperature === 'number' ? temperature : 0.6,
      top_p: 0.9,
      max_tokens: 1024,
      // Anti-echo knobs for llama.cpp:
      frequency_penalty: 0.6,
      presence_penalty: 0.1,
      repeat_penalty: 1.18,
      penalty_last_n: 256,
      // Hard stops so it doesn’t echo role tags:
      stop: ['\n###', '\nUser:', '\nAssistant:', '</s>'],
      stream: false, // <<< NON-STREAMING to match your working curl
      // (Optional) uncomment to try stronger de-repetition:
      // mirostat: 2, mirostat_tau: 5.0, mirostat_eta: 0.1,
    };

    const upstream = await fetch(base + '/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      } as any,
      body: JSON.stringify(body),
    });

    if (!upstream.ok) {
      const t = await upstream.text();
      return new Response(t || `Upstream error ${upstream.status}`, { status: 502 });
    }

    const json = await upstream.json();
    // Prefer completions shape; fallback to chat shape just in case.
    const text =
      json?.choices?.[0]?.text ??
      json?.choices?.[0]?.message?.content ??
      '';

    return new Response(text, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Gurt-Api': '/v1/completions',
        'X-Gurt-Stream': 'off',
      },
    });
  } catch (e: any) {
    return new Response(e?.message || 'Bad request', { status: 400 });
  }
}

import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

let cachedBase: string | null = null;

async function probe(url: string) {
  try {
    const res = await fetch(url + '/models', {
      headers: { 'Authorization': 'Bearer LOCAL', 'Accept': 'application/json' },
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const j = await res.json().catch(() => ({}));
    const models = Array.isArray(j?.data) ? j.data.map((m: any) => m.id || m.name).filter(Boolean) : undefined;
    return { baseUrl: url, models };
  } catch { return null; }
}

async function detectBaseUrl(envUrl?: string) {
  if (envUrl) return envUrl.replace(/\/?$/, '');
  if (cachedBase) return cachedBase;
  const candidates = ['http://localhost:8080/v1', 'http://localhost:1234/v1'];
  for (const url of candidates) {
    const ok = await probe(url);
    if (ok) {
      cachedBase = url;
      return url;
    }
  }
  return null;
}

export async function GET(_req: NextRequest) {
  const env = process.env.OPENAI_BASE_URL;
  const base = await detectBaseUrl(env || undefined);
  if (!base) {
    return new Response(JSON.stringify({ ok: false, error: 'No local LLM detected' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  const info = await probe(base);
  return new Response(JSON.stringify({ ok: true, baseUrl: base, models: info?.models ?? [] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

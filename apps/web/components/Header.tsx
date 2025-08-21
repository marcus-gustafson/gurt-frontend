'use client';
import { useEffect, useState } from 'react';
import type { HealthInfo } from '@/lib/types';
import clsx from 'clsx';

export default function Header({ onOpenSettings }: { onOpenSettings: () => void }) {
  const [health, setHealth] = useState<HealthInfo>({ ok: false });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/health', { cache: 'no-store' });
        const json = await res.json();
        setHealth(json);
      } catch (e: any) {
        setHealth({ ok: false, error: e?.message || 'Unknown error' });
      }
    })();
  }, []);

  return (
    <header className="sticky top-0 z-10 bg-slatebg/80 backdrop-blur border-b border-white/10">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-xl font-semibold">Gurt</div>
          <span className={clsx(
            'text-xs rounded-full px-2 py-1 border',
            health.ok ? 'border-emerald-400 text-emerald-300' : 'border-amber-400 text-amber-300'
          )}>
            {health.ok ? (health.baseUrl?.includes('8080') ? 'llama.cpp @ 8080' :
              health.baseUrl?.includes('1234') ? 'LM Studio @ 1234' : 'Local LLM') : 'No local LLM detected'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label="Open settings"
            onClick={onOpenSettings}
            className="rounded-xl border border-white/10 px-3 py-1.5 hover:bg-white/5"
            title="Settings"
          >⚙️ Settings</button>
          <a
            className="rounded-xl border border-white/10 px-3 py-1.5 hover:bg-white/5"
            href="https://github.com"
            target="_blank" rel="noreferrer"
            title="(placeholder)"
          >ℹ️</a>
        </div>
      </div>
    </header>
  );
}

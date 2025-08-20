'use client';
import { useEffect, useState } from 'react';
import type { Settings } from '@/lib/types';
import { loadSettings, saveSettings } from '@/lib/storage';

export default function SettingsModal({ open, onClose } : { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState<Settings>(loadSettings());

  useEffect(() => {
    if (open) setForm(loadSettings());
  }, [open]);

  function update<K extends keyof Settings>(k: K, v: Settings[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function onSave() {
    saveSettings(form);
    onClose();
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg p-5">
        <div className="text-lg font-semibold mb-3">Settings</div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Model name</label>
            <input value={form.model} onChange={(e)=>update('model', e.target.value)}
              className="w-full rounded-xl bg-slate-800 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-sm mb-1">Temperature</label>
            <input type="number" step="0.1" min="0" max="2"
              value={form.temperature} onChange={(e)=>update('temperature', parseFloat(e.target.value))}
              className="w-full rounded-xl bg-slate-800 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-sm mb-1">Base URL override (optional)</label>
            <input placeholder="http://localhost:8080/v1" value={form.baseUrlOverride ?? ''}
              onChange={(e)=>update('baseUrlOverride', e.target.value)}
              className="w-full rounded-xl bg-slate-800 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-sm mb-1">System prompt</label>
            <textarea
              value={form.systemPrompt}
              onChange={(e)=>update('systemPrompt', e.target.value)}
              rows={5}
              className="w-full rounded-xl bg-slate-800 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="rounded-xl border border-white/10 px-3 py-1.5 hover:bg-white/5">Cancel</button>
          <button onClick={onSave} className="rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-1.5">Save</button>
        </div>
      </div>
    </div>
  );
}

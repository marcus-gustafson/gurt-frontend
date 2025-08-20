'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChatMessage, Settings } from '@/lib/types';
import { loadChats, saveChats, loadSettings } from '@/lib/storage';
import Message from './Message';
import { readStreamToCallback } from '@/lib/stream';
import { nanoid } from './nanoid';

type SendState = 'idle' | 'sending';

export default function Chat() {
  const [settings, setSettings] = useState<Settings>(loadSettings());
  const [chats, setChats] = useState<ChatMessage[][]>(loadChats());
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [input, setInput] = useState<string>('');
  const [sendState, setSendState] = useState<SendState>('idle');
  const controllerRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Ensure at least one chat
  useEffect(() => {
    if (chats.length === 0) {
      setChats([[]]);
    }
  }, [chats.length]);

  // Persist chats on change
  useEffect(() => {
    saveChats(chats);
  }, [chats]);

  // Refresh settings from localStorage if changed elsewhere
  useEffect(() => {
    const onFocus = () => setSettings(loadSettings());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const messages = chats[activeIdx] ?? [];
  const approxTokens = (txt: string) => Math.max(1, Math.round(txt.length / 4));

  useEffect(() => {
    // Auto-scroll to bottom on new messages
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  async function send() {
    if (!input.trim() || sendState === 'sending') return;
    const userMsg: ChatMessage = { id: nanoid(), role: 'user', content: input.trim(), createdAt: Date.now() };
    const assistantMsg: ChatMessage = { id: nanoid(), role: 'assistant', content: '', createdAt: Date.now() };

    setChats((chs) => {
      const next = [...chs];
      next[activeIdx] = [...messages, userMsg, assistantMsg];
      return next;
    });
    setInput('');

    try {
      setSendState('sending');
      const body = {
        messages: [...messages, userMsg].map(({ role, content }) => ({ role, content })),
        model: settings.model,
        temperature: settings.temperature,
        systemPrompt: settings.systemPrompt,
        baseUrlOverride: settings.baseUrlOverride || undefined,
      };
      controllerRef.current = new AbortController();
      const res = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
        signal: controllerRef.current.signal,
      });
      if (!res.ok || !res.body) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      await readStreamToCallback(res.body, (delta) => {
        setChats((chs) => {
          const next = [...chs];
          const last = next[activeIdx];
          if (!last) return chs;
          const idx = last.findIndex((m) => m.id === assistantMsg.id);
          if (idx >= 0) {
            last[idx] = { ...last[idx], content: last[idx].content + delta };
          }
          return next;
        });
      });
    } catch (e: any) {
      setChats((chs) => {
        const next = [...chs];
        const last = next[activeIdx];
        if (last && last[last.length - 1]?.role === 'assistant') {
          last[last.length - 1].content += `\n\n**Error:** ${e?.message || 'Unknown error'}`;
        }
        return next;
      });
    } finally {
      setSendState('idle');
      controllerRef.current = null;
    }
  }

  function stop() {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setSendState('idle');
  }

  function newChat() {
    setChats((chs) => [...chs, []]);
    setActiveIdx(chats.length);
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify({ chats }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gurt-chats.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (Array.isArray(data?.chats)) setChats(data.chats);
      } catch { alert('Invalid JSON'); }
    };
    reader.readAsText(file);
    e.currentTarget.value = '';
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-4xl mx-auto px-4">
      {/* Tabs / session bar */}
      <div className="flex gap-2 py-2 overflow-x-auto">
        {chats.map((_, i) => (
          <button key={i}
            className={`px-3 py-1.5 rounded-xl border ${i===activeIdx?'bg-white/10 border-white/20':'border-white/10 hover:bg-white/5'}`}
            onClick={()=>setActiveIdx(i)}>
            Chat {i+1}
          </button>
        ))}
        <button onClick={newChat} className="px-3 py-1.5 rounded-xl border border-white/10 hover:bg-white/5">+ New chat</button>
        <div className="flex-1" />
        <button onClick={exportJSON} className="px-3 py-1.5 rounded-xl border border-white/10 hover:bg-white/5">Export</button>
        <label className="px-3 py-1.5 rounded-xl border border-white/10 hover:bg-white/5 cursor-pointer">
          Import
          <input type="file" accept="application/json" className="hidden" onChange={onImport} />
        </label>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-1 py-3">
        {messages.length === 0 && (
          <div className="opacity-60 text-sm p-4 rounded-xl border border-white/10">
            Say hi to <strong>Gurt</strong>. Your chats stay on this machine.
          </div>
        )}
        {messages.map((m) => (
          <Message key={m.id} m={m} approxTokens={m.role==='assistant'? approxTokens(m.content) : undefined} />
        ))}
      </div>

      {/* Composer */}
      <div className="pb-4">
        <div className="rounded-2xl border border-white/10 bg-slate-900 p-2">
          <textarea
            aria-label="Message input"
            value={input}
            onChange={(e)=>setInput(e.target.value)}
            placeholder="Message Gurt... (Shift+Enter for newline)"
            rows={3}
            onKeyDown={(e)=>{
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            className="w-full bg-transparent outline-none resize-none px-2 py-1"
          />
          <div className="flex gap-2 justify-end px-2 pb-1">
            {sendState === 'sending' ? (
              <button onClick={stop} className="rounded-xl bg-amber-600 hover:bg-amber-500 px-4 py-1.5">Stop</button>
            ) : (
              <button onClick={send} className="rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-1.5">Send</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

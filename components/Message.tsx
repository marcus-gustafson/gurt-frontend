'use client';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from '@/lib/types';
import clsx from 'clsx';

export default function Message({ m, approxTokens }: { m: ChatMessage; approxTokens?: number }) {
  const isUser = m.role === 'user';
  return (
    <div className={clsx('flex w-full mb-3', isUser ? 'justify-end' : 'justify-start')}>
      <div className={clsx(
        'max-w-[85%] rounded-2xl px-4 py-3 shadow-sm',
        isUser ? 'bg-slate-700 text-white rounded-br-sm' : 'bg-slate-800 text-slate-100 rounded-bl-sm'
      )}>
        <div className="markdown prose prose-invert prose-pre:whitespace-pre-wrap">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
        </div>
        {m.role === 'assistant' && approxTokens !== undefined && (
          <div className="text-[10px] opacity-60 mt-1">{approxTokens} ~tokens</div>
        )}
      </div>
    </div>
  );
}

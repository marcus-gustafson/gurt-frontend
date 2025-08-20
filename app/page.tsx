'use client';
import { useState } from 'react';
import Header from '@/components/Header';
import Chat from '@/components/Chat';
import SettingsModal from '@/components/Settings';

export default function Page() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col">
      <Header onOpenSettings={() => setOpen(true)} />
      <main className="flex-1">
        <Chat />
      </main>
      <SettingsModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

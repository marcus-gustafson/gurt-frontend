import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gurt – Local-first chat',
  description: 'Chat with your local LLM via a clean, minimal UI.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slatebg text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}

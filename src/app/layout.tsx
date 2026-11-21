import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CollabCraft Studio — Real-Time Collaborative System Architecture',
  description: 'Design enterprise system architectures collaboratively in real-time with CRDT conflict-free sync and AI copilot.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

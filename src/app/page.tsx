import WhiteboardCanvas from '@/components/canvas/WhiteboardCanvas';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';

interface Props {
  searchParams: Promise<{ room?: string }>;
}

export default async function Home({ searchParams }: Props) {
  const params = await searchParams;
  
  // Fix P1.5: If no room specified, redirect to an isolated private workspace room
  // so visitors do not unintentionally share and overwrite the same global board
  if (!params?.room) {
    const uniqueRoom = 'studio-' + Math.random().toString(36).substring(2, 9);
    redirect(`/?room=${uniqueRoom}`);
  }

  const roomId = params.room;

  return (
    <Suspense
      fallback={
        <div className="w-screen h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-xs">
          Loading Architecture Canvas...
        </div>
      }
    >
      <WhiteboardCanvas roomId={roomId} />
    </Suspense>
  );
}

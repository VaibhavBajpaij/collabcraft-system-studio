import WhiteboardCanvas from '@/components/canvas/WhiteboardCanvas';
import { Suspense } from 'react';

interface Props {
  searchParams: Promise<{ room?: string }>;
}

export default async function Home({ searchParams }: Props) {
  const params = await searchParams;
  const roomId = params?.room || 'production-main-room';

  return (
    <Suspense fallback={<div className="w-screen h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-xs">Loading Architecture Canvas...</div>}>
      <WhiteboardCanvas roomId={roomId} />
    </Suspense>
  );
}

import { NextResponse } from 'next/server';

export async function GET() {
  const wsEndpoint = process.env.NEXT_PUBLIC_WS_ENDPOINT || 'ws://localhost:1234';
  
  return NextResponse.json({
    status: 'healthy',
    service: 'collabcraft-system-studio',
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor(process.uptime()),
    crdt_relay_endpoint: wsEndpoint,
    storage: 'indexeddb_local_first'
  });
}

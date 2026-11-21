import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'collabcraft-system-studio',
    timestamp: new Date().toISOString(),
    crdt_sync: 'active'
  });
}

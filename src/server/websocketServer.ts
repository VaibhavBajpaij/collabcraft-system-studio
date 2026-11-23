import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import * as Y from 'yjs';
// @ts-ignore
import { setupWSConnection, docs } from 'y-websocket/bin/utils';

const PORT = parseInt(process.env.PORT || process.env.WS_PORT || '1234', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Create HTTP server for health checks and status monitoring
const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/health' || req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'healthy',
        service: 'collabcraft-websocket-relay',
        uptime: process.uptime(),
        activeRooms: docs.size,
        port: PORT,
        timestamp: new Date().toISOString()
      })
    );
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('CollabCraft Real-Time Yjs Collaboration WebSocket Relay');
});

// Create WebSocket server attached to HTTP server
const wss = new WebSocketServer({ server });

wss.on('connection', (conn: WebSocket, req: http.IncomingMessage) => {
  const url = req.url || '';
  // Extract room name from URL query or path (e.g., /?room=X or /X)
  let roomName = 'production-main-room';
  if (url.includes('?')) {
    const searchParams = new URLSearchParams(url.split('?')[1]);
    roomName = searchParams.get('room') || searchParams.get('roomName') || roomName;
  } else if (url.length > 1) {
    roomName = url.slice(1).split('?')[0] || roomName;
  }

  // Clean room name
  const sanitizedRoom = 'collabcraft-' + roomName.replace(/[^a-zA-Z0-9-_]/g, '-');

  try {
    setupWSConnection(conn, req, { docName: sanitizedRoom, gc: true });
  } catch (err) {
    console.error(`Error setting up WS connection for room ${sanitizedRoom}:`, err);
    conn.close(1011, 'Internal server error');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`🚀 CollabCraft Yjs WebSocket Relay running at ws://${HOST}:${PORT}`);
  console.log(`📊 Health check available at http://${HOST}:${PORT}/health`);
});

// Graceful shutdown
const shutdown = () => {
  console.log('\nShutting down CollabCraft WebSocket Relay...');
  wss.close(() => {
    server.close(() => {
      console.log('CollabCraft WebSocket Relay terminated gracefully.');
      process.exit(0);
    });
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export { server, wss };

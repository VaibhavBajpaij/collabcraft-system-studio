import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { WebrtcProvider } from 'y-webrtc';
import { CanvasShape, UserPresence } from '../types/canvas';

export class CollabDoc {
  public doc: Y.Doc;
  public shapesMap: Y.Map<CanvasShape>;
  public wsProvider: WebsocketProvider | null = null;
  public webrtcProvider: WebrtcProvider | null = null;
  public status: 'connected' | 'connecting' | 'disconnected' = 'connecting';
  private statusListeners: Array<(status: 'connected' | 'connecting' | 'disconnected') => void> = [];

  constructor(roomName: string = 'production-main-room') {
    this.doc = new Y.Doc();
    this.shapesMap = this.doc.getMap<CanvasShape>('shapes');

    if (typeof window !== 'undefined') {
      const sanitizedRoom = 'collabcraft-' + roomName.replace(/[^a-zA-Z0-9-_]/g, '-');

      // 1. WebRTC & BroadcastChannel P2P Provider (0ms intra-browser & P2P inter-browser)
      try {
        this.webrtcProvider = new WebrtcProvider(sanitizedRoom, this.doc, {
          signaling: [
            'wss://signaling.yjs.dev',
            'wss://y-webrtc-signaling-eu.herokuapp.com'
          ]
        });
      } catch (e) {
        console.warn('WebRTC Provider init failed:', e);
      }

      // 2. WebSocket Central Relay Provider
      try {
        this.wsProvider = new WebsocketProvider(
          'wss://demos.yjs.dev/ws',
          sanitizedRoom,
          this.doc,
          { connect: true }
        );

        this.wsProvider.on('status', (event: { status: string }) => {
          this.status = event.status === 'connected' ? 'connected' : 'connecting';
          this.notifyStatusListeners();
        });
      } catch (e) {
        console.warn('WebSocket Provider init failed:', e);
      }
    }
  }

  public onStatusChange(callback: (status: 'connected' | 'connecting' | 'disconnected') => void): () => void {
    this.statusListeners.push(callback);
    callback(this.status);
    return () => {
      this.statusListeners = this.statusListeners.filter(cb => cb !== callback);
    };
  }

  private notifyStatusListeners() {
    this.statusListeners.forEach(cb => cb(this.status));
  }

  public getAwareness() {
    return this.webrtcProvider?.awareness || this.wsProvider?.awareness || null;
  }

  public setShape(shape: CanvasShape): void {
    this.shapesMap.set(shape.id, shape);
  }

  public updateShapePosition(id: string, x: number, y: number): void {
    const existing = this.shapesMap.get(id);
    if (existing) {
      this.shapesMap.set(id, {
        ...existing,
        x: Math.round(x),
        y: Math.round(y)
      });
    }
  }

  public removeShape(id: string): void {
    this.shapesMap.delete(id);
  }

  public getShapes(): CanvasShape[] {
    const list: CanvasShape[] = [];
    this.shapesMap.forEach((shape) => {
      list.push(shape);
    });
    return list;
  }

  public destroy(): void {
    if (this.webrtcProvider) {
      this.webrtcProvider.destroy();
    }
    if (this.wsProvider) {
      this.wsProvider.destroy();
    }
    this.doc.destroy();
  }
}

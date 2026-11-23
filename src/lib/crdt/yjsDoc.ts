import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { WebrtcProvider } from 'y-webrtc';
import { IndexeddbPersistence } from 'y-indexeddb';
import { ArchitectureNode, ArchitectureEdge, UserPresence } from '../types/canvas';

export class CollabDoc {
  public doc: Y.Doc;
  public nodesMap: Y.Map<ArchitectureNode>;
  public edgesMap: Y.Map<ArchitectureEdge>;
  public wsProvider: WebsocketProvider | null = null;
  public webrtcProvider: WebrtcProvider | null = null;
  public idbProvider: IndexeddbPersistence | null = null;
  public undoManager: Y.UndoManager;
  public status: 'connected' | 'connecting' | 'disconnected' = 'connecting';
  public isSynced: boolean = false;
  private statusListeners: Array<(status: 'connected' | 'connecting' | 'disconnected') => void> = [];
  private syncListeners: Array<() => void> = [];

  constructor(roomName: string = 'production-main-room') {
    this.doc = new Y.Doc();
    this.nodesMap = this.doc.getMap<ArchitectureNode>('rf_nodes');
    this.edgesMap = this.doc.getMap<ArchitectureEdge>('rf_edges');
    this.undoManager = new Y.UndoManager([this.nodesMap, this.edgesMap]);

    if (typeof window !== 'undefined') {
      const sanitizedRoom = 'collabcraft-' + roomName.replace(/[^a-zA-Z0-9-_]/g, '-');

      // 1. IndexedDB Persistence: Local-First zero-data-loss storage
      try {
        this.idbProvider = new IndexeddbPersistence(sanitizedRoom, this.doc);
        this.idbProvider.on('synced', () => {
          this.isSynced = true;
          this.syncListeners.forEach(cb => cb());
        });
      } catch (e) {
        console.warn('IndexedDB persistence init warning:', e);
      }

      // 2. WebRTC & BroadcastChannel P2P Provider (0ms intra-browser & P2P inter-browser)
      try {
        this.webrtcProvider = new WebrtcProvider(sanitizedRoom, this.doc, {
          signaling: [
            'wss://signaling.yjs.dev',
            'wss://y-webrtc-signaling-eu.herokuapp.com'
          ]
        });
      } catch (e) {
        console.warn('WebRTC Provider init warning:', e);
      }

      // 3. WebSocket Central Relay Provider
      try {
        const defaultWsEndpoint =
          typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? 'ws://localhost:1234'
            : 'wss://demos.yjs.dev/ws';

        const wsEndpoint = process.env.NEXT_PUBLIC_WS_ENDPOINT || defaultWsEndpoint;

        this.wsProvider = new WebsocketProvider(
          wsEndpoint,
          sanitizedRoom,
          this.doc,
          { connect: true }
        );

        this.wsProvider.on('status', (event: { status: string }) => {
          this.status = event.status === 'connected' ? 'connected' : 'connecting';
          this.notifyStatusListeners();
        });
      } catch (e) {
        console.warn('WebSocket Provider init warning:', e);
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

  public onSynced(callback: () => void): () => void {
    if (this.isSynced) {
      callback();
    }
    this.syncListeners.push(callback);
    return () => {
      this.syncListeners = this.syncListeners.filter(cb => cb !== callback);
    };
  }

  private notifyStatusListeners() {
    this.statusListeners.forEach(cb => cb(this.status));
  }

  public getAwareness() {
    return this.webrtcProvider?.awareness || this.wsProvider?.awareness || null;
  }

  // Node operations
  public setNode(node: ArchitectureNode): void {
    this.doc.transact(() => {
      this.nodesMap.set(node.id, node);
    });
  }

  public updateNodes(nodes: ArchitectureNode[]): void {
    this.doc.transact(() => {
      nodes.forEach(node => {
        this.nodesMap.set(node.id, node);
      });
    });
  }

  public removeNode(id: string): void {
    this.doc.transact(() => {
      this.nodesMap.delete(id);
      // Clean up connected edges
      this.edgesMap.forEach((edge, edgeId) => {
        if (edge.source === id || edge.target === id) {
          this.edgesMap.delete(edgeId);
        }
      });
    });
  }

  public getNodes(): ArchitectureNode[] {
    const list: ArchitectureNode[] = [];
    this.nodesMap.forEach((node) => {
      list.push(node);
    });
    return list;
  }

  // Edge operations
  public setEdge(edge: ArchitectureEdge): void {
    this.doc.transact(() => {
      this.edgesMap.set(edge.id, edge);
    });
  }

  public updateEdges(edges: ArchitectureEdge[]): void {
    this.doc.transact(() => {
      edges.forEach(edge => {
        this.edgesMap.set(edge.id, edge);
      });
    });
  }

  public removeEdge(id: string): void {
    this.doc.transact(() => {
      this.edgesMap.delete(id);
    });
  }

  public getEdges(): ArchitectureEdge[] {
    const list: ArchitectureEdge[] = [];
    this.edgesMap.forEach((edge) => {
      list.push(edge);
    });
    return list;
  }

  // Undo / Redo
  public undo(): void {
    this.undoManager.undo();
  }

  public redo(): void {
    this.undoManager.redo();
  }

  public canUndo(): boolean {
    return this.undoManager.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.undoManager.redoStack.length > 0;
  }

  public destroy(): void {
    if (this.webrtcProvider) {
      this.webrtcProvider.destroy();
    }
    if (this.wsProvider) {
      this.wsProvider.destroy();
    }
    if (this.idbProvider) {
      this.idbProvider.destroy();
    }
    this.undoManager.destroy();
    this.doc.destroy();
  }
}

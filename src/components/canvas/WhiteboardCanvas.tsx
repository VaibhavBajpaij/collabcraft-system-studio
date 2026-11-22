'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { ArchitectureNode, ArchitectureEdge, ShapeType, UserPresence } from '@/lib/types/canvas';
import { CollabDoc } from '@/lib/crdt/yjsDoc';
import { ArchitectureNodeComponent } from './ArchitectureNodeComponent';
import { exportArchitectureToDockerCompose } from '@/lib/copilot/architectureGenerator';
import {
  Layers,
  Database,
  Cpu,
  HardDrive,
  Network,
  ShieldCheck,
  Sparkles,
  Undo2,
  Redo2,
  Download,
  FileCode,
  CheckCircle2,
  FileJson
} from 'lucide-react';

interface Props {
  roomId: string;
}

const PALETTE_COLORS: Record<ShapeType, string> = {
  service: '#10B981',
  database: '#8B5CF6',
  queue: '#F59E0B',
  cache: '#EF4444',
  gateway: '#3B82F6',
  auth: '#06B6D4',
  arrow: '#94A3B8',
  note: '#FCD34D'
};

const USER_COLORS = ['#38BDF8', '#F472B6', '#34D399', '#FBBF24', '#A78BFA', '#FB7185'];

export default function WhiteboardCanvas({ roomId }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<ArchitectureNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<ArchitectureEdge>([]);
  const [presences, setPresences] = useState<UserPresence[]>([]);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [copilotPrompt, setCopilotPrompt] = useState('');
  const [loadingCopilot, setLoadingCopilot] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [persistedInIdb, setPersistedInIdb] = useState(false);

  const collabRef = useRef<CollabDoc | null>(null);
  const userId = useRef('eng-' + Math.random().toString(36).substring(2, 6));
  const userColor = useRef(USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]);

  const nodeTypes = useMemo(() => ({
    architectureNode: ArchitectureNodeComponent as any
  }), []);

  const seedDefaultArchitecture = useCallback((doc: CollabDoc) => {
    const defaultNodes: ArchitectureNode[] = [
      {
        id: 'node-gateway',
        type: 'architectureNode',
        position: { x: 80, y: 160 },
        data: {
          label: 'Edge API Gateway',
          type: 'gateway',
          description: 'TLS Termination, Token-Bucket Rate Limiter & JWT routing',
          color: '#3B82F6',
          technology: 'Spring Cloud Gateway / Netty',
          protocol: 'HTTPS / HTTP/2'
        }
      },
      {
        id: 'node-service',
        type: 'architectureNode',
        position: { x: 380, y: 160 },
        data: {
          label: 'Payment Orchestrator',
          type: 'service',
          description: 'Saga Coordinator & Idempotent Transaction Execution',
          color: '#10B981',
          technology: 'Spring Boot 3 / Java 21',
          protocol: 'gRPC'
        }
      },
      {
        id: 'node-cache',
        type: 'architectureNode',
        position: { x: 680, y: 80 },
        data: {
          label: 'Redis Distributed Cache',
          type: 'cache',
          description: 'Sub-millisecond read-through cache & distributed locks',
          color: '#EF4444',
          technology: 'Redis 7.2 Cluster',
          protocol: 'RESP3'
        }
      },
      {
        id: 'node-queue',
        type: 'architectureNode',
        position: { x: 680, y: 260 },
        data: {
          label: 'Kafka Event Bus',
          type: 'queue',
          description: 'Partitioned payment-events log & Dead Letter Queue',
          color: '#F59E0B',
          technology: 'Apache Kafka 3.6',
          protocol: 'Binary Wire'
        }
      },
      {
        id: 'node-db',
        type: 'architectureNode',
        position: { x: 980, y: 200 },
        data: {
          label: 'PostgreSQL Ledger DB',
          type: 'database',
          description: 'ACID Balance Store, Read Replicas & WAL Replication',
          color: '#8B5CF6',
          technology: 'PostgreSQL 16 Multi-AZ',
          protocol: 'TCP / TLS'
        }
      }
    ];

    const defaultEdges: ArchitectureEdge[] = [
      { id: 'e-gw-srv', source: 'node-gateway', target: 'node-service', animated: true, style: { stroke: '#38BDF8', strokeWidth: 2 } },
      { id: 'e-srv-cache', source: 'node-service', target: 'node-cache', style: { stroke: '#EF4444', strokeWidth: 2, strokeDasharray: '5,5' } },
      { id: 'e-srv-queue', source: 'node-service', target: 'node-queue', animated: true, style: { stroke: '#F59E0B', strokeWidth: 2 } },
      { id: 'e-queue-db', source: 'node-queue', target: 'node-db', animated: true, style: { stroke: '#8B5CF6', strokeWidth: 2 } }
    ];

    doc.updateNodes(defaultNodes);
    doc.updateEdges(defaultEdges);
  }, []);

  useEffect(() => {
    const doc = new CollabDoc(roomId);
    collabRef.current = doc;

    // 1. Observe Yjs Nodes & Edges Map changes
    const syncFromDoc = () => {
      const docNodes = doc.getNodes();
      const docEdges = doc.getEdges();
      if (docNodes.length > 0) {
        setNodes(docNodes);
      }
      if (docEdges.length > 0) {
        setEdges(docEdges);
      }
    };

    doc.nodesMap.observe(syncFromDoc);
    doc.edgesMap.observe(syncFromDoc);

    // 2. Local-First IndexedDB synchronization signal
    doc.onSynced(() => {
      setPersistedInIdb(true);
      const storedNodes = doc.getNodes();
      const storedEdges = doc.getEdges();
      if (storedNodes.length > 0) {
        setNodes(storedNodes);
        setEdges(storedEdges);
      } else {
        seedDefaultArchitecture(doc);
      }
    });

    // 3. Network Connection Status
    const unsubscribeStatus = doc.onStatusChange((status) => {
      setSyncStatus(status);
    });

    // 4. Awareness Protocol (Live user cursors across tabs & peers)
    const awareness = doc.getAwareness();
    if (awareness) {
      awareness.setLocalStateField('user', {
        id: userId.current,
        name: 'Engineer (' + userId.current.substring(4) + ')',
        color: userColor.current,
        cursor: null
      });

      awareness.on('change', () => {
        const states = awareness.getStates();
        const active: UserPresence[] = [];
        states.forEach((state: any, clientID: number) => {
          if (state && state.user && state.user.id !== userId.current && state.user.cursor) {
            active.push({
              id: String(clientID),
              name: state.user.name,
              color: state.user.color,
              cursor: state.user.cursor,
              lastActive: Date.now()
            });
          }
        });
        setPresences(active);
      });
    }

    // Safety timeout in case IndexedDB was empty on initial boot
    setTimeout(() => {
      if (doc.getNodes().length === 0) {
        seedDefaultArchitecture(doc);
      }
    }, 600);

    return () => {
      unsubscribeStatus();
      doc.destroy();
    };
  }, [roomId, seedDefaultArchitecture, setNodes, setEdges]);

  // Connect new edge handler
  const onConnect = useCallback((connection: Connection) => {
    const newEdge: ArchitectureEdge = {
      id: `e-${connection.source}-${connection.target}-${Date.now()}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      animated: true,
      style: { stroke: '#38BDF8', strokeWidth: 2 }
    };

    setEdges((eds) => {
      const nextEdges = addEdge(newEdge, eds);
      collabRef.current?.setEdge(newEdge);
      return nextEdges;
    });
  }, [setEdges]);

  // Sync node movement on drag stop to CRDT
  const onNodeDragStop = useCallback((_: any, node: any) => {
    if (collabRef.current) {
      collabRef.current.setNode(node as ArchitectureNode);
    }
  }, []);

  // Delete node sync & immediately clean up incident edges to eliminate dangling ghost lines
  const onNodesDelete = useCallback((deletedNodes: any[]) => {
    const deletedIds = new Set(deletedNodes.map((n) => n.id));
    deletedNodes.forEach((n) => {
      collabRef.current?.removeNode(n.id);
    });
    setEdges((eds) => {
      const remainingEdges = eds.filter((e) => !deletedIds.has(e.source) && !deletedIds.has(e.target));
      if (collabRef.current) {
        collabRef.current.updateEdges(remainingEdges);
      }
      return remainingEdges;
    });
  }, [setEdges]);

  // Add individual component node with smart staggered coordinates (prevents stacking occlusion)
  const addNode = (type: ShapeType) => {
    if (!collabRef.current) return;
    const id = 'node-' + Math.random().toString(36).substring(2, 7);
    const existingCount = nodes.length;
    const col = existingCount % 4;
    const row = Math.floor(existingCount / 4);
    const posX = 100 + col * 270;
    const posY = 100 + row * 170;

    const labels: Record<ShapeType, string> = {
      gateway: 'API Gateway',
      service: 'Domain Microservice',
      queue: 'Event Stream Broker',
      cache: 'Distributed Cache',
      database: 'Transactional Database',
      auth: 'Auth & Identity Service',
      arrow: 'Connector',
      note: 'Sticky Note'
    };

    const techDefaults: Record<ShapeType, string> = {
      gateway: 'Netty / Envoy',
      service: 'Spring Boot 3 / Go',
      queue: 'Kafka / RabbitMQ',
      cache: 'Redis 7.2',
      database: 'PostgreSQL 16',
      auth: 'OAuth2 / Keycloak',
      arrow: '',
      note: ''
    };

    const newNode: ArchitectureNode = {
      id,
      type: 'architectureNode',
      position: { x: posX, y: posY },
      data: {
        label: labels[type] || 'System Node',
        type,
        description: `High-concurrency ${type} tier component`,
        color: PALETTE_COLORS[type] || '#10B981',
        technology: techDefaults[type] || '',
        protocol: type === 'gateway' ? 'HTTP/2' : 'gRPC'
      }
    };

    collabRef.current.setNode(newNode);
    setNodes((nds) => [...nds, newNode]);
  };

  // Undo / Redo
  const handleUndo = () => {
    collabRef.current?.undo();
    if (collabRef.current) {
      setNodes(collabRef.current.getNodes());
      setEdges(collabRef.current.getEdges());
    }
  };

  const handleRedo = () => {
    collabRef.current?.redo();
    if (collabRef.current) {
      setNodes(collabRef.current.getNodes());
      setEdges(collabRef.current.getEdges());
    }
  };

  // AI Copilot architecture generator
  const handleCopilotSubmit = async () => {
    if (!copilotPrompt.trim()) return;
    setLoadingCopilot(true);
    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: copilotPrompt })
      });
      const data = await res.json();
      if (data.nodes && data.edges && collabRef.current) {
        collabRef.current.updateNodes(data.nodes);
        collabRef.current.updateEdges(data.edges);
        setNodes(data.nodes);
        setEdges(data.edges);
      }
      setIsCopilotOpen(false);
      setCopilotPrompt('');
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCopilot(false);
    }
  };

  // Export Docker Compose
  const downloadDockerCompose = () => {
    const yaml = exportArchitectureToDockerCompose(nodes);
    const blob = new Blob([yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `docker-compose-${roomId}.yml`;
    a.click();
    URL.revokeObjectURL(url);
    setIsExportOpen(false);
  };

  // Export JSON Topology
  const downloadJSON = () => {
    const topology = JSON.stringify({ roomId, exportedAt: new Date().toISOString(), nodes, edges }, null, 2);
    const blob = new Blob([topology], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `architecture-topology-${roomId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setIsExportOpen(false);
  };

  return (
    <div className="relative w-screen h-screen bg-slate-950 flex flex-col font-sans select-none overflow-hidden">
      {/* Top Navbar */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-3 sm:px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 truncate">
          <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-sky-400 shrink-0" />
          <span className="font-bold text-base sm:text-lg text-slate-100 tracking-wide shrink-0">
            CollabCraft <span className="text-sky-400 text-xs sm:text-sm font-semibold">Studio</span>
          </span>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-400 border border-slate-700 truncate max-w-[140px]">
            Room: {roomId}
          </span>
          <span className="hidden lg:flex px-2.5 py-0.5 rounded-full text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 items-center gap-1.5 shadow-sm shadow-emerald-500/20 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            CRDT Active &bull; WebRTC + Yjs WebSocket
          </span>
          <span className="hidden xl:flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-950 text-sky-400 border border-sky-800 shrink-0">
            <CheckCircle2 className="w-3 h-3 text-sky-400" />
            Local-First IndexedDB
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Undo / Redo */}
          <div className="hidden sm:flex items-center border border-slate-800 rounded-lg bg-slate-900 overflow-hidden">
            <button
              onClick={handleUndo}
              title="Undo (Ctrl+Z)"
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-4 bg-slate-800" />
            <button
              onClick={handleRedo}
              title="Redo (Ctrl+Y)"
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Export Spec</span>
            </button>
            {isExportOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 z-50">
                <button
                  onClick={downloadDockerCompose}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition"
                >
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-semibold text-slate-200">Docker Compose YAML</div>
                    <div className="text-[10px] text-slate-400">Runnable multi-container spec</div>
                  </div>
                </button>
                <button
                  onClick={downloadJSON}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition"
                >
                  <FileJson className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="font-semibold text-slate-200">Architecture Topology</div>
                    <div className="text-[10px] text-slate-400">Export node/edge JSON graph</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* AI Copilot Button */}
          <button
            onClick={() => setIsCopilotOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-sky-500 text-white font-medium text-xs shadow-lg shadow-sky-500/20 hover:opacity-95 transition"
          >
            <Sparkles className="w-4 h-4" /> AI Copilot Architect
          </button>
        </div>
      </header>

      {/* Floating Canvas Component Palette */}
      <div className="absolute left-6 top-20 z-20 flex flex-col gap-1.5 p-1.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur">
        <button
          onClick={() => addNode('gateway')}
          title="Add API Gateway (Netty/Envoy)"
          className="p-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-sky-400 transition"
        >
          <Network className="w-5 h-5" />
        </button>
        <button
          onClick={() => addNode('auth')}
          title="Add Auth & Identity Service (OAuth2/OIDC)"
          className="p-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition"
        >
          <ShieldCheck className="w-5 h-5" />
        </button>
        <button
          onClick={() => addNode('service')}
          title="Add Microservice Node (Spring Boot/Go)"
          className="p-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-emerald-400 transition"
        >
          <Cpu className="w-5 h-5" />
        </button>
        <button
          onClick={() => addNode('queue')}
          title="Add Message Broker (Kafka/RabbitMQ)"
          className="p-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-amber-400 transition"
        >
          <Layers className="w-5 h-5" />
        </button>
        <button
          onClick={() => addNode('cache')}
          title="Add Redis Distributed Cache"
          className="p-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-rose-400 transition"
        >
          <HardDrive className="w-5 h-5" />
        </button>
        <button
          onClick={() => addNode('database')}
          title="Add Relational Database (PostgreSQL Multi-AZ)"
          className="p-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-purple-400 transition"
        >
          <Database className="w-5 h-5" />
        </button>
      </div>

      {/* React Flow Real-Time Architecture Canvas */}
      <div className="flex-1 w-full h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          onNodesDelete={onNodesDelete}
          onEdgesDelete={onEdgesDelete}
          nodeTypes={nodeTypes as any}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={2}
          defaultEdgeOptions={{
            animated: true,
            style: { stroke: '#38BDF8', strokeWidth: 2 }
          }}
          className="bg-slate-950"
        >
          <Background
            variant={BackgroundVariant.Dots}
            color="#334155"
            gap={24}
            size={1.5}
            className="opacity-50"
          />
          <Controls className="!bg-slate-900 !border !border-slate-800 !rounded-xl !shadow-xl !fill-slate-300" />
          <MiniMap
            nodeColor={(node: any) => node.data?.color || '#3B82F6'}
            maskColor="rgba(15, 23, 42, 0.85)"
            className="!bg-slate-900 !border !border-slate-800 !rounded-xl !shadow-xl overflow-hidden"
          />
        </ReactFlow>

        {/* Live Collaborator Cursors from CRDT Awareness */}
        {presences.map((p) => {
          if (!p.cursor) return null;
          return (
            <div
              key={p.id}
              style={{
                transform: `translate(${p.cursor.x}px, ${p.cursor.y}px)`,
                transition: 'transform 80ms ease-out'
              }}
              className="absolute pointer-events-none z-50 flex items-center gap-1.5"
            >
              <svg className="w-4 h-4 drop-shadow" style={{ color: p.color }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 3l7 18 3-7 7-3L3 3z" />
              </svg>
              <span
                style={{ borderColor: p.color }}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900/90 text-slate-200 border shadow-md whitespace-nowrap"
              >
                {p.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* AI Copilot Architecture Modal */}
      {isCopilotOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-sky-400" />
              <h3 className="font-bold text-slate-100 text-base">Generate System Topology DAG</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Describe your distributed system requirements in plain language. The AI Copilot dynamically computes a multi-tier Directed Acyclic Graph (DAG) with connected edges, protocol channels, and resilience tiers.
            </p>
            <textarea
              rows={3}
              value={copilotPrompt}
              onChange={(e) => setCopilotPrompt(e.target.value)}
              placeholder="e.g., Ultra-low latency payment gateway with Kafka partition logs, Redis caching, and PostgreSQL ledger..."
              className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 mb-4"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsCopilotOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                disabled={loadingCopilot}
                onClick={handleCopilotSubmit}
                className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs transition disabled:opacity-50"
              >
                {loadingCopilot ? 'Generating DAG...' : 'Generate & Place on Canvas'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

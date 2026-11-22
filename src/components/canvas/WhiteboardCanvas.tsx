'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CanvasShape, UserPresence, ShapeType } from '@/lib/types/canvas';
import { CollabDoc } from '@/lib/crdt/yjsDoc';
import { Layers, Database, Cpu, HardDrive, Network, Sparkles, Plus, Trash2, Download, Wifi, WifiOff } from 'lucide-react';

interface Props {
  roomId: string;
}

const PALETTE_COLORS: Record<ShapeType, string> = {
  service: '#10B981',
  database: '#8B5CF6',
  queue: '#F59E0B',
  cache: '#EF4444',
  gateway: '#3B82F6',
  arrow: '#94A3B8',
  note: '#FCD34D'
};

const USER_COLORS = ['#38BDF8', '#F472B6', '#34D399', '#FBBF24', '#A78BFA', '#FB7185'];

export default function WhiteboardCanvas({ roomId }: Props) {
  const [shapes, setShapes] = useState<CanvasShape[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [presences, setPresences] = useState<UserPresence[]>([]);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotPrompt, setCopilotPrompt] = useState('');
  const [loadingCopilot, setLoadingCopilot] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');

  const collabRef = useRef<CollabDoc | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const userId = useRef('eng-' + Math.random().toString(36).substring(2, 6));
  const userColor = useRef(USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]);

  // Dragging state
  const isDraggingShape = useRef(false);
  const draggedShapeId = useRef<string | null>(null);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const doc = new CollabDoc(roomId);
    collabRef.current = doc;

    // 1. Observe Shape Map changes from CRDT (local or remote)
    const updateShapesFromDoc = () => {
      setShapes(doc.getShapes());
    };
    doc.shapesMap.observe(updateShapesFromDoc);

    // 2. Observe Network Connection Status
    const unsubscribeStatus = doc.onStatusChange((status) => {
      setSyncStatus(status);
    });

    // 3. Setup Awareness (Live Cursor Sync across browser tabs & network)
    const awareness = doc.getAwareness();
    if (awareness) {
      awareness.setLocalStateField('user', {
        id: userId.current,
        name: 'Engineer (' + userId.current.substring(4) + ')',
        color: userColor.current,
        cursor: null
      });

      const handleAwarenessChange = () => {
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
      };

      awareness.on('change', handleAwarenessChange);
    }

    // 4. Seed initial default high-throughput architecture if canvas is empty
    setTimeout(() => {
      if (doc.getShapes().length === 0) {
        doc.setShape({ id: 'gw-1', type: 'gateway', x: 80, y: 180, width: 150, height: 80, label: 'API Gateway', description: 'Stateless Reverse Proxy & Rate Limiter', color: '#3B82F6' });
        doc.setShape({ id: 'srv-1', type: 'service', x: 300, y: 180, width: 170, height: 80, label: 'Payment Orchestrator', description: 'Spring Boot 3 / Saga Coordinator', color: '#10B981' });
        doc.setShape({ id: 'q-1', type: 'queue', x: 540, y: 180, width: 150, height: 80, label: 'Kafka Event Bus', description: 'payment-events Partitioned Topic', color: '#F59E0B' });
        doc.setShape({ id: 'db-1', type: 'database', x: 780, y: 180, width: 160, height: 80, label: 'PostgreSQL Ledger', description: 'ACID Transactional Balance Store', color: '#8B5CF6' });
      }
      setShapes(doc.getShapes());
    }, 400);

    return () => {
      unsubscribeStatus();
      doc.destroy();
    };
  }, [roomId]);

  // Handle cursor movement propagation
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current || !collabRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Handle Shape Dragging
    if (isDraggingShape.current && draggedShapeId.current) {
      const newX = Math.max(10, x - dragOffset.current.x);
      const newY = Math.max(10, y - dragOffset.current.y);
      collabRef.current.updateShapePosition(draggedShapeId.current, newX, newY);
    }

    // Broadcast cursor position via CRDT awareness
    const awareness = collabRef.current.getAwareness();
    if (awareness) {
      awareness.setLocalStateField('user', {
        id: userId.current,
        name: 'Engineer (' + userId.current.substring(4) + ')',
        color: userColor.current,
        cursor: { x, y }
      });
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingShape.current = false;
    draggedShapeId.current = null;
  }, []);

  const startDragShape = (e: React.MouseEvent, shape: CanvasShape) => {
    e.stopPropagation();
    setSelectedShapeId(shape.id);
    isDraggingShape.current = true;
    draggedShapeId.current = shape.id;
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const currentMouseX = e.clientX - rect.left;
      const currentMouseY = e.clientY - rect.top;
      dragOffset.current = {
        x: currentMouseX - shape.x,
        y: currentMouseY - shape.y
      };
    }
  };

  const addShape = (type: ShapeType) => {
    if (!collabRef.current) return;
    const id = 'shape-' + Math.random().toString(36).substring(2, 8);
    const newShape: CanvasShape = {
      id,
      type,
      x: 320 + Math.random() * 100,
      y: 200 + Math.random() * 80,
      width: type === 'service' ? 170 : 150,
      height: 80,
      label: type.charAt(0).toUpperCase() + type.slice(1) + ' Node',
      description: 'Distributed Microservice Node',
      color: PALETTE_COLORS[type] || '#10B981'
    };
    collabRef.current.setShape(newShape);
    setSelectedShapeId(id);
  };

  const deleteSelected = () => {
    if (!selectedShapeId || !collabRef.current) return;
    collabRef.current.removeShape(selectedShapeId);
    setSelectedShapeId(null);
  };

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
      if (data.shapes && collabRef.current) {
        data.shapes.forEach((s: CanvasShape) => {
          collabRef.current?.setShape(s);
        });
      }
      setIsCopilotOpen(false);
      setCopilotPrompt('');
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCopilot(false);
    }
  };

  return (
    <div
      onMouseUp={handleMouseUp}
      className="relative w-screen h-screen bg-slate-950 flex flex-col font-sans select-none overflow-hidden"
    >
      {/* Top Navbar */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <Layers className="w-6 h-6 text-sky-400" />
          <span className="font-bold text-lg text-slate-100 tracking-wide">
            CollabCraft <span className="text-sky-400 text-sm font-semibold">Studio</span>
          </span>
          <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-400 border border-slate-700">
            Room: {roomId}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1.5 shadow-sm shadow-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            CRDT Active &bull; WebRTC + Yjs WebSocket
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCopilotOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-sky-500 text-white font-medium text-xs shadow-lg shadow-sky-500/20 hover:opacity-95 transition"
          >
            <Sparkles className="w-4 h-4" /> AI Copilot Architect
          </button>
          {selectedShapeId && (
            <button
              onClick={deleteSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs hover:bg-rose-500/30 transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Node
            </button>
          )}
        </div>
      </header>

      {/* Floating Canvas Palette */}
      <div className="absolute left-6 top-20 z-20 flex flex-col gap-2 p-1.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur">
        <button onClick={() => addShape('service')} title="Add Microservice Node" className="p-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-emerald-400 transition">
          <Cpu className="w-5 h-5" />
        </button>
        <button onClick={() => addShape('database')} title="Add Database Node" className="p-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-purple-400 transition">
          <Database className="w-5 h-5" />
        </button>
        <button onClick={() => addShape('queue')} title="Add Message Queue (Kafka/RabbitMQ)" className="p-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-amber-400 transition">
          <Layers className="w-5 h-5" />
        </button>
        <button onClick={() => addShape('cache')} title="Add Redis Distributed Cache" className="p-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-rose-400 transition">
          <HardDrive className="w-5 h-5" />
        </button>
        <button onClick={() => addShape('gateway')} title="Add API Gateway / Reverse Proxy" className="p-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-sky-400 transition">
          <Network className="w-5 h-5" />
        </button>
      </div>

      {/* Interactive Whiteboard Canvas */}
      <div
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onClick={() => setSelectedShapeId(null)}
        className="relative flex-1 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] cursor-crosshair overflow-hidden"
      >
        {/* Render Canvas Shapes */}
        {shapes.map((s) => {
          const isSelected = s.id === selectedShapeId;
          return (
            <div
              key={s.id}
              onMouseDown={(e) => startDragShape(e, s)}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedShapeId(s.id);
              }}
              style={{
                transform: `translate(${s.x}px, ${s.y}px)`,
                width: `${s.width}px`,
                height: `${s.height}px`,
                borderColor: s.color,
              }}
              className={`absolute p-3 rounded-xl border-2 bg-slate-900/95 shadow-2xl backdrop-blur select-none cursor-move flex flex-col justify-between transition-shadow ${
                isSelected ? 'ring-2 ring-sky-400 shadow-sky-500/25 scale-[1.02]' : 'hover:border-slate-400'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs tracking-wide text-slate-100 truncate pr-1">{s.label}</span>
                  <span className="text-[9px] uppercase font-mono px-1 rounded bg-slate-800 text-slate-400 shrink-0">{s.type}</span>
                </div>
                {s.description && (
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{s.description}</p>
                )}
              </div>
              <div className="h-1 rounded-full w-full" style={{ backgroundColor: s.color }}></div>
            </div>
          );
        })}

        {/* Live Collaborator Cursors synced via CRDT Awareness */}
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
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-sky-400" />
              <h3 className="font-bold text-slate-100 text-base">Generate System Architecture</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Describe any distributed architecture in natural language (e.g., <em>&ldquo;High-throughput fintech payment gateway with Kafka, Redis idempotency, and PostgreSQL ledger&rdquo;</em> or <em>&ldquo;Enterprise Multi-Agent RAG cluster with vector caching&rdquo;</em>).
            </p>
            <textarea
              rows={3}
              value={copilotPrompt}
              onChange={(e) => setCopilotPrompt(e.target.value)}
              placeholder="e.g. Design a fault-tolerant payment transaction system with Kafka, Redis idempotency, and PostgreSQL ledger..."
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
                {loadingCopilot ? 'Generating Architecture...' : 'Generate & Place on Canvas'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CanvasShape, UserPresence, ShapeType } from '@/lib/types/canvas';
import { CollabDoc } from '@/lib/crdt/yjsDoc';
import { Layers, Database, Cpu, HardDrive, Network, Sparkles, Plus, Trash2, Download } from 'lucide-react';

interface Props {
  roomId: string;
}

export default function WhiteboardCanvas({ roomId }: Props) {
  const [shapes, setShapes] = useState<CanvasShape[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [presences, setPresences] = useState<UserPresence[]>([]);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotPrompt, setCopilotPrompt] = useState('');
  const [loadingCopilot, setLoadingCopilot] = useState(false);

  const collabRef = useRef<CollabDoc | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const userId = useRef('user-' + Math.random().toString(36).substring(2, 7));

  useEffect(() => {
    const doc = new CollabDoc(roomId);
    collabRef.current = doc;

    // Observe shapes map
    doc.shapesMap.observe(() => {
      setShapes(doc.getShapes());
    });

    // Observe presence map
    doc.presenceMap.observe(() => {
      setPresences(doc.getActivePresences());
    });

    // Initial setup with a high-throughput architecture default
    if (doc.getShapes().length === 0) {
      doc.setShape({ id: 's1', type: 'gateway', x: 80, y: 180, width: 140, height: 70, label: 'API Gateway', description: 'Stateless Reverse Proxy', color: '#3B82F6' });
      doc.setShape({ id: 's2', type: 'service', x: 290, y: 180, width: 160, height: 80, label: 'Payment Orchestrator', description: 'Spring Boot 3 / Saga', color: '#10B981' });
      doc.setShape({ id: 's3', type: 'queue', x: 520, y: 180, width: 140, height: 70, label: 'Kafka Event Bus', description: 'payment-events', color: '#F59E0B' });
      doc.setShape({ id: 's4', type: 'database', x: 730, y: 180, width: 150, height: 80, label: 'PostgreSQL Ledger', description: 'ACID Balance Store', color: '#8B5CF6' });
    }

    setShapes(doc.getShapes());
  }, [roomId]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!collabRef.current) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    collabRef.current.updateCursor(userId.current, 'Engineer (' + userId.current.substring(5) + ')', '#38BDF8', x, y);
  };

  const addShape = (type: ShapeType) => {
    if (!collabRef.current) return;
    const id = 'shape-' + Math.random().toString(36).substring(2, 8);
    const newShape: CanvasShape = {
      id,
      type,
      x: 350 + Math.random() * 80,
      y: 250 + Math.random() * 80,
      width: 150,
      height: 75,
      label: type.toUpperCase() + ' Component',
      description: 'Distributed Node',
      color: type === 'database' ? '#8B5CF6' : type === 'queue' ? '#F59E0B' : '#10B981'
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
    <div className="relative w-screen h-screen bg-slate-950 flex flex-col font-sans select-none overflow-hidden">
      {/* Top Navbar */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <Layers className="w-6 h-6 text-sky-400" />
          <span className="font-bold text-lg text-slate-100 tracking-wide">CollabCraft <span className="text-sky-400 text-sm font-semibold">Studio</span></span>
          <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-400 border border-slate-700">Room: {roomId}</span>
          <span className="px-2 py-0.5 rounded text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> CRDT Active
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
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          )}
        </div>
      </header>

      {/* Floating Canvas Toolbar */}
      <div className="absolute left-6 top-20 z-20 flex flex-col gap-2 p-1.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur">
        <button onClick={() => addShape('service')} title="Add Microservice" className="p-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-emerald-400 transition">
          <Cpu className="w-5 h-5" />
        </button>
        <button onClick={() => addShape('database')} title="Add Database" className="p-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-purple-400 transition">
          <Database className="w-5 h-5" />
        </button>
        <button onClick={() => addShape('queue')} title="Add Message Queue (Kafka/RabbitMQ)" className="p-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-amber-400 transition">
          <Layers className="w-5 h-5" />
        </button>
        <button onClick={() => addShape('cache')} title="Add Redis Cache" className="p-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-rose-400 transition">
          <HardDrive className="w-5 h-5" />
        </button>
        <button onClick={() => addShape('gateway')} title="Add Gateway / Proxy" className="p-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-sky-400 transition">
          <Network className="w-5 h-5" />
        </button>
      </div>

      {/* Infinite Canvas */}
      <div 
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        className="relative flex-1 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] cursor-crosshair overflow-hidden"
      >
        {/* Render shapes */}
        {shapes.map((s) => {
          const isSelected = s.id === selectedShapeId;
          return (
            <div
              key={s.id}
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
              className={`absolute p-3 rounded-xl border-2 bg-slate-900/90 shadow-2xl backdrop-blur transition-all cursor-move flex flex-col justify-between ${
                isSelected ? 'ring-2 ring-sky-400 shadow-sky-500/20 scale-[1.02]' : 'hover:border-slate-400'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs tracking-wide text-slate-100">{s.label}</span>
                  <span className="text-[10px] uppercase font-mono px-1 rounded bg-slate-800 text-slate-400">{s.type}</span>
                </div>
                {s.description && (
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{s.description}</p>
                )}
              </div>
              <div className="h-1 rounded-full w-full" style={{ backgroundColor: s.color }}></div>
            </div>
          );
        })}

        {/* Live Collaborator Cursors */}
        {presences.map((p) => {
          if (!p.cursor || p.id === userId.current) return null;
          return (
            <div
              key={p.id}
              style={{ transform: `translate(${p.cursor.x}px, ${p.cursor.y}px)` }}
              className="absolute pointer-events-none transition-transform duration-75 z-50 flex items-center gap-1.5"
            >
              <svg className="w-4 h-4 text-sky-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 3l7 18 3-7 7-3L3 3z" />
              </svg>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-950 border border-sky-800 text-sky-300 shadow">
                {p.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* AI Copilot Modal */}
      {isCopilotOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-sky-400" />
              <h3 className="font-bold text-slate-100 text-base">Generate System Architecture</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Describe the system you need (e.g., <em>"Distributed high-throughput banking payment ledger with Kafka and Redis"</em> or <em>"Enterprise Multi-Agent RAG with vector caching"</em>).
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

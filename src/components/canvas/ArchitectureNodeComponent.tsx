import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ArchitectureNodeData } from '@/lib/types/canvas';
import { Layers, Database, Cpu, HardDrive, Network, ShieldCheck } from 'lucide-react';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  gateway: <Network className="w-4 h-4 text-sky-400" />,
  service: <Cpu className="w-4 h-4 text-emerald-400" />,
  queue: <Layers className="w-4 h-4 text-amber-400" />,
  cache: <HardDrive className="w-4 h-4 text-rose-400" />,
  database: <Database className="w-4 h-4 text-purple-400" />,
  auth: <ShieldCheck className="w-4 h-4 text-cyan-400" />
};

export const ArchitectureNodeComponent = memo((props: any) => {
  const nodeData = (props.data || {}) as ArchitectureNodeData;
  const selected = !!props.selected;
  const icon = TYPE_ICONS[nodeData.type] || <Cpu className="w-4 h-4 text-slate-400" />;

  return (
    <div
      style={{ borderColor: nodeData.color || '#3B82F6' }}
      className={`relative min-w-[220px] max-w-[260px] rounded-xl border-2 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur transition-all duration-150 ${
        selected ? 'ring-2 ring-sky-400 shadow-sky-500/30 scale-[1.02]' : 'hover:border-slate-300'
      }`}
    >
      {/* React Flow Connection Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        className="!w-3 !h-3 !bg-sky-400 !border-2 !border-slate-900 !-left-2 hover:!scale-125 transition-transform"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="target-top"
        className="!w-3 !h-3 !bg-amber-400 !border-2 !border-slate-900 !-top-2 hover:!scale-125 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-slate-900 !-right-2 hover:!scale-125 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-bottom"
        className="!w-3 !h-3 !bg-purple-400 !border-2 !border-slate-900 !-bottom-2 hover:!scale-125 transition-transform"
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2 mb-2">
        <div className="flex items-center gap-2 truncate">
          <div className="p-1.5 rounded-lg bg-slate-800/80 shrink-0">{icon}</div>
          <span className="font-semibold text-xs text-slate-100 tracking-wide truncate">
            {nodeData.label || 'Node'}
          </span>
        </div>
        <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0 font-medium">
          {nodeData.type || 'service'}
        </span>
      </div>

      {/* Description */}
      {nodeData.description && (
        <p className="text-[11px] text-slate-400 leading-relaxed mb-2.5 line-clamp-2">
          {nodeData.description}
        </p>
      )}

      {/* Tech & Protocol Badges */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/60">
        {nodeData.technology && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 truncate">
            {nodeData.technology}
          </span>
        )}
        {nodeData.protocol && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-800/60">
            {nodeData.protocol}
          </span>
        )}
      </div>

      {/* Status Bar */}
      <div
        className="h-1 rounded-full w-full mt-2.5 opacity-90"
        style={{ backgroundColor: nodeData.color || '#3B82F6' }}
      />
    </div>
  );
});

ArchitectureNodeComponent.displayName = 'ArchitectureNodeComponent';

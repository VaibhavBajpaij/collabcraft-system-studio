import { Node, Edge } from '@xyflow/react';

export type ShapeType = 'service' | 'database' | 'queue' | 'gateway' | 'cache' | 'arrow' | 'note' | 'auth';

export interface ArchitectureNodeData {
  label: string;
  type: ShapeType;
  description: string;
  color: string;
  protocol?: string;
  technology?: string;
  [key: string]: unknown;
}

export type ArchitectureNode = Node<ArchitectureNodeData>;
export type ArchitectureEdge = Edge;

export interface UserPresence {
  id: string;
  name: string;
  color: string;
  cursor: { x: number; y: number } | null;
  lastActive: number;
}

export interface ArchitectureTemplateRequest {
  prompt: string;
}

export interface GeneratedArchitecture {
  title: string;
  description: string;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
}

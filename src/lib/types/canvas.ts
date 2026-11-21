export type ShapeType = 'service' | 'database' | 'queue' | 'gateway' | 'cache' | 'arrow' | 'note';

export interface CanvasShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  description?: string;
  color: string;
  targetId?: string; // For arrows/connectors
}

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
  shapes: CanvasShape[];
}

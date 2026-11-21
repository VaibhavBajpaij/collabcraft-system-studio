import { describe, it, expect } from 'vitest';
import { CollabDoc } from '../src/lib/crdt/yjsDoc';

describe('CollabDoc CRDT Operations', () => {
  it('should initialize an empty document and accept shape mutations', () => {
    const doc = new CollabDoc('test-room');
    expect(doc.getShapes().length).toBe(0);

    doc.setShape({
      id: 'shape-1',
      type: 'service',
      x: 100,
      y: 100,
      width: 150,
      height: 75,
      label: 'Auth Service',
      color: '#10B981'
    });

    const shapes = doc.getShapes();
    expect(shapes.length).toBe(1);
    expect(shapes[0].label).toBe('Auth Service');
  });

  it('should remove shapes by ID idempotently', () => {
    const doc = new CollabDoc('test-room');
    doc.setShape({
      id: 'shape-2',
      type: 'database',
      x: 200,
      y: 200,
      width: 150,
      height: 75,
      label: 'PostgreSQL',
      color: '#8B5CF6'
    });

    expect(doc.getShapes().length).toBe(1);
    doc.removeShape('shape-2');
    expect(doc.getShapes().length).toBe(0);
  });

  it('should track user presence and cursor coordinates', () => {
    const doc = new CollabDoc('test-room');
    doc.updateCursor('user-101', 'Alice', '#38BDF8', 350, 420);

    const presences = doc.getActivePresences();
    expect(presences.length).toBe(1);
    expect(presences[0].cursor).toEqual({ x: 350, y: 420 });
    expect(presences[0].name).toBe('Alice');
  });
});

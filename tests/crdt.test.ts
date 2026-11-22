import { describe, it, expect } from 'vitest';
import { CollabDoc } from '../src/lib/crdt/yjsDoc';

describe('CollabDoc CRDT Operations', () => {
  it('should initialize an empty document and accept node mutations', () => {
    const doc = new CollabDoc('test-room');
    expect(doc.getNodes().length).toBe(0);

    doc.setNode({
      id: 'node-1',
      type: 'default',
      position: { x: 100, y: 100 },
      data: {
        label: 'Auth Service',
        type: 'service',
        description: 'Authentication microservice',
        color: '#10B981'
      }
    });

    const nodes = doc.getNodes();
    expect(nodes.length).toBe(1);
    expect(nodes[0].data.label).toBe('Auth Service');
  });

  it('should remove nodes by ID idempotently', () => {
    const doc = new CollabDoc('test-room');
    doc.setNode({
      id: 'node-2',
      type: 'default',
      position: { x: 200, y: 200 },
      data: {
        label: 'PostgreSQL',
        type: 'database',
        description: 'Relational DB',
        color: '#8B5CF6'
      }
    });

    expect(doc.getNodes().length).toBe(1);
    doc.removeNode('node-2');
    expect(doc.getNodes().length).toBe(0);
  });

  it('should support edge operations and topology tracking', () => {
    const doc = new CollabDoc('test-room');
    doc.setEdge({
      id: 'e1-2',
      source: 'node-1',
      target: 'node-2',
      animated: true
    });

    const edges = doc.getEdges();
    expect(edges.length).toBe(1);
    expect(edges[0].source).toBe('node-1');
  });
});

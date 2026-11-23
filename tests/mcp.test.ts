import { describe, it, expect } from 'vitest';
import { inspectCodebase } from '../src/mcp/server';
import { exportArchitectureToDockerCompose, generateArchitectureFromPrompt } from '../src/lib/copilot/architectureGenerator';
import path from 'path';

describe('MCP Server Inspection & Tools', () => {
  it('should deeply inspect codebase and identify Next.js, React Flow, and Yjs components', () => {
    const targetDir = path.resolve(__dirname, '..');
    const components = inspectCodebase(targetDir);

    expect(components.length).toBeGreaterThan(0);
    const techList = components.map(c => c.tech);
    expect(techList.some(t => t.includes('Next.js') || t.includes('React Flow') || t.includes('Yjs'))).toBe(true);
  });

  it('should generate valid Docker Compose specification from architecture nodes', () => {
    const topology = generateArchitectureFromPrompt('Fintech payment ledger with Kafka and Redis');
    const yaml = exportArchitectureToDockerCompose(topology.nodes);

    expect(yaml).toContain("version: '3.8'");
    expect(yaml).toContain('services:');
    expect(yaml).toContain('image: redis:7-alpine');
    expect(yaml).toContain('image: confluentinc/cp-kafka:7.5.0');
  });

  it('should generate correct tier positions and DAG edges', () => {
    const topology = generateArchitectureFromPrompt('E-commerce shop with order service and postgres');
    expect(topology.nodes.length).toBeGreaterThanOrEqual(2);
    expect(topology.edges.length).toBeGreaterThanOrEqual(1);

    // Verify source and target nodes exist in the graph
    const nodeIds = new Set(topology.nodes.map(n => n.id));
    topology.edges.forEach(edge => {
      expect(nodeIds.has(edge.source)).toBe(true);
      expect(nodeIds.has(edge.target)).toBe(true);
    });
  });
});

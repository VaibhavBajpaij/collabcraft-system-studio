import { describe, it, expect } from 'vitest';
import path from 'path';
import {
  generateArchitectureFromPrompt,
  buildArchitectureFromDiscoveredComponents,
  exportArchitectureToDockerCompose,
  DiscoveredComponent
} from '../src/lib/copilot/architectureGenerator';
import { inspectCodebase, detectArchitectureDrift } from '../src/mcp/server';

describe('Architecture Generator & Heuristics', () => {
  it('Fix P1.9: should NOT over-match "ai" on "email", "domain", or "tailwind"', () => {
    const arch = generateArchitectureFromPrompt('Notification system for email dispatch and domain routing with tailwind UI');
    
    // Must NOT contain LangGraph AI Agent or Qdrant Vector DB
    const hasAiAgent = arch.nodes.some(
      n => n.data.label.toLowerCase().includes('reasoning agent') || n.data.label.toLowerCase().includes('langgraph')
    );
    const hasVectorDb = arch.nodes.some(n => n.data.label.toLowerCase().includes('vector'));

    expect(hasAiAgent).toBe(false);
    expect(hasVectorDb).toBe(false);

    // Must correctly detect Notification service
    expect(arch.nodes.some(n => n.data.label.toLowerCase().includes('notification'))).toBe(true);
  });

  it('should correctly match AI keywords when explicitly prompted with RAG or LLM', () => {
    const arch = generateArchitectureFromPrompt('Enterprise RAG pipeline with LLM reasoning agents and vector search');
    
    expect(arch.nodes.some(n => n.data.label.toLowerCase().includes('ai reasoning'))).toBe(true);
    expect(arch.nodes.some(n => n.data.label.toLowerCase().includes('vector'))).toBe(true);
  });

  it('Fix P0.1: buildArchitectureFromDiscoveredComponents should preserve detected types and tech', () => {
    const detected: DiscoveredComponent[] = [
      { name: 'Yjs CRDT Collaboration Relay', type: 'queue', tech: 'Yjs WebSocket Server' },
      { name: 'Redis Cache Tier', type: 'cache', tech: 'Redis 7 Cluster' },
      { name: 'PostgreSQL Database', type: 'database', tech: 'Postgres 16 Multi-AZ' },
      { name: 'Web Application (Next.js)', type: 'service', tech: 'Next.js 15 App Router' }
    ];

    const graph = buildArchitectureFromDiscoveredComponents(detected, 'test-repo');

    expect(graph.nodes.length).toBe(4);
    
    // Queue must exist and retain 'queue' type
    const queueNode = graph.nodes.find(n => n.data.label === 'Yjs CRDT Collaboration Relay');
    expect(queueNode).toBeDefined();
    expect(queueNode?.data.type).toBe('queue');
    expect(queueNode?.data.technology).toBe('Yjs WebSocket Server');

    // Edges must connect service to queue, cache, and db
    expect(graph.edges.length).toBeGreaterThanOrEqual(3);
    const edgeTargets = graph.edges.map(e => e.target);
    expect(edgeTargets).toContain(queueNode?.id);
  });

  it('Fix P0.3: exportArchitectureToDockerCompose should emit runnable Compose spec with networks and healthchecks', () => {
    const arch = generateArchitectureFromPrompt('Payment gateway with Kafka and Redis and Postgres');
    const compose = exportArchitectureToDockerCompose(arch.nodes);

    // No obsolete version 3.8
    expect(compose).not.toContain("version: '3.8'");
    expect(compose).toContain('name: collabcraft-generated-stack');
    expect(compose).toContain('services:');

    // Healthchecks present
    expect(compose).toContain('healthcheck:');
    expect(compose).toContain('redis-cli');
    expect(compose).toContain('networks:');
    expect(compose).toContain('app-network:');
    expect(compose).toContain('volumes:');

    // Conditional depends_on
    expect(compose).toContain('condition: service_healthy');
  });
});

describe('MCP Codebase Inspection & Drift Audit', () => {
  it('should deeply inspect codebase and identify actual repository components', () => {
    const targetDir = path.resolve(__dirname, '..');
    const components = inspectCodebase(targetDir);

    expect(components.length).toBeGreaterThan(0);
    const names = components.map(c => c.name);
    expect(names.some(n => n.includes('Next.js') || n.includes('React Flow') || n.includes('Yjs'))).toBe(true);
  });

  it('Fix P0.4: detectArchitectureDrift should perform concrete checks on tsconfig, compose, and test suite', () => {
    const targetDir = path.resolve(__dirname, '..');
    const findings = detectArchitectureDrift(targetDir);

    expect(findings.length).toBeGreaterThan(0);
    const titles = findings.map(f => f.title);
    
    // Must contain concrete check categories
    expect(titles.some(t => t.includes('Type Safety'))).toBe(true);
    expect(titles.some(t => t.includes('Infrastructure') || t.includes('Compose'))).toBe(true);
    expect(titles.some(t => t.includes('Regression Harness') || t.includes('Test'))).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import { generateArchitectureFromPrompt } from '../src/lib/copilot/architectureGenerator';

describe('AI Architecture Generator', () => {
  it('should generate distributed payment ledger architecture when prompted with payment keywords', () => {
    const arch = generateArchitectureFromPrompt('Design a payment ledger with Kafka and Redis');
    expect(arch.title.toLowerCase()).toContain('distributed');
    expect(arch.nodes.some(n => n.data.label.includes('Kafka'))).toBe(true);
    expect(arch.nodes.some(n => n.data.label.includes('Redis'))).toBe(true);
  });

  it('should generate RAG architecture when prompted with AI keywords', () => {
    const arch = generateArchitectureFromPrompt('Build an enterprise RAG system with vector search');
    expect(arch.nodes.some(n => n.data.label.includes('Vector') || n.data.label.includes('Embedding'))).toBe(true);
  });
});

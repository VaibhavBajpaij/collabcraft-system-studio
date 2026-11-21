import { describe, it, expect } from 'vitest';
import { generateArchitectureFromPrompt } from '../src/lib/copilot/architectureGenerator';

describe('AI Architecture Generator', () => {
  it('should generate distributed payment ledger architecture when prompted with payment keywords', () => {
    const arch = generateArchitectureFromPrompt('Design a payment ledger with Kafka and Redis');
    expect(arch.title).toContain('Payment Ledger');
    expect(arch.shapes.some(s => s.label.includes('Kafka'))).toBe(true);
    expect(arch.shapes.some(s => s.label.includes('Redis'))).toBe(true);
  });

  it('should generate RAG architecture when prompted with AI keywords', () => {
    const arch = generateArchitectureFromPrompt('Build an enterprise RAG system with vector search');
    expect(arch.title).toContain('RAG');
    expect(arch.shapes.some(s => s.label.includes('Qdrant'))).toBe(true);
  });
});

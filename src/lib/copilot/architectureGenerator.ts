import { CanvasShape, GeneratedArchitecture } from '../types/canvas';

export function generateArchitectureFromPrompt(prompt: string): GeneratedArchitecture {
  const p = prompt.toLowerCase();
  const shapes: CanvasShape[] = [];

  if (p.includes('payment') || p.includes('banking') || p.includes('ledger')) {
    shapes.push(
      { id: 'gw-1', type: 'gateway', x: 100, y: 200, width: 140, height: 70, label: 'API Gateway', description: 'JWT & Rate Limiter', color: '#3B82F6' },
      { id: 'srv-1', type: 'service', x: 320, y: 150, width: 160, height: 80, label: 'Payment Orchestrator', description: 'Saga Coordinator', color: '#10B981' },
      { id: 'q-1', type: 'queue', x: 550, y: 150, width: 140, height: 70, label: 'Apache Kafka', description: 'payment-events topic', color: '#F59E0B' },
      { id: 'c-1', type: 'cache', x: 320, y: 300, width: 140, height: 70, label: 'Redis Idempotency', description: 'Atomic SETNX Locks', color: '#EF4444' },
      { id: 'db-1', type: 'database', x: 760, y: 150, width: 150, height: 80, label: 'PostgreSQL Ledger', description: 'Optimistic Locking', color: '#8B5CF6' }
    );
    return {
      title: 'Distributed Event-Driven Payment Ledger Architecture',
      description: 'Idempotent, highly available payment workflow using Saga pattern, Kafka event bus, and Redis locking.',
      shapes
    };
  }

  if (p.includes('ai') || p.includes('rag') || p.includes('llm')) {
    shapes.push(
      { id: 'gw-1', type: 'gateway', x: 100, y: 200, width: 140, height: 70, label: 'API Gateway', description: 'FastAPI Router', color: '#3B82F6' },
      { id: 'srv-1', type: 'service', x: 320, y: 150, width: 160, height: 80, label: 'LangGraph Router', description: 'Intent Agent', color: '#10B981' },
      { id: 'c-1', type: 'cache', x: 320, y: 300, width: 140, height: 70, label: 'Redis Semantic Cache', description: 'Vector similarity cache', color: '#EF4444' },
      { id: 'db-1', type: 'database', x: 550, y: 150, width: 150, height: 80, label: 'Qdrant Vector DB', description: 'Embedding indices', color: '#8B5CF6' },
      { id: 'srv-2', type: 'service', x: 760, y: 150, width: 150, height: 80, label: 'Inference Engine', description: 'LLM API Gateway', color: '#06B6D4' }
    );
    return {
      title: 'Production Multi-Agent RAG with Semantic Caching',
      description: 'Agentic query routing with Qdrant vector retrieval and Redis latency caching.',
      shapes
    };
  }

  // Default Microservices System Template
  shapes.push(
    { id: 'gw-1', type: 'gateway', x: 100, y: 200, width: 140, height: 70, label: 'Reverse Proxy', description: 'NGINX / Cloudflare', color: '#3B82F6' },
    { id: 'srv-1', type: 'service', x: 320, y: 120, width: 150, height: 75, label: 'Auth Service', description: 'OAuth2 / JWT', color: '#10B981' },
    { id: 'srv-2', type: 'service', x: 320, y: 260, width: 150, height: 75, label: 'Core Business API', description: 'Next.js / Node.js', color: '#10B981' },
    { id: 'db-1', type: 'database', x: 550, y: 260, width: 150, height: 75, label: 'Primary DB', description: 'PostgreSQL ACID', color: '#8B5CF6' },
    { id: 'c-1', type: 'cache', x: 550, y: 120, width: 150, height: 75, label: 'Redis Cluster', description: 'Session & Cache', color: '#EF4444' }
  );

  return {
    title: 'Scalable Microservices Web Architecture',
    description: 'Decoupled services with dedicated caching and transactional database layers.',
    shapes
  };
}

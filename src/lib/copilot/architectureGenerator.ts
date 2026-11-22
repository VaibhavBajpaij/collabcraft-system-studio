import { CanvasShape, GeneratedArchitecture, ShapeType } from '../types/canvas';

interface ExtractedComponent {
  id: string;
  type: ShapeType;
  label: string;
  description: string;
  color: string;
  tier: 1 | 2 | 3 | 4; // 1: Ingress, 2: Logic/Service, 3: Queue/Cache, 4: Storage
}

export function generateArchitectureFromPrompt(prompt: string): GeneratedArchitecture {
  const p = prompt.toLowerCase().trim();
  const rawId = () => 'node-' + Math.random().toString(36).substring(2, 7);

  const components: ExtractedComponent[] = [];

  // 1. Ingress & Edge Analysis
  if (p.includes('gateway') || p.includes('reverse proxy') || p.includes('nginx') || p.includes('ingress') || p.includes('cloudflare') || p.includes('kong')) {
    components.push({
      id: rawId(),
      type: 'gateway',
      label: p.includes('kong') ? 'Kong Gateway' : p.includes('nginx') ? 'NGINX Reverse Proxy' : 'API Gateway & WAF',
      description: 'Rate limiting, TLS termination & JWT routing',
      color: '#3B82F6',
      tier: 1
    });
  } else {
    // Default edge gateway for any microservices / cloud prompt
    components.push({
      id: rawId(),
      type: 'gateway',
      label: 'Edge API Gateway',
      description: 'Stateless Reverse Proxy & Rate Limiter',
      color: '#3B82F6',
      tier: 1
    });
  }

  // 2. Auth & Identity
  if (p.includes('auth') || p.includes('jwt') || p.includes('oauth') || p.includes('user') || p.includes('login')) {
    components.push({
      id: rawId(),
      type: 'service',
      label: 'Auth & Identity Service',
      description: 'OAuth2.0 / OIDC / Session Management',
      color: '#10B981',
      tier: 2
    });
  }

  // 3. Domain Core Business Services
  if (p.includes('payment') || p.includes('stripe') || p.includes('banking') || p.includes('checkout') || p.includes('transaction')) {
    components.push({
      id: rawId(),
      type: 'service',
      label: 'Payment Orchestrator',
      description: 'Saga Coordinator & Idempotent Processing',
      color: '#10B981',
      tier: 2
    });
  }

  if (p.includes('order') || p.includes('e-commerce') || p.includes('shop') || p.includes('cart')) {
    components.push({
      id: rawId(),
      type: 'service',
      label: 'Order Management Service',
      description: 'Inventory reservation & Order state machine',
      color: '#10B981',
      tier: 2
    });
  }

  if (p.includes('ai') || p.includes('rag') || p.includes('llm') || p.includes('agent') || p.includes('langgraph')) {
    components.push({
      id: rawId(),
      type: 'service',
      label: 'LangGraph Intent Orchestrator',
      description: 'Multi-agent supervisor & reasoning graph',
      color: '#06B6D4',
      tier: 2
    });
    components.push({
      id: rawId(),
      type: 'service',
      label: 'LLM Inference Gateway',
      description: 'Dual-stream fallback & Token budgeter',
      color: '#06B6D4',
      tier: 2
    });
  }

  if (p.includes('notification') || p.includes('email') || p.includes('sms') || p.includes('push')) {
    components.push({
      id: rawId(),
      type: 'service',
      label: 'Notification Dispatcher',
      description: 'Async push, email & webhook broadcaster',
      color: '#10B981',
      tier: 2
    });
  }

  if (p.includes('search') || p.includes('elastic') || p.includes('query')) {
    components.push({
      id: rawId(),
      type: 'service',
      label: 'Search & Retrieval Indexer',
      description: 'Full-text query & Vector nearest-neighbor',
      color: '#10B981',
      tier: 2
    });
  }

  // Ensure at least one primary business service exists if none matched
  if (!components.some(c => c.tier === 2)) {
    components.push({
      id: rawId(),
      type: 'service',
      label: 'Core Domain Microservice',
      description: 'Event-driven business domain logic',
      color: '#10B981',
      tier: 2
    });
  }

  // 4. Queues & Event Streaming
  if (p.includes('kafka') || p.includes('event') || p.includes('stream') || p.includes('queue') || p.includes('rabbitmq') || p.includes('pubsub') || p.includes('sqs')) {
    const queueLabel = p.includes('kafka') ? 'Apache Kafka Broker' : p.includes('rabbitmq') ? 'RabbitMQ Exchange' : 'Distributed Event Bus';
    components.push({
      id: rawId(),
      type: 'queue',
      label: queueLabel,
      description: 'Partitioned event log & Dead Letter Queue (DLQ)',
      color: '#F59E0B',
      tier: 3
    });
  }

  // 5. Caching & Fast Lookup
  if (p.includes('redis') || p.includes('cache') || p.includes('memcached') || p.includes('latency') || p.includes('session')) {
    const cacheLabel = (p.includes('ai') || p.includes('rag')) ? 'Redis Semantic Cache' : 'Redis Distributed Cache';
    components.push({
      id: rawId(),
      type: 'cache',
      label: cacheLabel,
      description: 'Sub-millisecond read cache & distributed locks',
      color: '#EF4444',
      tier: 3
    });
  }

  // 6. Persistence & Storage
  if (p.includes('vector') || p.includes('qdrant') || p.includes('pinecone') || p.includes('chroma') || p.includes('ai') || p.includes('rag')) {
    components.push({
      id: rawId(),
      type: 'database',
      label: 'Qdrant / Pinecone Vector DB',
      description: 'HNSW vector index & Cosine similarity embeddings',
      color: '#8B5CF6',
      tier: 4
    });
  }

  if (p.includes('postgres') || p.includes('sql') || p.includes('acid') || p.includes('relational') || p.includes('payment') || p.includes('banking') || p.includes('order')) {
    components.push({
      id: rawId(),
      type: 'database',
      label: 'PostgreSQL Primary DB',
      description: 'ACID transactions, Read Replica & WAL CDC',
      color: '#8B5CF6',
      tier: 4
    });
  } else if (p.includes('mongo') || p.includes('nosql') || p.includes('dynamo')) {
    components.push({
      id: rawId(),
      type: 'database',
      label: 'Distributed NoSQL Store',
      description: 'High-throughput document partitioning',
      color: '#8B5CF6',
      tier: 4
    });
  } else if (!components.some(c => c.tier === 4)) {
    components.push({
      id: rawId(),
      type: 'database',
      label: 'Distributed Database Cluster',
      description: 'Multi-AZ replication with automated failover',
      color: '#8B5CF6',
      tier: 4
    });
  }

  // 7. Topological Coordinate Calculation
  // Tier X coordinates: Tier 1: 80px, Tier 2: 300px, Tier 3: 540px, Tier 4: 780px
  const tierX: Record<number, number> = { 1: 80, 2: 300, 3: 540, 4: 780 };
  const tierCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };

  const shapes: CanvasShape[] = components.map((comp) => {
    const tier = comp.tier;
    const indexInTier = tierCounts[tier]++;
    const x = tierX[tier];
    const y = 140 + indexInTier * 125;

    return {
      id: comp.id,
      type: comp.type,
      x,
      y,
      width: comp.type === 'service' ? 170 : 150,
      height: 80,
      label: comp.label,
      description: comp.description,
      color: comp.color
    };
  });

  const titleWords = prompt.split(' ').slice(0, 5).join(' ');
  const capitalizedTitle = titleWords.charAt(0).toUpperCase() + titleWords.slice(1);

  return {
    title: `${capitalizedTitle} — Distributed System Architecture`,
    description: `Auto-generated multi-tier topology featuring decoupled edge ingress, independent service layers, asynchronous event streaming, and resilient persistence storage.`,
    shapes
  };
}

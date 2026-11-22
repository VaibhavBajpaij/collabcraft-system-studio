import { ArchitectureNode, ArchitectureEdge, GeneratedArchitecture, ShapeType } from '../types/canvas';

interface ExtractedComponent {
  id: string;
  type: ShapeType;
  label: string;
  description: string;
  color: string;
  protocol: string;
  technology: string;
  tier: 1 | 2 | 3 | 4; // 1: Ingress, 2: Logic/Service, 3: Queue/Cache, 4: Storage
}

export function generateArchitectureFromPrompt(prompt: string): GeneratedArchitecture {
  const p = prompt.toLowerCase().trim();
  const rawId = () => 'node-' + Math.random().toString(36).substring(2, 7);

  const components: ExtractedComponent[] = [];

  // 1. Ingress & Edge Analysis
  if (p.includes('kong') || p.includes('nginx') || p.includes('ingress') || p.includes('gateway') || p.includes('proxy') || p.includes('envoy')) {
    components.push({
      id: 'gw-ingress',
      type: 'gateway',
      label: p.includes('kong') ? 'Kong Gateway' : p.includes('nginx') ? 'NGINX Reverse Proxy' : 'Edge API Gateway',
      description: 'TLS Termination, JWT validation & Dynamic Rate Limiting',
      color: '#3B82F6',
      protocol: 'HTTPS / HTTP/2',
      technology: 'Spring Cloud Gateway / Netty',
      tier: 1
    });
  } else {
    components.push({
      id: 'gw-ingress',
      type: 'gateway',
      label: 'Edge API Gateway',
      description: 'TLS Termination, JWT validation & Token-Bucket Rate Limiter',
      color: '#3B82F6',
      protocol: 'HTTPS / HTTP/2',
      technology: 'Spring Cloud Gateway / Netty',
      tier: 1
    });
  }

  // 2. Auth & Identity
  if (p.includes('auth') || p.includes('jwt') || p.includes('oauth') || p.includes('user') || p.includes('security')) {
    components.push({
      id: 'srv-auth',
      type: 'auth',
      label: 'Auth & Identity Service',
      description: 'OAuth2 / OIDC token issuance & RBAC policies',
      color: '#06B6D4',
      protocol: 'gRPC / Mutual TLS',
      technology: 'Go / Keycloak',
      tier: 2
    });
  }

  // 3. Domain Core Business Services
  if (p.includes('payment') || p.includes('fintech') || p.includes('banking') || p.includes('checkout') || p.includes('transaction')) {
    components.push({
      id: 'srv-payment',
      type: 'service',
      label: 'Payment Orchestrator',
      description: 'Saga Coordinator & Idempotent Processing',
      color: '#10B981',
      protocol: 'gRPC / Event-Driven',
      technology: 'Spring Boot 3 / Java 21',
      tier: 2
    });
  }

  if (p.includes('order') || p.includes('e-commerce') || p.includes('shop') || p.includes('cart') || p.includes('inventory')) {
    components.push({
      id: 'srv-order',
      type: 'service',
      label: 'Order Management Service',
      description: 'Inventory reservations & state machine transitions',
      color: '#10B981',
      protocol: 'gRPC / REST',
      technology: 'Node.js / TypeScript',
      tier: 2
    });
  }

  if (p.includes('ai') || p.includes('rag') || p.includes('llm') || p.includes('agent') || p.includes('langgraph')) {
    components.push({
      id: 'srv-ai-agent',
      type: 'service',
      label: 'LangGraph Reasoning Agent',
      description: 'Multi-agent supervisor DAG & dynamic tool dispatch',
      color: '#06B6D4',
      protocol: 'HTTP/2 Streaming / SSE',
      technology: 'Python / FastAPI / LangGraph',
      tier: 2
    });
  }

  if (p.includes('notification') || p.includes('email') || p.includes('sms') || p.includes('webhook')) {
    components.push({
      id: 'srv-notification',
      type: 'service',
      label: 'Notification Dispatcher',
      description: 'High-throughput push, email & webhook broadcasting',
      color: '#10B981',
      protocol: 'AMQP Consumer',
      technology: 'Go / Rust',
      tier: 2
    });
  }

  // Ensure at least one primary business service exists if none matched
  if (!components.some(c => c.tier === 2)) {
    components.push({
      id: 'srv-core',
      type: 'service',
      label: 'Core Domain Microservice',
      description: 'High-concurrency business logic and domain entities',
      color: '#10B981',
      protocol: 'gRPC / REST',
      technology: 'Java 21 / Spring Boot 3',
      tier: 2
    });
  }

  // 4. Queues & Event Streaming
  if (p.includes('kafka') || p.includes('event') || p.includes('stream') || p.includes('queue') || p.includes('rabbitmq') || p.includes('pubsub')) {
    const queueLabel = p.includes('rabbitmq') ? 'RabbitMQ Exchange' : 'Apache Kafka Broker';
    components.push({
      id: 'q-broker',
      type: 'queue',
      label: queueLabel,
      description: 'Partitioned event log & Dead Letter Queue (DLQ)',
      color: '#F59E0B',
      protocol: 'TCP / Binary Wire Protocol',
      technology: p.includes('rabbitmq') ? 'RabbitMQ 3.12' : 'Apache Kafka 3.6 (KRaft)',
      tier: 3
    });
  }

  // 5. Caching & Fast Lookup
  if (p.includes('redis') || p.includes('cache') || p.includes('latency') || p.includes('session') || p.includes('memcached')) {
    components.push({
      id: 'cache-redis',
      type: 'cache',
      label: 'Redis Distributed Cache',
      description: 'Sub-millisecond read-through cache & Redlock locks',
      color: '#EF4444',
      protocol: 'RESP3 Protocol',
      technology: 'Redis 7.2 Cluster',
      tier: 3
    });
  }

  // 6. Persistence & Storage
  if (p.includes('vector') || p.includes('qdrant') || p.includes('pinecone') || p.includes('chroma') || p.includes('embedding') || p.includes('ai')) {
    components.push({
      id: 'db-vector',
      type: 'database',
      label: 'Qdrant Vector DB',
      description: 'HNSW vector indexing & Cosine distance metrics',
      color: '#8B5CF6',
      protocol: 'gRPC / REST',
      technology: 'Qdrant Cluster (v1.8)',
      tier: 4
    });
  }

  if (p.includes('postgres') || p.includes('sql') || p.includes('acid') || p.includes('relational') || p.includes('payment') || p.includes('banking') || p.includes('order')) {
    components.push({
      id: 'db-postgres',
      type: 'database',
      label: 'PostgreSQL Primary DB',
      description: 'ACID transactional store with Read Replicas & WAL CDC',
      color: '#8B5CF6',
      protocol: 'PostgreSQL Wire v3',
      technology: 'PostgreSQL 16 Multi-AZ',
      tier: 4
    });
  } else if (p.includes('mongo') || p.includes('nosql') || p.includes('dynamo')) {
    components.push({
      id: 'db-nosql',
      type: 'database',
      label: 'Distributed NoSQL Store',
      description: 'High-throughput partition-tolerant document storage',
      color: '#8B5CF6',
      protocol: 'MongoDB Wire Protocol',
      technology: 'MongoDB 7 Sharded Cluster',
      tier: 4
    });
  } else if (!components.some(c => c.tier === 4)) {
    components.push({
      id: 'db-primary',
      type: 'database',
      label: 'Distributed Database Cluster',
      description: 'Multi-AZ replication with automated failover and backups',
      color: '#8B5CF6',
      protocol: 'TCP / TLS',
      technology: 'PostgreSQL 16 Enterprise',
      tier: 4
    });
  }

  // 7. Topological Node Calculation
  // Tier positions: Tier 1: x=60, Tier 2: x=340, Tier 3: x=640, Tier 4: x=940
  const tierX: Record<number, number> = { 1: 60, 2: 340, 3: 640, 4: 940 };
  const tierCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };

  const nodes: ArchitectureNode[] = components.map((comp) => {
    const tier = comp.tier;
    const indexInTier = tierCounts[tier]++;
    const x = tierX[tier];
    const y = 80 + indexInTier * 160;

    return {
      id: comp.id,
      type: 'architectureNode',
      position: { x, y },
      data: {
        label: comp.label,
        type: comp.type,
        description: comp.description,
        color: comp.color,
        protocol: comp.protocol,
        technology: comp.technology
      }
    };
  });

  // 8. Generate Directed Acyclic Graph (DAG) Edges
  const edges: ArchitectureEdge[] = [];
  const ingressNode = nodes.find(n => n.data.type === 'gateway');
  const serviceNodes = nodes.filter(n => n.data.type === 'service' || n.data.type === 'auth');
  const cacheNode = nodes.find(n => n.data.type === 'cache');
  const queueNode = nodes.find(n => n.data.type === 'queue');
  const dbNodes = nodes.filter(n => n.data.type === 'database');

  // Ingress -> Services
  if (ingressNode) {
    serviceNodes.forEach((srv) => {
      edges.push({
        id: `e-${ingressNode.id}-${srv.id}`,
        source: ingressNode.id,
        target: srv.id,
        animated: true,
        style: { stroke: '#38BDF8', strokeWidth: 2 }
      });
    });
  }

  // Services -> Cache / Queue / DB
  serviceNodes.forEach((srv) => {
    if (cacheNode) {
      edges.push({
        id: `e-${srv.id}-${cacheNode.id}`,
        source: srv.id,
        target: cacheNode.id,
        style: { stroke: '#EF4444', strokeWidth: 2, strokeDasharray: '5,5' }
      });
    }

    if (queueNode) {
      edges.push({
        id: `e-${srv.id}-${queueNode.id}`,
        source: srv.id,
        target: queueNode.id,
        animated: true,
        style: { stroke: '#F59E0B', strokeWidth: 2 }
      });
    }

    dbNodes.forEach((db) => {
      edges.push({
        id: `e-${srv.id}-${db.id}`,
        source: srv.id,
        target: db.id,
        style: { stroke: '#8B5CF6', strokeWidth: 2 }
      });
    });
  });

  // Queue -> DB (Event ingestion worker)
  if (queueNode && dbNodes.length > 0) {
    edges.push({
      id: `e-${queueNode.id}-${dbNodes[0].id}`,
      source: queueNode.id,
      target: dbNodes[0].id,
      animated: true,
      style: { stroke: '#F59E0B', strokeWidth: 2 }
    });
  }

  const titleWords = prompt.split(' ').slice(0, 5).join(' ');
  const capitalizedTitle = titleWords.charAt(0).toUpperCase() + titleWords.slice(1);

  return {
    title: `${capitalizedTitle} — Distributed System Topology`,
    description: `Auto-generated multi-tier DAG with edge routing, message-bus ingestion, low-latency caching, and ACID persistence.`,
    nodes,
    edges
  };
}

export function exportArchitectureToDockerCompose(nodes: ArchitectureNode[]): string {
  let compose = `version: '3.8'\n\nservices:\n`;
  nodes.forEach((n) => {
    const slug = n.id.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    compose += `  ${slug}:\n`;
    compose += `    container_name: ${slug}\n`;
    if (n.data.type === 'gateway') {
      compose += `    image: nginx:alpine\n    ports:\n      - "80:80"\n      - "443:443"\n`;
    } else if (n.data.type === 'cache') {
      compose += `    image: redis:7-alpine\n    ports:\n      - "6379:6379"\n`;
    } else if (n.data.type === 'queue') {
      compose += `    image: confluentinc/cp-kafka:7.5.0\n    ports:\n      - "9092:9092"\n`;
    } else if (n.data.type === 'database') {
      compose += `    image: postgres:16-alpine\n    environment:\n      POSTGRES_DB: app_db\n      POSTGRES_PASSWORD: secret\n    ports:\n      - "5432:5432"\n`;
    } else {
      compose += `    build:\n      context: ./${slug}\n    environment:\n      PORT: 8080\n    ports:\n      - "8080"\n`;
    }
    compose += `    restart: unless-stopped\n\n`;
  });
  return compose;
}

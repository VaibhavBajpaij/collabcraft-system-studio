import { ArchitectureNode, ArchitectureEdge, GeneratedArchitecture, ShapeType } from '../types/canvas';

export interface DiscoveredComponent {
  name: string;
  type: ShapeType;
  tech: string;
}

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

const PALETTE_COLORS: Record<ShapeType, string> = {
  service: '#10B981',
  database: '#8B5CF6',
  queue: '#F59E0B',
  cache: '#EF4444',
  gateway: '#3B82F6',
  auth: '#06B6D4',
  arrow: '#94A3B8',
  note: '#FCD34D'
};

/**
 * Generate architecture DAG from natural language prompt.
 * Uses exact regex word boundaries to avoid false positives (e.g. 'email', 'tailwind', 'domain' matching 'ai').
 */
export function generateArchitectureFromPrompt(prompt: string): GeneratedArchitecture {
  const p = prompt.toLowerCase().trim();
  const components: ExtractedComponent[] = [];

  // Helper: test whole word or specific token regex
  const hasWord = (pattern: RegExp) => pattern.test(p);

  // 1. Ingress & Edge Analysis
  if (hasWord(/\b(kong|nginx|ingress|gateway|reverse[- ]proxy|envoy|traefik)\b/i)) {
    components.push({
      id: 'gw-ingress',
      type: 'gateway',
      label: hasWord(/\bkong\b/i) ? 'Kong Gateway' : hasWord(/\bnginx\b/i) ? 'NGINX Reverse Proxy' : 'Edge API Gateway',
      description: 'TLS Termination, JWT validation & Dynamic Rate Limiting',
      color: PALETTE_COLORS.gateway,
      protocol: 'HTTPS / HTTP/2',
      technology: hasWord(/\bnginx\b/i) ? 'NGINX Alpine' : 'Spring Cloud Gateway / Netty',
      tier: 1
    });
  } else {
    components.push({
      id: 'gw-ingress',
      type: 'gateway',
      label: 'Edge API Gateway',
      description: 'TLS Termination, JWT validation & Token-Bucket Rate Limiter',
      color: PALETTE_COLORS.gateway,
      protocol: 'HTTPS / HTTP/2',
      technology: 'Spring Cloud Gateway / Netty',
      tier: 1
    });
  }

  // 2. Auth & Identity Service
  if (hasWord(/\b(auth|jwt|oauth|oauth2|oidc|identity|rbac|security)\b/i)) {
    components.push({
      id: 'srv-auth',
      type: 'auth',
      label: 'Auth & Identity Service',
      description: 'OAuth2 / OIDC token issuance & RBAC policies',
      color: PALETTE_COLORS.auth,
      protocol: 'gRPC / Mutual TLS',
      technology: 'Go / Keycloak',
      tier: 2
    });
  }

  // 3. Domain Core Business Services
  if (hasWord(/\b(payments?|fintech|banking|checkout|transactions?|ledger)\b/i)) {
    components.push({
      id: 'srv-payment',
      type: 'service',
      label: 'Payment Orchestrator',
      description: 'Saga Coordinator & Idempotent Processing',
      color: PALETTE_COLORS.service,
      protocol: 'gRPC / Event-Driven',
      technology: 'Spring Boot 3 / Java 21',
      tier: 2
    });
  }

  if (hasWord(/\b(orders?|e-?commerce|shops?|carts?|inventory)\b/i)) {
    components.push({
      id: 'srv-order',
      type: 'service',
      label: 'Order Management Service',
      description: 'Inventory reservations & state machine transitions',
      color: PALETTE_COLORS.service,
      protocol: 'gRPC / REST',
      technology: 'Node.js / TypeScript',
      tier: 2
    });
  }

  // Strict word boundary: ONLY match AI when it's standalone 'ai', 'rag', 'llm', 'agent(s)', or 'langgraph'
  // Prevents 'email', 'tailwind', 'domain', 'maintain' from falsely injecting AI nodes!
  if (hasWord(/\b(ai|rag|llm|agents?|langgraph|langchain)\b/i)) {
    components.push({
      id: 'srv-ai-agent',
      type: 'service',
      label: 'AI Reasoning Agent',
      description: 'Multi-agent supervisor DAG & dynamic tool dispatch',
      color: PALETTE_COLORS.auth,
      protocol: 'HTTP/2 Streaming / SSE',
      technology: 'Python / FastAPI / LangGraph',
      tier: 2
    });
  }

  if (hasWord(/\b(notifications?|emails?|sms|webhooks?|alerts?)\b/i)) {
    components.push({
      id: 'srv-notification',
      type: 'service',
      label: 'Notification Dispatcher',
      description: 'High-throughput push, email & webhook broadcasting',
      color: PALETTE_COLORS.service,
      protocol: 'AMQP Consumer',
      technology: 'Go / Rust',
      tier: 2
    });
  }

  // Ensure at least one primary business service exists if none matched
  if (!components.some((c) => c.tier === 2)) {
    components.push({
      id: 'srv-core',
      type: 'service',
      label: 'Core Domain Microservice',
      description: 'High-concurrency business logic and domain entities',
      color: PALETTE_COLORS.service,
      protocol: 'gRPC / REST',
      technology: 'Java 21 / Spring Boot 3',
      tier: 2
    });
  }

  // 4. Queues & Event Streaming
  if (hasWord(/\b(kafka|events?|streams?|queues?|rabbitmq|pubsub|amqp)\b/i)) {
    const queueLabel = hasWord(/\brabbitmq\b/i) ? 'RabbitMQ Exchange' : 'Apache Kafka Broker';
    components.push({
      id: 'q-broker',
      type: 'queue',
      label: queueLabel,
      description: 'Partitioned event log & Dead Letter Queue (DLQ)',
      color: PALETTE_COLORS.queue,
      protocol: 'TCP / Binary Wire Protocol',
      technology: hasWord(/\brabbitmq\b/i) ? 'RabbitMQ 3.12' : 'Apache Kafka 3.7 (KRaft)',
      tier: 3
    });
  }

  // 5. Caching & Fast Lookup
  if (hasWord(/\b(redis|cache|caching|latency|sessions?|memcached)\b/i)) {
    components.push({
      id: 'cache-redis',
      type: 'cache',
      label: 'Redis Distributed Cache',
      description: 'Sub-millisecond read-through cache & Redlock locks',
      color: PALETTE_COLORS.cache,
      protocol: 'RESP3 Protocol',
      technology: 'Redis 7.2 Cluster',
      tier: 3
    });
  }

  // 6. Persistence & Storage
  if (hasWord(/\b(vector|qdrant|pinecone|chroma|embeddings?)\b/i)) {
    components.push({
      id: 'db-vector',
      type: 'database',
      label: 'Qdrant Vector DB',
      description: 'HNSW vector indexing & Cosine distance metrics',
      color: PALETTE_COLORS.database,
      protocol: 'gRPC / REST',
      technology: 'Qdrant Cluster (v1.8)',
      tier: 4
    });
  }

  if (hasWord(/\b(postgres|postgresql|sql|acid|relational|payment|banking|ledger)\b/i)) {
    components.push({
      id: 'db-postgres',
      type: 'database',
      label: 'PostgreSQL Primary DB',
      description: 'ACID transactional store with Read Replicas & WAL CDC',
      color: PALETTE_COLORS.database,
      protocol: 'PostgreSQL Wire v3',
      technology: 'PostgreSQL 16 Multi-AZ',
      tier: 4
    });
  } else if (hasWord(/\b(mongo|mongodb|nosql|dynamo|dynamodb)\b/i)) {
    components.push({
      id: 'db-nosql',
      type: 'database',
      label: 'Distributed NoSQL Store',
      description: 'High-throughput partition-tolerant document storage',
      color: PALETTE_COLORS.database,
      protocol: 'MongoDB Wire Protocol',
      technology: 'MongoDB 7 Sharded Cluster',
      tier: 4
    });
  } else if (!components.some((c) => c.tier === 4)) {
    components.push({
      id: 'db-primary',
      type: 'database',
      label: 'Distributed Database Cluster',
      description: 'Multi-AZ replication with automated failover and backups',
      color: PALETTE_COLORS.database,
      protocol: 'TCP / TLS',
      technology: 'PostgreSQL 16 Enterprise',
      tier: 4
    });
  }

  // 7. Topological Node Calculation
  const tierX: Record<number, number> = { 1: 60, 2: 360, 3: 680, 4: 980 };
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
  const ingressNode = nodes.find((n) => n.data.type === 'gateway');
  const serviceNodes = nodes.filter((n) => n.data.type === 'service' || n.data.type === 'auth');
  const cacheNode = nodes.find((n) => n.data.type === 'cache');
  const queueNode = nodes.find((n) => n.data.type === 'queue');
  const dbNodes = nodes.filter((n) => n.data.type === 'database');

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
    description: `Multi-tier DAG with edge routing, message-bus ingestion, low-latency caching, and ACID persistence.`,
    nodes,
    edges
  };
}

/**
 * Builds architecture DAG directly from discovered codebase components.
 * Fixes P0.1: Preserves actual detected types, technologies, and labels.
 */
export function buildArchitectureFromDiscoveredComponents(
  components: DiscoveredComponent[],
  repoName: string
): GeneratedArchitecture {
  if (components.length === 0) {
    return {
      title: `${repoName} — No Services Detected`,
      description: `No containerized services, databases, or API entrypoints were detected in ${repoName}.`,
      nodes: [],
      edges: []
    };
  }

  const tierMapping: Record<ShapeType, 1 | 2 | 3 | 4> = {
    gateway: 1,
    service: 2,
    auth: 2,
    queue: 3,
    cache: 3,
    database: 4,
    arrow: 2,
    note: 2
  };

  const tierX: Record<number, number> = { 1: 60, 2: 360, 3: 680, 4: 980 };
  const tierCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };

  const nodes: ArchitectureNode[] = components.map((comp, idx) => {
    const tier = tierMapping[comp.type] || 2;
    const indexInTier = tierCounts[tier]++;
    const x = tierX[tier];
    const y = 80 + indexInTier * 160;
    const id = `node-${comp.type}-${idx + 1}`;

    return {
      id,
      type: 'architectureNode',
      position: { x, y },
      data: {
        label: comp.name,
        type: comp.type,
        description: `Inspected component: ${comp.tech}`,
        color: PALETTE_COLORS[comp.type] || '#10B981',
        technology: comp.tech,
        protocol:
          comp.type === 'gateway'
            ? 'HTTPS / HTTP/2'
            : comp.type === 'database'
            ? 'TCP / Relational Wire'
            : comp.type === 'queue'
            ? 'TCP / AMQP'
            : comp.type === 'cache'
            ? 'RESP3 / TCP'
            : 'HTTP / gRPC'
      }
    };
  });

  const edges: ArchitectureEdge[] = [];
  const gateways = nodes.filter((n) => n.data.type === 'gateway');
  const services = nodes.filter((n) => n.data.type === 'service' || n.data.type === 'auth');
  const caches = nodes.filter((n) => n.data.type === 'cache');
  const queues = nodes.filter((n) => n.data.type === 'queue');
  const dbs = nodes.filter((n) => n.data.type === 'database');

  // Gateway -> Services
  gateways.forEach((gw) => {
    services.forEach((srv) => {
      edges.push({
        id: `e-${gw.id}-${srv.id}`,
        source: gw.id,
        target: srv.id,
        animated: true,
        style: { stroke: '#38BDF8', strokeWidth: 2 }
      });
    });
  });

  // Services -> Caches, Queues, Databases
  services.forEach((srv) => {
    caches.forEach((cache) => {
      edges.push({
        id: `e-${srv.id}-${cache.id}`,
        source: srv.id,
        target: cache.id,
        style: { stroke: '#EF4444', strokeWidth: 2, strokeDasharray: '5,5' }
      });
    });
    queues.forEach((q) => {
      edges.push({
        id: `e-${srv.id}-${q.id}`,
        source: srv.id,
        target: q.id,
        animated: true,
        style: { stroke: '#F59E0B', strokeWidth: 2 }
      });
    });
    dbs.forEach((db) => {
      edges.push({
        id: `e-${srv.id}-${db.id}`,
        source: srv.id,
        target: db.id,
        style: { stroke: '#8B5CF6', strokeWidth: 2 }
      });
    });
  });

  // Queues -> Databases
  queues.forEach((q) => {
    dbs.forEach((db) => {
      edges.push({
        id: `e-${q.id}-${db.id}`,
        source: q.id,
        target: db.id,
        animated: true,
        style: { stroke: '#F59E0B', strokeWidth: 2 }
      });
    });
  });

  return {
    title: `${repoName} — Inspected Codebase Architecture`,
    description: `Statically detected ${components.length} component(s) across repository configurations, manifests, and dependencies.`,
    nodes,
    edges
  };
}

/**
 * Exports topology nodes to a runnable Docker Compose specification with networks, healthchecks, and volumes.
 * Fixes P0.3: No obsolete version '3.8', proper tech-specific images, configurable env, named volumes, and bridge network.
 */
export function exportArchitectureToDockerCompose(nodes: ArchitectureNode[]): string {
  if (nodes.length === 0) {
    return `# CollabCraft Docker Compose Specification\n# No services specified in architecture topology.\nservices: {}\n`;
  }

  let compose = `name: collabcraft-generated-stack\n\nservices:\n`;
  const volumes = new Set<string>();
  const dbServiceNames: string[] = [];
  const queueServiceNames: string[] = [];

  // Identify dependencies
  nodes.forEach((n) => {
    const slug = n.id.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    if (n.data.type === 'database') dbServiceNames.push(slug);
    if (n.data.type === 'queue') queueServiceNames.push(slug);
  });

  nodes.forEach((n) => {
    const slug = n.id.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const label = n.data.label.toLowerCase();
    const tech = (n.data.technology || '').toLowerCase();

    compose += `  ${slug}:\n`;
    compose += `    container_name: ${slug}\n`;

    if (n.data.type === 'gateway') {
      compose += `    image: nginx:alpine\n`;
      compose += `    ports:\n      - "80:80"\n      - "443:443"\n`;
      compose += `    healthcheck:\n`;
      compose += `      test: ["CMD-SHELL", "wget -q --spider http://localhost || exit 1"]\n`;
      compose += `      interval: 10s\n      timeout: 5s\n      retries: 3\n`;
      const srvDeps = nodes
        .filter((o) => o.data.type === 'service')
        .map((o) => o.id.toLowerCase().replace(/[^a-z0-9_-]/g, '-'));
      if (srvDeps.length > 0) {
        compose += `    depends_on:\n`;
        srvDeps.forEach((s) => {
          compose += `      - ${s}\n`;
        });
      }
    } else if (n.data.type === 'cache') {
      compose += `    image: redis:7-alpine\n`;
      compose += `    command: ["redis-server", "--appendonly", "yes"]\n`;
      compose += `    ports:\n      - "6379:6379"\n`;
      compose += `    volumes:\n      - ${slug}_data:/data\n`;
      compose += `    healthcheck:\n`;
      compose += `      test: ["CMD", "redis-cli", "ping"]\n`;
      compose += `      interval: 5s\n      timeout: 3s\n      retries: 5\n`;
      volumes.add(`${slug}_data`);
    } else if (n.data.type === 'queue') {
      if (label.includes('rabbitmq') || tech.includes('rabbitmq')) {
        compose += `    image: rabbitmq:3-management-alpine\n`;
        compose += `    ports:\n      - "5672:5672"\n      - "15672:15672"\n`;
        compose += `    volumes:\n      - ${slug}_data:/var/lib/rabbitmq\n`;
        compose += `    healthcheck:\n`;
        compose += `      test: ["CMD", "rabbitmq-diagnostics", "check_running"]\n`;
        compose += `      interval: 10s\n      timeout: 5s\n      retries: 5\n`;
        volumes.add(`${slug}_data`);
      } else {
        // Apache Kafka KRaft standalone
        compose += `    image: apache/kafka:3.7.0\n`;
        compose += `    environment:\n`;
        compose += `      KAFKA_NODE_ID: 1\n`;
        compose += `      KAFKA_PROCESS_ROLES: broker,controller\n`;
        compose += `      KAFKA_LISTENERS: PLAINTEXT://:9092,CONTROLLER://:9093\n`;
        compose += `      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://${slug}:9092\n`;
        compose += `      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER\n`;
        compose += `      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT\n`;
        compose += `      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@localhost:9093\n`;
        compose += `      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1\n`;
        compose += `      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1\n`;
        compose += `      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1\n`;
        compose += `      CLUSTER_ID: "MkU3OEVBNTcwNTJENDM2Qk"\n`;
        compose += `    ports:\n      - "9092:9092"\n`;
        compose += `    volumes:\n      - ${slug}_data:/var/lib/kafka/data\n`;
        compose += `    healthcheck:\n`;
        compose += `      test: ["CMD-SHELL", "/opt/kafka/bin/kafka-broker-api-versions.sh --bootstrap-server localhost:9092 || exit 1"]\n`;
        compose += `      interval: 15s\n      timeout: 10s\n      retries: 5\n`;
        volumes.add(`${slug}_data`);
      }
    } else if (n.data.type === 'database') {
      if (label.includes('mongo') || tech.includes('mongo')) {
        compose += `    image: mongo:7\n`;
        compose += `    ports:\n      - "27017:27017"\n`;
        compose += `    volumes:\n      - ${slug}_data:/data/db\n`;
        compose += `    healthcheck:\n`;
        compose += `      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]\n`;
        compose += `      interval: 10s\n      timeout: 5s\n      retries: 5\n`;
        volumes.add(`${slug}_data`);
      } else if (label.includes('mysql') || tech.includes('mysql')) {
        compose += `    image: mysql:8.0\n`;
        compose += `    environment:\n`;
        compose += `      MYSQL_ROOT_PASSWORD: \${MYSQL_ROOT_PASSWORD:-root_secure_pass}\n`;
        compose += `      MYSQL_DATABASE: \${MYSQL_DATABASE:-app_db}\n`;
        compose += `    ports:\n      - "3306:3306"\n`;
        compose += `    volumes:\n      - ${slug}_data:/var/lib/mysql\n`;
        compose += `    healthcheck:\n`;
        compose += `      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]\n`;
        compose += `      interval: 10s\n      timeout: 5s\n      retries: 5\n`;
        volumes.add(`${slug}_data`);
      } else {
        // PostgreSQL standard
        compose += `    image: postgres:16-alpine\n`;
        compose += `    environment:\n`;
        compose += `      POSTGRES_USER: \${POSTGRES_USER:-app_user}\n`;
        compose += `      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:-postgres_secure_pass}\n`;
        compose += `      POSTGRES_DB: \${POSTGRES_DB:-app_db}\n`;
        compose += `    ports:\n      - "5432:5432"\n`;
        compose += `    volumes:\n      - ${slug}_data:/var/lib/postgresql/data\n`;
        compose += `    healthcheck:\n`;
        compose += `      test: ["CMD-SHELL", "pg_isready -U \${POSTGRES_USER:-app_user} -d \${POSTGRES_DB:-app_db}"]\n`;
        compose += `      interval: 10s\n      timeout: 5s\n      retries: 5\n`;
        volumes.add(`${slug}_data`);
      }
    } else {
      // Service / App runtime node
      compose += `    image: node:20-alpine\n`;
      compose += `    command: ["sh", "-c", "echo 'CollabCraft service ${n.data.label} running' && sleep infinity"]\n`;
      compose += `    environment:\n      PORT: 8080\n      NODE_ENV: production\n`;
      compose += `    ports:\n      - "8080:8080"\n`;
      if (dbServiceNames.length > 0 || queueServiceNames.length > 0) {
        compose += `    depends_on:\n`;
        [...dbServiceNames, ...queueServiceNames].forEach((dep) => {
          compose += `      ${dep}:\n        condition: service_healthy\n`;
        });
      }
    }

    compose += `    networks:\n      - app-network\n`;
    compose += `    restart: unless-stopped\n\n`;
  });

  compose += `networks:\n  app-network:\n    driver: bridge\n\n`;

  if (volumes.size > 0) {
    compose += `volumes:\n`;
    volumes.forEach((v) => {
      compose += `  ${v}:\n`;
    });
  }

  return compose;
}

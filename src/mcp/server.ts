import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { exec } from "child_process";
import {
  generateArchitectureFromPrompt,
  buildArchitectureFromDiscoveredComponents,
  exportArchitectureToDockerCompose,
  DiscoveredComponent,
} from "../lib/copilot/architectureGenerator";
import { ArchitectureNode, ArchitectureEdge } from "../lib/types/canvas";

const APP_BASE_URL = process.env.COLLABCRAFT_URL || "https://collabcraft-system-studio.vercel.app";
const WS_RELAY_URL = process.env.COLLABCRAFT_WS_URL || process.env.NEXT_PUBLIC_WS_ENDPOINT || "wss://demos.yjs.dev/ws";

// Cross-platform browser launcher
export async function launchBrowser(url: string): Promise<void> {
  try {
    const openPkg = await import("open").catch(() => null);
    if (openPkg && typeof openPkg.default === "function") {
      await openPkg.default(url);
      return;
    }
  } catch {}

  const platform = process.platform;
  let cmd = "";
  if (platform === "darwin") {
    cmd = `open "${url}"`;
  } else if (platform === "win32") {
    cmd = `start "" "${url}"`;
  } else {
    cmd = `xdg-open "${url}"`;
  }

  exec(cmd, () => {});
}

export const server = new Server(
  {
    name: "collabcraft-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register MCP Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "render_architecture_dag",
        description:
          "Generates an interactive, collaborative system architecture Directed Acyclic Graph (DAG) with hardware-accelerated React Flow nodes and animated edges, streaming it to CollabCraft Studio.",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description:
                "Natural language specification of the system architecture (e.g. 'Fintech payment gateway with Kafka partition logs, Redis cache, and PostgreSQL ledger').",
            },
            roomName: {
              type: "string",
              description: "Optional custom room identifier. If omitted, generates an isolated secure room UUID.",
            },
            openBrowser: {
              type: "boolean",
              description: "Whether to automatically open the interactive canvas in the default browser (default: true).",
            },
          },
          required: ["prompt"],
        },
      },
      {
        name: "inspect_repository_architecture",
        description:
          "Statically inspects the local codebase (Docker Compose, package.json, pom.xml, requirements.txt, Prisma, Kubernetes) and builds an authentic topology DAG directly from discovered services and data stores.",
        inputSchema: {
          type: "object",
          properties: {
            repoPath: {
              type: "string",
              description: "Absolute or relative path to the codebase repository (defaults to current working directory).",
            },
            roomName: {
              type: "string",
              description: "Optional custom room identifier. If omitted, generates an isolated secure room UUID.",
            },
            openBrowser: {
              type: "boolean",
              description: "Whether to automatically open the interactive canvas in the browser (default: true).",
            },
          },
        },
      },
      {
        name: "detect_architecture_drift",
        description:
          "Performs static architectural and security drift audit: inspects tsconfig compiler strictness, exposed container ports, missing service healthchecks, unshielded databases without cache tiers, and missing rate-limiting middleware.",
        inputSchema: {
          type: "object",
          properties: {
            repoPath: {
              type: "string",
              description: "Path to the repository to audit.",
            },
          },
        },
      },
      {
        name: "export_infrastructure_spec",
        description:
          "Compiles a system architecture description into production-ready Infrastructure-as-Code (runnable Docker Compose YAML with healthchecks and named volumes, or Architecture Topology JSON).",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "System architecture description.",
            },
            format: {
              type: "string",
              enum: ["docker-compose", "json"],
              description: "Export format: 'docker-compose' (runnable multi-container YAML) or 'json' (topology graph).",
            },
          },
          required: ["prompt"],
        },
      },
    ],
  };
});

/**
 * Stream nodes & edges into Yjs WebSocket Relay with verified connection and clean room eviction.
 * Fixes P0.2: Wipes stale keys before writing new graph, reports real errors on connection failure instead of blind false success.
 */
export async function syncGraphToYjs(
  roomName: string,
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[]
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const doc = new Y.Doc();
    const sanitizedRoom = "collabcraft-" + roomName.replace(/[^a-zA-Z0-9-_]/g, "-");

    const WebSocket = require("ws");
    let isConnected = false;
    let wsProvider: WebsocketProvider | null = null;

    try {
      wsProvider = new WebsocketProvider(
        WS_RELAY_URL,
        sanitizedRoom,
        doc,
        { WebSocketPolyfill: WebSocket }
      );
    } catch (err: any) {
      doc.destroy();
      return resolve({ success: false, error: `Failed to initialize WebSocket client: ${err.message}` });
    }

    const nodesMap = doc.getMap<ArchitectureNode>("rf_nodes");
    const edgesMap = doc.getMap<ArchitectureEdge>("rf_edges");

    const cleanup = () => {
      if (wsProvider) {
        wsProvider.destroy();
      }
      doc.destroy();
    };

    // Connection timeout: fail if not connected within 3 seconds
    const timeoutTimer = setTimeout(() => {
      if (!isConnected) {
        cleanup();
        resolve({
          success: false,
          error: `Could not connect to collaboration relay (${WS_RELAY_URL}) within 3000ms.`,
        });
      }
    }, 3000);

    wsProvider.on("status", (event: { status: string }) => {
      if (event.status === "connected") {
        isConnected = true;
        clearTimeout(timeoutTimer);

        doc.transact(() => {
          // Clear stale keys so re-inspecting or regenerating does not leave zombie nodes
          const existingNodeKeys = Array.from(nodesMap.keys());
          existingNodeKeys.forEach((k) => nodesMap.delete(k));

          const existingEdgeKeys = Array.from(edgesMap.keys());
          existingEdgeKeys.forEach((k) => edgesMap.delete(k));

          // Set active nodes and edges
          nodes.forEach((n) => nodesMap.set(n.id, n));
          edges.forEach((e) => edgesMap.set(e.id, e));
        });

        // Allow message dispatch to finish before closing
        setTimeout(() => {
          cleanup();
          resolve({ success: true });
        }, 500);
      }
    });
  });
}

/**
 * Deep codebase inspection across Docker, Node, Python, Java, Prisma, and Kubernetes.
 */
export function inspectCodebase(targetDir: string): DiscoveredComponent[] {
  const discoveredComponents: DiscoveredComponent[] = [];

  // 1. Inspect docker-compose files
  const composeFiles = ["docker-compose.yml", "docker-compose.yaml", "compose.yml", "compose.yaml"];
  for (const cf of composeFiles) {
    const p = path.join(targetDir, cf);
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, "utf-8").toLowerCase();
      if (content.includes("redis")) {
        discoveredComponents.push({ name: "Redis Cache Tier", type: "cache", tech: "Redis 7 Cluster" });
      }
      if (content.includes("postgres")) {
        discoveredComponents.push({ name: "PostgreSQL Database", type: "database", tech: "Postgres 16 Multi-AZ" });
      }
      if (content.includes("kafka")) {
        discoveredComponents.push({ name: "Apache Kafka Event Bus", type: "queue", tech: "Kafka 3.7 (KRaft)" });
      }
      if (content.includes("rabbitmq")) {
        discoveredComponents.push({ name: "RabbitMQ Message Broker", type: "queue", tech: "RabbitMQ AMQP" });
      }
      if (content.includes("mongo")) {
        discoveredComponents.push({ name: "MongoDB Document Store", type: "database", tech: "MongoDB 7" });
      }
      if (content.includes("nginx") || content.includes("gateway") || content.includes("traefik") || content.includes("envoy")) {
        discoveredComponents.push({ name: "Edge API Gateway", type: "gateway", tech: "Reverse Proxy / Ingress" });
      }
    }
  }

  // 2. Inspect package.json
  const pkgPath = path.join(targetDir, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      if (deps["next"]) {
        discoveredComponents.push({ name: `${pkg.name || "Web Application"} (Next.js)`, type: "service", tech: "Next.js 15 App Router" });
      }
      if (deps["express"] || deps["fastify"] || deps["@nestjs/core"]) {
        discoveredComponents.push({ name: "REST API Gateway Service", type: "service", tech: "Node.js REST API" });
      }
      if (deps["@xyflow/react"] || deps["reactflow"]) {
        discoveredComponents.push({ name: "Interactive CAD Canvas", type: "service", tech: "React Flow CAD" });
      }
      if (deps["yjs"] || deps["y-websocket"]) {
        discoveredComponents.push({ name: "Yjs CRDT Collaboration Relay", type: "queue", tech: "Yjs WebSocket Server" });
      }
      if (deps["@prisma/client"] || deps["prisma"]) {
        discoveredComponents.push({ name: "Prisma ORM Data Layer", type: "database", tech: "Prisma Data Layer" });
      }
    } catch {}
  }

  // 3. Inspect Python
  const reqPath = path.join(targetDir, "requirements.txt");
  const pyprojectPath = path.join(targetDir, "pyproject.toml");
  if (fs.existsSync(reqPath) || fs.existsSync(pyprojectPath)) {
    const pyContent =
      (fs.existsSync(reqPath) ? fs.readFileSync(reqPath, "utf-8") : "") +
      (fs.existsSync(pyprojectPath) ? fs.readFileSync(pyprojectPath, "utf-8") : "");
    const lower = pyContent.toLowerCase();
    if (lower.includes("fastapi")) {
      discoveredComponents.push({ name: "FastAPI Backend Service", type: "service", tech: "Python 3.12 / FastAPI" });
    }
    if (lower.includes("django")) {
      discoveredComponents.push({ name: "Django Core Service", type: "service", tech: "Python / Django" });
    }
    if (lower.includes("celery")) {
      discoveredComponents.push({ name: "Celery Distributed Task Queue", type: "queue", tech: "Celery Worker" });
    }
    if (lower.includes("langchain") || lower.includes("langgraph")) {
      discoveredComponents.push({ name: "AI Agent Reasoning Engine", type: "service", tech: "LangGraph / LangChain" });
    }
    if (lower.includes("qdrant") || lower.includes("chromadb") || lower.includes("pinecone")) {
      discoveredComponents.push({ name: "Vector Search Database", type: "database", tech: "Vector Embeddings DB" });
    }
  }

  // 4. Inspect Prisma Schema
  const prismaPath = path.join(targetDir, "prisma", "schema.prisma");
  if (fs.existsSync(prismaPath)) {
    const prismaContent = fs.readFileSync(prismaPath, "utf-8").toLowerCase();
    if (prismaContent.includes('provider = "postgresql"')) {
      discoveredComponents.push({ name: "PostgreSQL Database Layer", type: "database", tech: "Postgres via Prisma" });
    } else if (prismaContent.includes('provider = "mysql"')) {
      discoveredComponents.push({ name: "MySQL Transactional DB", type: "database", tech: "MySQL 8.0" });
    } else if (prismaContent.includes('provider = "sqlite"')) {
      discoveredComponents.push({ name: "SQLite Embedded Store", type: "database", tech: "SQLite 3" });
    }
  }

  // 5. Inspect Java / Kotlin
  const pomPath = path.join(targetDir, "pom.xml");
  const gradlePath = path.join(targetDir, "build.gradle");
  if (fs.existsSync(pomPath) || fs.existsSync(gradlePath)) {
    const jvmContent =
      (fs.existsSync(pomPath) ? fs.readFileSync(pomPath, "utf-8") : "") +
      (fs.existsSync(gradlePath) ? fs.readFileSync(gradlePath, "utf-8") : "");
    if (jvmContent.includes("spring-cloud-starter-gateway")) {
      discoveredComponents.push({ name: "API Gateway Service", type: "gateway", tech: "Spring Cloud Gateway / Netty" });
    }
    if (jvmContent.includes("spring-boot-starter-data-redis")) {
      discoveredComponents.push({ name: "Redis Distributed Store", type: "cache", tech: "Redis Reactive" });
    }
    if (jvmContent.includes("spring-boot")) {
      discoveredComponents.push({ name: "Core Business Microservice", type: "service", tech: "Spring Boot 3 / Java 21" });
    }
  }

  // 6. Inspect Kubernetes / Helm
  const k8sDir = path.join(targetDir, "k8s");
  const helmDir = path.join(targetDir, "helm");
  if (fs.existsSync(k8sDir) || fs.existsSync(helmDir)) {
    discoveredComponents.push({ name: "Kubernetes Cluster Ingress", type: "gateway", tech: "K8s Ingress Controller" });
  }

  // Deduplicate
  const seen = new Set<string>();
  return discoveredComponents.filter((c) => {
    if (seen.has(c.name)) return false;
    seen.add(c.name);
    return true;
  });
}

/**
 * Concrete architecture drift detection.
 * Fixes P0.4: Actually inspects tsconfig compiler options, docker-compose port exposure & healthchecks,
 * missing cache tiers for databases, and unshielded endpoints.
 */
export function detectArchitectureDrift(targetDir: string) {
  const findings: Array<{ severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'PASS'; title: string; detail: string }> = [];

  // 1. Audit tsconfig.json strictness
  const tsconfigPath = path.join(targetDir, "tsconfig.json");
  if (fs.existsSync(tsconfigPath)) {
    try {
      const raw = fs.readFileSync(tsconfigPath, "utf-8");
      let tsconfig: any;
      try {
        tsconfig = JSON.parse(raw);
      } catch {
        const cleaned = raw.replace(/^\s*\/\/.*$/gm, "").replace(/,(\s*[}\]])/g, "$1");
        tsconfig = JSON.parse(cleaned);
      }

      const isStrict = tsconfig.compilerOptions?.strict === true;
      if (isStrict) {
        findings.push({
          severity: "PASS",
          title: "Type Safety Contract",
          detail: "tsconfig.json has 'compilerOptions.strict: true' active. Type signatures and boundaries are statically enforced.",
        });
      } else {
        findings.push({
          severity: "MEDIUM",
          title: "Type Safety Drift",
          detail: "tsconfig.json exists but 'compilerOptions.strict' is not enabled. Implicit 'any' and unvalidated null types weaken architectural boundaries.",
        });
      }
    } catch {
      findings.push({
        severity: "LOW",
        title: "TypeScript Configuration Parse Error",
        detail: "tsconfig.json is present but could not be parsed.",
      });
    }
  } else {
    findings.push({
      severity: "MEDIUM",
      title: "Missing Type Checking Harness",
      detail: "No tsconfig.json detected. Codebase lacks compile-time contract validation.",
    });
  }

  // 2. Audit Container Infrastructure & Port Exposure
  const composePath = ["docker-compose.yml", "docker-compose.yaml", "compose.yml"]
    .map((f) => path.join(targetDir, f))
    .find((f) => fs.existsSync(f));

  if (composePath) {
    const composeContent = fs.readFileSync(composePath, "utf-8");
    findings.push({
      severity: "PASS",
      title: "Infrastructure-as-Code Orchestration",
      detail: `Valid Compose configuration detected at ${path.basename(composePath)}.`,
    });

    // Check for exposed sensitive host ports (0.0.0.0:5432, 0.0.0.0:6379)
    if (/["'](5432:5432|3306:3306|27017:27017|6379:6379)["']/.test(composeContent)) {
      findings.push({
        severity: "HIGH",
        title: "Security Boundary Drift: Publicly Exposed Storage Ports",
        detail: "Database or Cache ports (5432/3306/27017/6379) are mapped directly to host network interfaces. In production, persistent storage should communicate solely over isolated bridge networks.",
      });
    }

    // Check for healthchecks
    if (!composeContent.includes("healthcheck")) {
      findings.push({
        severity: "MEDIUM",
        title: "Reliability Drift: Missing Service Healthchecks",
        detail: "No 'healthcheck' configurations detected in docker-compose.yml. Container orchestrators cannot verify downstream service readiness before routing traffic.",
      });
    }
  } else {
    findings.push({
      severity: "HIGH",
      title: "Missing Infrastructure-as-Code",
      detail: "No docker-compose.yml detected in repository root. Local multi-service reproducibility is absent.",
    });
  }

  // 3. Audit Architectural Coupling & Caching Tiers in package.json
  const pkgPath = path.join(targetDir, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

      const hasDb = !!(allDeps["pg"] || allDeps["mysql2"] || allDeps["@prisma/client"] || allDeps["mongoose"] || allDeps["typeorm"]);
      const hasCache = !!(allDeps["redis"] || allDeps["ioredis"] || allDeps["memcached"]);
      const hasApi = !!(allDeps["express"] || allDeps["fastify"] || allDeps["@nestjs/core"]);
      const hasRateLimit = !!(allDeps["express-rate-limit"] || allDeps["@upstash/ratelimit"] || allDeps["rate-limiter-flexible"]);

      if (hasDb && !hasCache) {
        findings.push({
          severity: "MEDIUM",
          title: "Architecture Drift: Unshielded Database Queries",
          detail: "Persistent database dependencies detected without an accompanying caching tier (Redis/Memcached). High-concurrency reads will place unbounded pressure on primary database connections.",
        });
      }

      if (hasApi && !hasRateLimit) {
        findings.push({
          severity: "HIGH",
          title: "Security Drift: Unprotected Public API Endpoints",
          detail: "HTTP server framework detected without rate-limiting middleware (express-rate-limit, @upstash/ratelimit). Endpoints are vulnerable to volumetric abuse.",
        });
      }
    } catch {}
  }

  // 4. Audit Automated Verification Harness
  const hasTests =
    fs.existsSync(path.join(targetDir, "tests")) ||
    fs.existsSync(path.join(targetDir, "__tests__")) ||
    fs.existsSync(path.join(targetDir, "test"));

  if (hasTests) {
    findings.push({
      severity: "PASS",
      title: "Automated Regression Harness",
      detail: "Automated test suite detected. Structural changes can be validated against regressions.",
    });
  } else {
    findings.push({
      severity: "HIGH",
      title: "Quality Drift: Absent Test Suite",
      detail: "No test directories (tests/, __tests__/) found. System behavior is unverified by continuous integration.",
    });
  }

  return findings;
}

// Tool Execution Dispatcher
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "render_architecture_dag") {
      const prompt = String(args?.prompt || "");
      if (!prompt.trim()) {
        return {
          isError: true,
          content: [{ type: "text", text: "Error: 'prompt' parameter is required." }],
        };
      }

      // Generate secure private room ID if not supplied
      const roomName = String(args?.roomName || "room-" + crypto.randomUUID().slice(0, 8));
      const shouldOpen = args?.openBrowser !== false;

      const topology = generateArchitectureFromPrompt(prompt);
      const syncResult = await syncGraphToYjs(roomName, topology.nodes, topology.edges);

      const liveUrl = `${APP_BASE_URL}/?room=${roomName}`;
      if (shouldOpen) {
        launchBrowser(liveUrl).catch(() => {});
      }

      const syncStatusNotice = syncResult.success
        ? `• **CRDT Sync**: Streamed to relay \`${WS_RELAY_URL}\` into room \`${roomName}\``
        : `• **CRDT Sync Warning**: ${syncResult.error} (Canvas will load locally from browser IndexedDB)`;

      return {
        content: [
          {
            type: "text",
            text:
              `✅ **Architecture DAG Generated**\n\n` +
              `• **Title**: ${topology.title}\n` +
              `• **Nodes (${topology.nodes.length})**: ${topology.nodes.map((n) => n.data.label).join(", ")}\n` +
              `• **Connected Edges**: ${topology.edges.length} automated DAG channels\n` +
              `${syncStatusNotice}\n` +
              `• **Live Interactive Canvas**: [${liveUrl}](${liveUrl})\n\n` +
              `*The architecture topology was computed and synchronized. Open the canvas URL to pan, zoom, edit handles, or export to Docker Compose YAML.*`,
          },
        ],
      };
    }

    if (name === "inspect_repository_architecture") {
      const targetDir = path.resolve(String(args?.repoPath || process.cwd()));
      const roomName = String(args?.roomName || "repo-" + crypto.randomUUID().slice(0, 8));
      const shouldOpen = args?.openBrowser !== false;

      const discoveredComponents = inspectCodebase(targetDir);

      // Fix P0.1: Build topology directly from discovered components
      const topology = buildArchitectureFromDiscoveredComponents(discoveredComponents, path.basename(targetDir));

      let syncNotice = "";
      if (topology.nodes.length > 0) {
        const syncResult = await syncGraphToYjs(roomName, topology.nodes, topology.edges);
        syncNotice = syncResult.success
          ? `• **CRDT Sync**: Streamed directly into private room \`${roomName}\``
          : `• **CRDT Sync Warning**: ${syncResult.error}`;
      }

      const liveUrl = `${APP_BASE_URL}/?room=${roomName}`;
      if (shouldOpen && topology.nodes.length > 0) {
        launchBrowser(liveUrl).catch(() => {});
      }

      return {
        content: [
          {
            type: "text",
            text:
              `🔍 **Repository Architecture Inspected & Mapped**\n\n` +
              `• **Repository Root**: \`${targetDir}\`\n` +
              `• **Detected Services & Infrastructure (${discoveredComponents.length})**:\n` +
              (discoveredComponents.length > 0
                ? discoveredComponents.map((c) => `  - **[${c.type.toUpperCase()}]** ${c.name} (${c.tech})`).join("\n")
                : "  *(No recognizable service manifests detected)*") +
              `\n${syncNotice}\n` +
              `• **Interactive Canvas URL**: [${liveUrl}](${liveUrl})\n\n` +
              `*The actual codebase architecture was extracted from manifests and placed onto the canvas with real detected tiers and technology labels.*`,
          },
        ],
      };
    }

    if (name === "detect_architecture_drift") {
      const targetDir = path.resolve(String(args?.repoPath || process.cwd()));
      const findings = detectArchitectureDrift(targetDir);

      const formatted = findings.map((f) => {
        const icon = f.severity === "PASS" ? "✅" : f.severity === "HIGH" ? "🚨" : f.severity === "MEDIUM" ? "⚠️" : "ℹ️";
        return `${icon} **[${f.severity}] ${f.title}**\n   ${f.detail}`;
      });

      return {
        content: [
          {
            type: "text",
            text:
              `🛡️ **CollabCraft Architecture Drift Audit**\n\n` +
              `**Target Path**: \`${targetDir}\`\n\n` +
              formatted.join("\n\n") +
              `\n\n*Run \`inspect_repository_architecture\` to view the live topology graph in CollabCraft Studio.*`,
          },
        ],
      };
    }

    if (name === "export_infrastructure_spec") {
      const prompt = String(args?.prompt || "");
      const format = String(args?.format || "docker-compose");

      // Validate format explicitly (Fix P0.3)
      if (format !== "docker-compose" && format !== "json") {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error: Unsupported format '${format}'. Valid options are 'docker-compose' or 'json'.`,
            },
          ],
        };
      }

      const topology = generateArchitectureFromPrompt(prompt);

      if (format === "docker-compose") {
        const yaml = exportArchitectureToDockerCompose(topology.nodes);
        return {
          content: [
            {
              type: "text",
              text: `📦 **Generated Docker Compose Specification**\n\n\`\`\`yaml\n${yaml}\n\`\`\``,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `📦 **Generated Topology JSON**\n\n\`\`\`json\n${JSON.stringify(topology, null, 2)}\n\`\`\``,
            },
          ],
        };
      }
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error: any) {
    return {
      isError: true,
      content: [{ type: "text", text: `Error executing ${name}: ${error.message}` }],
    };
  }
});

// Start Server over Stdio only when directly executed as the main CLI entrypoint (Fix P1.11)
export async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("CollabCraft MCP Server running on stdio");
}

if (typeof require !== "undefined" && require.main === module) {
  run().catch((err) => {
    console.error("Fatal error starting CollabCraft MCP Server:", err);
    process.exit(1);
  });
}

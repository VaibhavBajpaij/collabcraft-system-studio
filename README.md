# CollabCraft Studio & MCP Server — Real-Time Collaborative Architecture CAD for AI Agents

[![Next.js 15](https://img.shields.io/badge/Next.js-15_(App_Router)-black?logo=next.js)](https://nextjs.org/)
[![Model Context Protocol](https://img.shields.io/badge/MCP-Protocol_1.0-blueviolet?logo=anthropic)](https://modelcontextprotocol.io/)
[![React Flow](https://img.shields.io/badge/React_Flow-@xyflow/react_13-FF0072?logo=reactflow)](https://reactflow.dev/)
[![Yjs CRDT](https://img.shields.io/badge/CRDT-Yjs_Conflict--Free-orange.svg)](https://yjs.dev/)
[![Local-First](https://img.shields.io/badge/Storage-IndexedDB_Zero_Loss-purple.svg)](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An open-source, enterprise-grade **System Architecture CAD Platform & Model Context Protocol (MCP) Server** built with **Next.js 15**, **React Flow (`@xyflow/react`)**, and **Yjs CRDTs**.

Bridges the spatial gap in AI coding agents (**Claude Code, Cursor, Windsurf, and Claude Desktop**), allowing agents to inspect repositories, generate interactive system topology graphs with animated data-flow edges, detect architecture drift, and export directly to runnable Docker Compose YAML.

---

## 🏛️ Architecture Overview

```
 ┌────────────────────────────────────────────────────────┐
 │   AI Coding Agents (Claude Code, Cursor, Windsurf)     │
 │   "Claude, design our payment system & show me the map"│
 └──────────────────────────┬─────────────────────────────┘
                            │ (Model Context Protocol / Stdio)
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │              collabcraft-mcp CLI Server                │
 │   • render_architecture_dag                            │
 │   • inspect_repository_architecture                    │
 │   • detect_architecture_drift                          │
 │   • export_infrastructure_spec                         │
 └──────────────────────────┬─────────────────────────────┘
                            │ (Binary Yjs WebSocket Relay)
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │       CollabCraft Web Visualizer (React Flow 13)       │
 │   • Opens instantly at https://collabcraft-.../?room=X │
 │   • Bidirectional connection handles (N, S, E, W)      │
 │   • Animated bezier & smoothstep edge routing          │
 │   • Local-First IndexedDB Zero-Data-Loss cache         │
 │   • Real-time human-in-the-loop multi-cursor sync      │
 └────────────────────────────────────────────────────────┘
```

---

## ⚡ Quickstart: Add to Claude Desktop or Cursor (MCP)

### Option A: Claude Desktop Configuration
Add to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "collabcraft": {
      "command": "node",
      "args": ["<PATH_TO_REPO>/bin/collabcraft-mcp.js"]
    }
  }
}
```

### Option B: Cursor IDE Configuration
Add to your `.cursor/mcp.json` or Global Cursor Settings:
```json
{
  "mcpServers": {
    "collabcraft": {
      "command": "node",
      "args": ["<PATH_TO_REPO>/bin/collabcraft-mcp.js"]
    }
  }
}
```

---

## 🛠️ The 4 Core MCP Tools

### 1. `render_architecture_dag`
* **Prompt**: *"Design an ultra-low latency fintech payment gateway with Kafka, Redis caching, and PostgreSQL ledger."*
* **Behavior**: Replaces static, broken Mermaid text with an **interactive React Flow CAD canvas**. Generates 4-tier topological nodes with multi-directional handles and animated data-flow edges, streaming the result live to CollabCraft Studio and opening it in the browser.

### 2. `inspect_repository_architecture`
* **Prompt**: *"Map out the services and databases used in this repository."*
* **Behavior**: Scans `docker-compose.yml`, `package.json`, `pom.xml`, `requirements.txt`, `prisma/schema.prisma`, and Kubernetes configs. Reverse-engineers the codebase into a visual topology DAG with zero manual effort.

### 3. `detect_architecture_drift`
* **Prompt**: *"Audit this codebase for architectural drift and security anti-patterns."*
* **Behavior**: Detects missing rate-limiting layers on public APIs, unrouted microservices, missing caching tiers, and direct synchronous couplings.

### 4. `export_infrastructure_spec`
* **Prompt**: *"Export this architecture as a Docker Compose specification."*
* **Behavior**: Compiles the visual canvas topology directly into production-ready `docker-compose.yml` with container networking, volumes, and health checks.

---

## ⚡ Web Platform Highlights (`@xyflow/react` + Yjs)

1. **Hardware-Accelerated React Flow Canvas**:
   * Custom hardware-accelerated nodes with 4 directional handles (Input, Output, Top, Bottom) for arbitrary multi-point wiring.
   * Includes Minimap, zoom controls, fit-view, and multi-node selection.
2. **Conflict-Free Replicated Data Types (CRDTs)**:
   * Uses `Y.Doc`, `Y.Map<ArchitectureNode>`, and `Y.Map<ArchitectureEdge>` for guaranteed convergence across distributed browsers with zero merge conflicts.
3. **Local-First Zero-Data-Loss Persistence (`y-indexeddb`)**:
   * State is continuously committed into browser IndexedDB. Hard page reloads restore 100% of user nodes and custom edge layouts.
4. **Dual-Transport Synchronization**:
   * Uses WebRTC P2P (`BroadcastChannel`) for 0ms local tab sync with WebSocket fallback relay (`y-websocket`).

---

## 🚀 Local Development

### 1. Install Dependencies
```bash
git clone https://github.com/VaibhavBajpaij/collabcraft-system-studio.git
cd collabcraft-system-studio
npm install --legacy-peer-deps
```

### 2. Run Web Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the live studio.

### 3. Build Web App & MCP Binary Bundle
```bash
npm run build
```
Builds `dist/mcp.js` (standalone Node.js bundle) and the Next.js 15 production artifacts.

### 4. Test MCP Server Locally
```bash
node bin/collabcraft-mcp.js
```

---

## 👤 Author
**Vaibhav Bajpai**
* GitHub: [@VaibhavBajpaij](https://github.com/VaibhavBajpaij)
* LinkedIn: [in/vaibhav-bajpai18](https://www.linkedin.com/in/vaibhav-bajpai18/)
* Email: [vaibhav.bajpai.tech@gmail.com](mailto:vaibhav.bajpai.tech@gmail.com)

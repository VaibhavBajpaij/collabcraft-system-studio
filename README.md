# CollabCraft Studio & MCP Server — Real-Time Collaborative Architecture CAD for AI Agents

[![Next.js 15](https://img.shields.io/badge/Next.js-15_(App_Router)-black?logo=next.js)](https://nextjs.org/)
[![Model Context Protocol](https://img.shields.io/badge/MCP-Protocol_1.0-blueviolet?logo=anthropic)](https://modelcontextprotocol.io/)
[![React Flow](https://img.shields.io/badge/React_Flow-@xyflow/react_13-FF0072?logo=reactflow)](https://reactflow.dev/)
[![Yjs CRDT](https://img.shields.io/badge/CRDT-Yjs_Conflict--Free-orange.svg)](https://yjs.dev/)
[![Local-First](https://img.shields.io/badge/Storage-IndexedDB_Local_First-purple.svg)](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An open-source **System Architecture CAD Platform & Model Context Protocol (MCP) Server** built with **Next.js 15**, **React Flow (`@xyflow/react`)**, and **Yjs CRDTs**.

Bridges the spatial gap in AI coding agents (**Claude Code, Cursor, Windsurf, and Claude Desktop**), allowing agents to inspect repositories, generate interactive system topology graphs with animated data-flow edges, detect architectural drift, and export directly to runnable Docker Compose YAML with healthchecks and named volumes.

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
 │   • Isolated private workspace rooms                   │
 │   • Bidirectional connection handles (N, S, E, W)      │
 │   • Animated bezier & smoothstep edge routing          │
 │   • Local-First IndexedDB browser cache                │
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
* **Purpose**: Generates an interactive, collaborative React Flow DAG from system specifications and opens an isolated workspace canvas in the browser.
* **Input**: `prompt` (string), optional `roomName` (string), optional `openBrowser` (boolean).

### 2. `inspect_repository_architecture`
* **Purpose**: Statically scans codebase manifests (`docker-compose.yml`, `package.json`, `pom.xml`, `requirements.txt`, `prisma/schema.prisma`, `k8s/`, `helm/`) and translates detected services, message brokers, caches, and databases directly into an authentic CAD topology.
* **Input**: optional `repoPath` (string), optional `roomName` (string), optional `openBrowser` (boolean).

### 3. `detect_architecture_drift`
* **Purpose**: Static architecture and security audit: checks `tsconfig.json` compiler strictness, exposed host ports on persistent storage, container healthchecks, missing caching tiers for databases, and API rate-limiting middleware.
* **Input**: optional `repoPath` (string).

### 4. `export_infrastructure_spec`
* **Purpose**: Compiles architecture topology into a runnable multi-container `docker-compose.yml` (configured with bridge networks, container healthchecks, and named volumes for persistence) or raw JSON topology.
* **Input**: `prompt` (string), `format` (`"docker-compose"` | `"json"`).

---

## 🚀 Local Development

### 1. Install Dependencies
```bash
git clone https://github.com/VaibhavBajpaij/collabcraft-system-studio.git
cd collabcraft-system-studio
npm install --legacy-peer-deps
```

### 2. Start Self-Hosted Collaboration Relay
```bash
npm run server
```
Runs the Yjs WebSocket relay at `ws://localhost:1234` with health monitoring at `http://localhost:1234/health`.

### 3. Run Web Development Studio
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the live studio.

### 4. Build Web App & MCP Binary Bundle
```bash
npm run build
```
Builds `dist/mcp.js` (standalone Node.js bundle) and the Next.js 15 production artifacts.

### 5. Run Verification Test Suite
```bash
npm test
```

---

## 👤 Author
**Vaibhav Bajpai**
* GitHub: [@VaibhavBajpaij](https://github.com/VaibhavBajpaij)
* LinkedIn: [in/vaibhav-bajpai18](https://www.linkedin.com/in/vaibhav-bajpai18/)
* Email: [vaibhav.bajpai.tech@gmail.com](mailto:vaibhav.bajpai.tech@gmail.com)

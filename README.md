# CollabCraft Studio — Real-Time Collaborative System Architecture CAD

[![Next.js 15](https://img.shields.io/badge/Next.js-15_(App_Router)-black?logo=next.js)](https://nextjs.org/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React Flow](https://img.shields.io/badge/React_Flow-@xyflow/react_13-FF0072?logo=reactflow)](https://reactflow.dev/)
[![Yjs CRDT](https://img.shields.io/badge/CRDT-Yjs_Conflict--Free-orange.svg)](https://yjs.dev/)
[![Local-First](https://img.shields.io/badge/Storage-IndexedDB_Zero_Loss-purple.svg)](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An enterprise-grade, browser-based **real-time collaborative system design CAD platform** built with **Next.js 15**, **TypeScript**, **@xyflow/react (React Flow)**, and **Yjs CRDTs (Conflict-free Replicated Data Types)**.

Allows distributed engineering teams to design microservices, event-driven pipelines, and cloud architectures simultaneously with zero edit collisions, multi-user cursor presence, local-first offline persistence, and an **AI Architecture Copilot** that converts natural language requirements into interactive, connected Directed Acyclic Graphs (DAGs).

---

## 🏛️ System Architecture

```
                          [Distributed Engineering Team]
                       Client A (Chrome)          Client B (Edge)
                              │                          │
                              ▼                          ▼
                       ┌─────────────┐            ┌─────────────┐
                       │  React Flow │            │  React Flow │
                       │ Canvas View │            │ Canvas View │
                       └──────┬──────┘            └──────┬──────┘
                              │                          │
                        (doc.transact)             (doc.transact)
                              │                          │
                              ▼                          ▼
                       ┌─────────────┐            ┌─────────────┐
                       │ Local Y.Doc │            │ Local Y.Doc │
                       │ (CRDT Map)  │            │ (CRDT Map)  │
                       └──────┬──────┘            └──────┬──────┘
                              │                          │
                      ┌───────┴────────┐         ┌───────┴────────┐
                      ▼                ▼         ▼                ▼
              ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
              │  y-indexeddb  │ │  y-webrtc     │ │  y-websocket  │ │ Y.UndoManager │
              │ (Zero Data    │ │ (Broadcast-   │ │ (Central      │ │ (Ctrl+Z / Y   │
              │  Loss Cache)  │ │  Channel P2P) │ │  Relay WSS)   │ │  Multi-User)  │
              └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘
```

---

## ⚡ Core Engineering & Distributed Systems Highlights

### 1. Interactive Node & Edge Graph CAD (`@xyflow/react`)
* Built on `@xyflow/react 13`, featuring custom hardware-accelerated nodes with bidirectional connection handles (Input, Output, Top, Bottom).
* Full support for orthogonal, smoothstep, and bezier edge routing with live visual data-flow animation.
* Includes Minimap, viewport pan & zoom controls, multi-node selection, and interactive deletion (`Backspace`/`Delete`).

### 2. Conflict-Free Replicated Data Types (CRDTs)
* Uses `Y.Map<ArchitectureNode>` and `Y.Map<ArchitectureEdge>` to guarantee **mathematical convergence**: concurrent edits (moving components, modifying labels, connecting edges) resolve deterministically across all connected clients without requiring operational transforms (OT) or centralized database locks.

### 3. Local-First Zero-Data-Loss Persistence (`y-indexeddb`)
* All node positions, component metadata, and edge connections are instantly persisted into browser **IndexedDB**. Refreshing the browser or reopening after an unexpected shutdown immediately restores 100% of the canvas state before network reconnection.

### 4. Dual-Transport Synchronization
* Combines **WebRTC** (`y-webrtc`) for 0ms latency intra-browser `BroadcastChannel` and P2P inter-browser data channels with a resilient **WebSocket** fallback relay (`y-websocket`) to ensure continuous connectivity across strict NATs and firewalls.

### 5. AI Copilot DAG Generator
* Parses system engineering specifications (e.g., *"Fintech payment gateway with Kafka, Redis idempotency, and PostgreSQL ledger"*) and dynamically emits structured, positioned, connected **Directed Acyclic Graphs (DAGs)** directly into the shared CRDT document.

### 6. Infrastructure-as-Code (IaC) One-Click Export
* **Docker Compose YAML**: Generates runnable multi-container configurations from the active canvas topology.
* **JSON Topology Spec**: Exports the full node-edge schema for integration with CI/CD and deployment pipelines.

---

## 🚀 Quickstart & Local Setup

### 1. Clone Repository & Install Dependencies
```bash
git clone https://github.com/VaibhavBajpaij/collabcraft-system-studio.git
cd collabcraft-system-studio
npm install --legacy-peer-deps
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in multiple browser tabs or incognito windows to test live multi-cursor and node/edge synchronization.

### 3. Build for Production
```bash
npm run build
```

---

## 👤 Author
**Vaibhav Bajpai**
* GitHub: [@VaibhavBajpaij](https://github.com/VaibhavBajpaij)
* LinkedIn: [in/vaibhav-bajpai18](https://www.linkedin.com/in/vaibhav-bajpai18/)
* Email: [vaibhav.bajpai.tech@gmail.com](mailto:vaibhav.bajpai.tech@gmail.com)

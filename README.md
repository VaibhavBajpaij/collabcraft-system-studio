# CollabCraft Studio — Real-Time Collaborative System Architecture Platform

[![Next.js 15](https://img.shields.io/badge/Next.js-15_(App_Router)-black?logo=next.js)](https://nextjs.org/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Yjs CRDT](https://img.shields.io/badge/CRDT-Yjs_Conflict--Free-orange.svg)](https://yjs.dev/)
[![React 19](https://img.shields.io/badge/React-19_RC-61DAFB?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An enterprise-grade, browser-based **real-time collaborative system design whiteboard** built with **Next.js 15**, **TypeScript**, and **Yjs CRDTs (Conflict-free Replicated Data Types)**. 

Allows distributed engineering teams to design microservices, event-driven pipelines, and cloud architectures simultaneously with zero edit collisions, multi-user cursor presence, and an **AI Architecture Copilot** that converts natural language requirements into interactive system diagrams.

---

## 🏛️ System Architecture

```
                  [Distributed Engineering Team]
                 Client A                  Client B
                    │                         │
                    ▼                         ▼
             ┌─────────────┐           ┌─────────────┐
             │ Next.js 15  │           │ Next.js 15  │
             │ Local Y.Doc │           │ Local Y.Doc │
             └──────┬──────┘           └──────┬──────┘
                    │                         │
                    └───────────┬─────────────┘
                                │ (Binary Yjs Updates)
                                ▼
                   ┌────────────────────────┐
                   │  y-websocket Server    │ (Node.js / Netty)
                   └────────────┬───────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
          ┌───────────────────┐   ┌───────────────────┐
          │  Redis Pub/Sub    │   │ AI Architecture   │
          │  Cluster State    │   │ Copilot Engine    │
          └───────────────────┘   └───────────────────┘
```

---

## ⚡ Core Engineering & Distributed Highlights

### 1. Conflict-Free Replicated Data Types (CRDTs)
* Uses `Y.Map` and `Y.Doc` state vectors to guarantee **mathematical convergence**: concurrent edits (e.g. moving components, modifying labels) resolve deterministically across all connected clients without requiring operational transforms (OT) or centralized database locks.

### 2. Multi-User Presence & Ephemeral State
* Propagates real-time cursor positions (`x, y`), client names, and active node selections with sub-20ms latency. Stale client heartbeats (>30s) are automatically collected and pruned.

### 3. AI Architecture Copilot Engine
* Parses system engineering specifications (e.g., *"Distributed banking payment ledger with Kafka and Redis idempotency"*) and dynamically emits structured, positioned topological graphs (`CanvasShape[]`) directly into the shared CRDT document.

### 4. Zero-Flicker Canvas Rendering
* Built with hardware-accelerated CSS transforms (`translate3d`) and decoupled rendering passes to maintain 60 FPS during high-frequency collaborator movements.

---

## 🚀 Quickstart & Local Setup

### 1. Clone Repository & Install Dependencies
```bash
git clone https://github.com/VaibhavBajpaij/collabcraft-system-studio.git
cd collabcraft-system-studio
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in multiple browser tabs or incognito windows to test live multi-cursor synchronization.

### 3. Run Automated Tests
```bash
npm run test
```

### 4. Run via Docker Compose
```bash
docker-compose up -d
```

---

## 👤 Author
**Vaibhav Bajpai**
* GitHub: [@VaibhavBajpaij](https://github.com/VaibhavBajpaij)
* LinkedIn: [in/vaibhav-bajpai18](https://www.linkedin.com/in/vaibhav-bajpai18/)
* Email: [vaibhav.bajpai.tech@gmail.com](mailto:vaibhav.bajpai.tech@gmail.com)

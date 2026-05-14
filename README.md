# A Pile of Ideas

A real-time collaborative whiteboard with Google Docs–style version control and multi-user editing. Built with TypeScript and Next.js, powered by Operational Transformation (OT).

## Overview

A Pile of Ideas is a full-stack application that lets multiple users simultaneously edit a shared whiteboard canvas. Every edit is tracked, transformed, and persisted — giving you the collaborative feel of Google Docs applied to a freeform idea space with text boxes and drawing tools.

The core synchronization engine uses **Operational Transformation**, the same class of algorithm behind Google Docs, to deterministically resolve concurrent edits across users without conflicts.

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Language | TypeScript | Type safety across the entire stack |
| Framework | Next.js (React) | SSR, unified client/server, fast iteration |
| Real-time | WebSockets (`ws`) | Low-latency bidirectional communication |
| Short-term storage | Redis (`ioredis`) | In-memory speed for edits and temp logs; auto-cleanup |
| Long-term storage | MongoDB (`mongodb`) | Persistent, document-oriented storage for snapshots |
| Validation | Zod | Runtime schema validation |
| Compression | Pako | Delta compression for efficient transport |
| Infrastructure | Docker | Consistent, reproducible environments |

## Architecture

### Operational Transformation

Edits are represented as **deltas** — ordered lists of operations:

```typescript
type DeltaOp =
  | { type: 'retain'; count: number }
  | { type: 'insert'; text: string }
  | { type: 'delete'; count: number };
```

When two users edit simultaneously, their operations are **transformed** against each other in a deterministic order before being applied to the document. This guarantees all clients converge to the same state regardless of network timing.

### Backend

The server runs on a **single-threaded event loop** by design. Multi-threading would introduce race conditions and complex locking — the single-threaded model avoids these entirely while Next.js handles concurrency naturally.

**Dual-database strategy:**

- **Redis** handles the hot path: buffering user edits, storing temporary document logs, and managing session state. Its in-memory nature gives sub-millisecond reads, and built-in TTL keeps storage tidy. The trade-off is volatility — data lives in RAM and is lost on crash.
- **MongoDB** handles the cold path: persisting document snapshots and complete file contents. Its document-oriented model maps naturally to the application's data structures. Disk-backed storage means data survives crashes, even if some operations between snapshots are lost (an acceptable trade-off for architectural simplicity).

**WebSockets** provide the real-time communication layer. Benchmarking showed that for the most common operations (applying and processing edits), WebSockets are roughly **4× faster** than a webhook-based approach once connection overhead is excluded.

### Frontend

Built with React and Next.js, the frontend uses **optimistic UI rendering** — changes appear instantly in the editor before server confirmation, minimizing perceived latency.

**State management** is planned across three layers:

1. **Document state** (`useReducer`) — content, version number, pending unconfirmed operations
2. **Connection state** (`useState`) — WebSocket status, user session, connection health
3. **Collaboration state** (Context API) — active users, cursor positions, presence indicators

Performance optimizations include debounced cursor updates, `React.memo` for collaboration indicators, and virtual scrolling for large documents.

### Tools

The whiteboard currently supports **text box creation** and a **freehand drawing tool** (WIP). Data models use a shared superclass so different object types can be interacted with interchangeably.

## Project Structure

```
idea-pile/
├── backend/
│   ├── document/        # DocumentManager & DocumentSession
│   ├── ot/              # Operational Transformation logic
│   ├── storage/         # Redis (short-term) & MongoDB (persistent)
│   └── ws/              # WebSocket handling & client connections
│
├── delta/               # Shared delta types (used by both frontend & backend)
│
└── app/                 # Frontend
    ├── tools/           # Text editing & drawing tools (WIP)
    └── models/          # Sticky note and data models (WIP)
```

## Performance Benchmarks

Measured under Docker for consistency (Redis for in-memory, MongoDB + Webhooks for persistent storage):

| Operation | In-Memory | MongoDB & Webhooks | Trade-off |
|-----------|-----------|-------------------|-----------|
| Session Creation (100 sessions) | 0.18 ms | 0.20 ms | 1.1× |
| Document Operations (1000 ops) | 3.83 ms | 878.54 ms | 229× |
| Broadcasting (50 users) | 0.11 ms | 0.12 ms | 1.1× |
| Snapshot Loading (50 snaps) | 0.25 ms | 3.56 ms | 14.5× |
| User Join/Leave (200 users) | 3.73 ms | 21.95 ms | 5.9× |

> In production (MongoDB & Webhooks), the most frequent operations — session creation and broadcasting — resolve in **under 1 ms**. Even at scale, 1000 document operations complete in under 900 ms and 200 concurrent user joins settle in ~22 ms. The in-memory column serves as a theoretical floor, confirming the persistence layer adds minimal overhead for real-time-critical paths.

## Prerequisites

- Node.js
- Docker (for Redis and MongoDB containers)

## Getting Started

```bash
# Clone the repository
git clone https://github.com/PineappleArray/a-pile-of-ideas.git
cd a-pile-of-ideas

# Install dependencies
npm install

# Start the development environment
# (ensure Docker containers for Redis and MongoDB are running)
npm run dev
```

## Roadmap

- [ ] Complete the frontend UI
- [ ] Refine OT algorithm for text box–specific editing
- [ ] Drawing tool polish
- [ ] User presence indicators and cursor sharing
- [ ] Version history browser

## License

MIT — see [LICENSE](./LICENSE) for details.

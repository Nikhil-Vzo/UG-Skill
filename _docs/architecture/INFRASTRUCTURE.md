# Project Infrastructure & Conventions

This document details the core technical pillars of the UGSkill backend, including communication patterns, database synchronization, and coding standards.

## 1. Caching Strategy (Redis)

The platform utilizes **Redis** for high-performance data retrieval using the **Cache-aside (Lazy Loading)** pattern.

### Implementation Details
- **Library**: `ioredis`
- **Helper**: `src/lib/cache.ts`
- **Primary Tool**: `fetchWithCache<T>(key, fetchFn, ttlSeconds)`

```mermaid
sequenceDiagram
    participant App as Backend API
    participant Cache as Redis
    participant DB as Postgres/Mongo

    App->>Cache: 1. GET key
    alt Cache Hit
        Cache-->>App: Return Cached Data
        Note over App: Zero DB latency
    else Cache Miss
        Cache-->>App: null
        App->>DB: 2. Fetch Fresh Data
        DB-->>App: Result
        App->>Cache: 3. SET key + TTL
        App-->>App: Return Result
    end
```

---

## 2. Queuing & Event System (BullMQ)

High-fidelity breakdown of how background tasks are offloaded.

### Detailed Lifecycle
```mermaid
sequenceDiagram
    participant Svc as Core Service
    participant EE as eventListeners.ts
    participant BQ as BullMQ (Redis)
    participant Wkr as CDC/Notif Worker
    participant Target as Target DB / API

    Svc->>Svc: 1. Business Logic Sync
    Svc->>EE: 2. emit(EVENT_TYPE, payload)
    
    rect rgb(200, 230, 255)
    Note right of EE: Producer Phase
    EE->>BQ: 3. addJob(name, data)
    BQ-->>EE: JobId Returned
    end

    rect rgb(230, 255, 200)
    Note right of Wkr: Consumer Phase
    BQ->>Wkr: 4. fetchNextJob()
    Wkr->>Target: 5. Execute Logic (e.g. Sync)
    Target-->>Wkr: Success/Fail
    Wkr->>BQ: 6. moveToCompleted()
    end
```

---

## 3. CDC (Change Data Capture) Flow

The "Dual-DB" strategy requires PostgreSQL (Relational) and MongoDB (Document) to stay in sync.

| Source DB | Target DB | Entity | Trigger Event | Result |
|---|---|---|---|---|
| MongoDB | PostgreSQL | Courses | `COURSE_UPDATED` | Updates `course_catalog` |
| MongoDB | PostgreSQL | Activity | `ACTIVITY_COMPLETED` | Updates `progress_summary` |
| PostgreSQL | MongoDB | User | `USER_UPDATED` | Updates `user_snapshots` |
| MongoDB | PostgreSQL | Scores | `MOCK_SCORED` | Updates `readiness_scores` |

---

## 4. Casing & Coding Conventions

### Data Transformation Flow
How we handle casing across the full stack layers.

```mermaid
flowchart LR
    FE[Client/Frontend] -- "camelCase (JSON)" --> API[Express Controller]
    API -- "camelCase (Vars)" --> Svc[Service/Logic]
    
    subgraph PostgreSQL Layer
        Svc -- "snake_case (Drizzle)" --> PG[(Postgres)]
    end
    
    subgraph MongoDB Layer
        Svc -- "camelCase (Mongoose)" --> MG[(MongoDB)]
    end

    style PG fill:#f9f,stroke:#333
    style MG fill:#bbf,stroke:#333
```

### Reference Table
| Context | Case Style | Example |
|---|---|---|
| **PostgreSQL** | `snake_case` | `user_id`, `updated_at` |
| **MongoDB** | `camelCase` | `userId`, `lastAttemptDate` |
| **TypeScript** | `camelCase` | `const userData = ...` |
| **API Responses** | `camelCase` | `{ "success": true, "data": { ... } }` |

---

## 5. Real-Time Architecture (Socket.io)

For capabilities like live proctoring, exam timers, and group discussions, we utilize a strict namespace-partitioned WebSocket design.

### WebSockets Connection & Message Passing
```mermaid
graph TD
    Client[Client Browser]
    
    subgraph Express + Socket.io Server
        JWT[Global JWT Middleware]
        
        subgraph Namespaces
            NS1["/chat"]
            NS2["/exam"]
            NS3["/tracking"]
            NS4["/gd"]
        end
    end
    
    subgraph Infrastructure
        Redis[(Redis Cache)]
        Mongo[(MongoDB)]
        PG[(PostgreSQL)]
    end

    Client -- WS Connection --> JWT
    
    JWT -- Valid Token --> NS1
    JWT -- Valid Token --> NS2
    JWT -- Valid Token --> NS3
    JWT -- Valid Token --> NS4

    NS1 -- "Persist Messages" --> Mongo
    NS2 -- "Sync Timers" --> Redis
    NS3 -- "Flag Violations" --> PG
    NS4 -- "Aggregated Scores" --> PG
    
    classDef client fill:#f9f,stroke:#333;
    classDef server fill:#eef,stroke:#333;
    classDef infra fill:#bbf,stroke:#333;
    
    class Client client;
    class JWT,NS1,NS2,NS3,NS4 server;
    class Redis,Mongo,PG infra;
```

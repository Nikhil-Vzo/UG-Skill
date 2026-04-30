<div align="center">

# 🎓 UGSkill

> **Current Build Focus: 🔴 P9-P — AI-Powered Proctoring Engine**
> Phase 8.5 (Stub Migration & API Parity) is complete. Proctoring foundation (Backend, Risk Engine, DB Schema) is live. Wiring AI Vision next.


|  30+ PG Tables |  18 Mongo Collections |  60+ Feature Panels |  5 User Roles |  7 MCP Servers |
|:---:|:---:|:---:|:---:|:---:|

<br/>

[**Quick Start →**](_docs/initialization.md) · [**Architecture Context →**](_docs/architecture/context.md) · [**PG Schema →**](_docs/architecture/postgres.sql) · [**Mongo Schema →**](_docs/architecture/mongodb.js) · [**LMS Features →**](_docs/features/lms-features.html) · [**Placement →**](_docs/features/placement-features.html) · [**Exam →**](_docs/features/exam-features.html)

</div>

<br/>

> **Two files define this project:**
> | File | Purpose |
> |------|---------|
> | [`README.md`](README.md) | **How** we build — tech stack, architecture patterns, API conventions, project structure |
> | [`initialization.md`](_docs/initialization.md) | **Setup** — How to initialize the environment and run the project locally |
> | [`context.md`](_docs/architecture/context.md) | **What** we build — database schemas, feature maps, data flows, MCP tooling |

---

## 1. Development Flow

```
Database (Schema) → Backend (API) → Frontend (UI)
```

**Why this order:**

| Phase | Rationale |
|---|---|
| **DB first** | The schema is the contract. Well-designed tables = clean queries = predictable API shapes. Prevents denormalized messes and N+1 query disasters. |
| **Backend second** | API layer consumes the schema. Service layer coordinates business logic across PostgreSQL and MongoDB. API contracts are defined before any UI work. |
| **Frontend last** | Frontend consumes the API — it should never dictate it. UI is the thinnest layer, and building it last means the data layer is stable. |

> [!NOTE]
> UGSkill's DB schemas are already designed with partitioned tables, correct ownership splits, and cross-reference conventions.
> See [`schema/postgres.sql`](_docs/architecture/postgres.sql) and [`schema/mongodb.js`](_docs/architecture/mongodb.js).

---

## 2. Finalized Tech Stack

### 2.1 Database Layer

| Component | Technology | Purpose |
|---|---|---|
| **Relational DB** | PostgreSQL (Supabase) | Structured data — users, enrollments, scores, rankings, certificates, audit logs |
| **Document DB** | MongoDB (local / Atlas) | Flexible/nested content — question banks, course content trees, exam responses, event streams |
| **Sync Strategy** | CDC (Change Data Capture) | Keep PG and Mongo in sync where cross-references exist |

> Schema details: [`schema/postgres.sql`](_docs/architecture/postgres.sql) (30+ tables) · [`schema/mongodb.js`](_docs/architecture/mongodb.js) (15 collections)

### 2.2 Backend Layer

| Component | Technology | Why This Choice |
|---|---|---|
| **Runtime** | Node.js (TypeScript) | Fast I/O, huge ecosystem, same language as frontend |
| **Framework** | Express.js | Battle-tested, massive ecosystem, everyone knows it, huge community |
| **PostgreSQL ORM** | Drizzle ORM | TypeScript-native, close to raw SQL, no magic, works naturally with hand-designed schemas |
| **MongoDB ODM** | Mongoose | Most battle-tested ODM for complex document schemas |
| **Authentication** | JWT + Refresh Tokens | Stateless, works across mobile and web clients |
| **Job Queue** | BullMQ (Redis-backed) | Async jobs — CDC sync, score computation, notification dispatch, report generation |
| **Caching** | Redis | Session store, leaderboard snapshots, rate limiting, frequently accessed data |
| **File Storage** | S3-compatible (Supabase Storage / AWS S3 / MinIO) | Resumes, profile photos, exam media, course assets |
| **Logging** | Winston + Morgan | Structured logging (Winston) + HTTP request logging (Morgan) |
| **Error Tracking** | Sentry | Production error monitoring and alerting |

### 2.3 Frontend Layer

| Component | Technology | Why This Choice |
|---|---|---|
| **Framework** | React 19 + Vite 6 | Simple, fast, team knows React, clean separation from backend |
| **Server State** | React Query v5 (TanStack Query) | API calls, caching, background refetching, optimistic updates |
| **UI State** | Zustand | Lightweight, no boilerplate, for local/UI-only state |
| **Styling** | Vanilla CSS (custom design tokens) | Maximum control, zero runtime overhead, strict "Midnight Navy" design system |
| **Real-time** | Socket.io Client | Pairs with backend WebSocket layer for live features |
| **Routing** | React Router v6 | Client-side routing for SPA |
| **Forms** | React Hook Form + Zod | Performant forms with schema-based validation |
| **Icons** | Lucide React | Consistent, lightweight icon set used across all components |

> [!IMPORTANT]
> **Why React + Vite over Next.js:**
> - 90%+ of UGSkill is behind a login (dashboards, exams, admin panels) — no SEO needed
> - Simpler architecture — React is purely frontend, Fastify is purely backend, no blurred lines
> - Real-time features (exams, proctoring, live interviews) are naturally CSR
> - Easier deployment — static files to any CDN
> - Lower learning curve — team ships faster
>
> For the few public pages needing SEO (landing, course catalog), use **prerendering** or a separate static site.

---

## 3. MCP Tooling (AI-Assisted Development)

Seven MCP servers power the autonomous development workflow. Config lives in `~/.gemini/antigravity/mcp_config.json`.

| # | Server | Package | Purpose |
|---|--------|---------|---------|
| 1 | **Supabase** | `@supabase/mcp-server-supabase` | Run SQL, apply migrations, deploy edge functions, manage RLS — pushes schema to production PG |
| 2 | **Context7** | `@upstash/context7-mcp` | Fetches up-to-date library docs at code-gen time — prevents hallucinated APIs |
| 3 | **MongoDB** | `mongodb-mcp-server` | Query collections, run aggregations, manage indexes on local Mongo (`localhost:27017`) |
| 4 | **Sequential Thinking** | `@modelcontextprotocol/server-sequential-thinking` | Structured multi-step reasoning for architecture decisions and debugging |
| 5 | **Draw.io** | `drawio-mcp-server` | Generate ERDs, data flow diagrams, architecture visuals as `.drawio` files |
| 6 | **Figma** | `mcp-remote` (local SSE) | Design-to-code bridge for frontend development |
| 7 | **Memory** | `@modelcontextprotocol/server-memory` | Persistent knowledge graph across sessions — remembers decisions, preferences, and past context |

```
📝 Writing code?           → Context7 (always — for correct library APIs)
🗄️ Changing PG schema?     → Supabase MCP (apply_migration / execute_sql)
🍃 Querying Mongo?          → MongoDB MCP (find, aggregate, createIndex)
🧠 Complex decision?        → Sequential Thinking (structured step-by-step)
📊 Need a diagram?          → Draw.io MCP (ERD, flow, architecture)
🎨 Building UI from design? → Figma MCP (extract components, styles)
💾 Cross-session context?   → Memory MCP (persists decisions & preferences)
🤖 Proctoring AI signals?   → AI API (gaze / eye / face / head-pose analysis)
```

### Memory & Sequential Thinking — How We Use Them

| Scenario | Tool | How |
|---|---|---|
| Starting a new session | **Memory MCP** | Read memory graph to restore project context — no need to re-explain the stack |
| Architecture decision | **Sequential Thinking** | Run multi-step structured reasoning before committing to an approach |
| Proctoring signal fusion | **Sequential Thinking** | Model gaze + face + tab signals into a unified risk score step-by-step |
| Remembering a decision | **Memory MCP** | Save `{ key: 'project.focus', value: 'AI proctoring' }` after each major decision |
| Cross-DB bug | **Sequential Thinking** | Reason through PG ↔ Mongo CDC sync issues step-by-step |

> [!NOTE]
> The Memory MCP knowledge graph persists across sessions. Key memory items are also mirrored in `TODO.md` under **Memory Anchors** so they survive even if the MCP graph is reset.

---

## 4. Architecture Patterns

### 4.1 Backend Service Layer

```
routes/  →  services/  →  repositories/  →  DB
```

| Layer | Responsibility | Example |
|---|---|---|
| **Routes** | HTTP handler, auth check, input validation, response formatting | `POST /api/v1/exams/:id/submit` — validates JWT, validates body with Zod |
| **Services** | Business logic, cross-DB coordination, event firing | `examService.submit()` — writes to PG `exam_attempts`, writes to Mongo `exam_responses`, triggers score computation job |
| **Repositories** | Raw DB queries, nothing else | `examAttemptRepo.create()`, `examResponseRepo.save()` |

> [!WARNING]
> **We will never put Drizzle/Mongoose queries directly in route handlers.** Several UGSkill operations touch both PostgreSQL and MongoDB in one logical action. That coordination logic belongs in the service layer.

**Example — Exam Submission Flow:**
```
Route: POST /api/v1/exams/:examId/submit
  ↓ validates JWT, extracts studentId
  ↓ validates request body (answers, timing data)
  
Service: examService.submitExam(studentId, examId, answers)
  ↓ examAttemptRepo.create(attemptData)         → PostgreSQL
  ↓ examResponseRepo.saveResponses(responses)   → MongoDB
  ↓ scoringQueue.add({ attemptId })              → BullMQ (async)
  ↓ cdcEventEmitter.emit('exam.submitted', ...)  → CDC
  
Response: { success: true, attemptId: "..." }
```

### 4.2 Request-Response Flow (Standard)

```
Student Browser
  → React App (Vite SPA)
    → React Query (API call with JWT in Authorization header)
      → Express API Server
        → Auth Middleware (verify JWT)
          → Route Handler (validate input with Zod)
            → Service Layer (business logic)
              → Repository (Drizzle → PostgreSQL  or  Mongoose → MongoDB)
                → DB responds
              ← Repository returns data
            ← Service returns result
          ← Route formats response
        ← Express sends HTTP response
      ← React Query caches response + updates UI
    ← Component re-renders
  ← User sees updated page
```

### 4.3 Real-Time Flow (Exams, Proctoring, Live Interviews, GD)

```
Browser  ←→  Socket.io Client
                ↕
         Socket.io Server (Express integration)
                ↕
         Redis Pub/Sub (cross-instance communication)
                ↕
         BullMQ Workers (async processing)
```

**Real-time use cases:**
| Feature | Events |
|---|---|
| **Live Exam** | Timer sync, auto-submit on expiry, question navigation tracking |
| **Proctoring** | Tab switch detection, webcam frame analysis events, flag alerts |
| **Live Interview** | Session join/leave, interviewer notes sync, recording status |
| **Group Discussion** | Participant join/leave, turn tracking, moderator controls |
| **Leaderboard** | Score updates pushed to all viewers in real-time |

---

## 5. Project Folder Structure

### 5.1 Current Repository (Design Phase)

```
ugskill/
│
├── _docs/                  ← ALL Project Documentation
│   ├── architecture/       ← Core schemas, DB designs, Context logic
│   ├── features/           ← HTML Feature mappings
│   └── planning/           ← TODOs, Chunks, Changelogs
│
├── README.md               ← THIS FILE — tech stack, patterns, project structure
```

### 5.2 Backend (`ugskill-api/`) — Implemented

```
ugskill-api/
├── src/
│   ├── config/                  # Environment, DB connections, Redis, S3
│   │   ├── env.ts
│   │   ├── postgres.ts
│   │   ├── mongodb.ts
│   │   ├── redis.ts
│   │   └── s3.ts
│   │
│   ├── modules/                 # Feature modules (domain-driven)
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.repository.ts
│   │   │   ├── auth.schema.ts       # Zod validation schemas
│   │   │   └── auth.types.ts
│   │   │
│   │   ├── users/
│   │   │   ├── user.routes.ts
│   │   │   ├── user.service.ts
│   │   │   ├── user.repository.ts
│   │   │   └── user.controller.ts
│   │   │
│   │   ├── batch/
│   │   │   ├── batch.routes.ts
│   │   │   ├── batch.service.ts
│   │   │   ├── batch.repository.ts
│   │   │   └── batch.controller.ts
│   │   │
│   │   ├── course/                  ← NEW (Chunk 4a)
│   │   │   ├── course.routes.ts
│   │   │   ├── course.service.ts
│   │   │   ├── course.repository.ts          # Mongo
│   │   │   ├── course-catalog.repository.ts   # PG
│   │   │   ├── batch-access.repository.ts     # PG
│   │   │   ├── course.controller.ts
│   │   │   └── course.schemas.ts
│   │   │
│   │   ├── roadmap/                 ← NEW (Chunk 4a)
│   │   │   ├── roadmap.routes.ts
│   │   │   ├── roadmap.service.ts
│   │   │   ├── roadmap.repository.ts          # Mongo
│   │   │   ├── roadmap-catalog.repository.ts  # PG
│   │   │   ├── roadmap.controller.ts
│   │   │   └── roadmap.schemas.ts
│   │   │
│   │   ├── enrollment/              ← NEW (Chunk 4a)
│   │   │   ├── enrollment.routes.ts
│   │   │   ├── enrollment.service.ts
│   │   │   ├── enrollment.repository.ts       # PG
│   │   │   ├── enrollment.controller.ts
│   │   │   └── enrollment.schemas.ts
│   │   │
│   │   ├── exam/                    ← NEW (Chunk 6)
│   │   │   ├── exam.routes.ts
│   │   │   ├── exam.controller.ts
│   │   │   ├── exam.service.ts
│   │   │   ├── exam.schemas.ts
│   │   │   ├── exam.repository.ts              # PG (exams, sections, batch access)
│   │   │   ├── exam-attempt.repository.ts      # PG (attempts, scores, rankings)
│   │   │   ├── exam-question.repository.ts     # Mongo (question bank)
│   │   │   ├── exam-definition.repository.ts   # Mongo (exam definitions)
│   │   │   └── exam-response.repository.ts     # Mongo (responses + snapshots)
│   │   │
│   │   ├── placement/               # Chunk 5
│   │   └── notifications/           # Chunk 7
│   │
│   ├── middleware/               # Express middleware
│   │   ├── auth.ts                   # JWT verification + RBAC
│   │   ├── requestId.ts
│   │   └── errorHandler.ts
│   │
│   ├── jobs/                     # BullMQ job processors
│   │   ├── scoring.job.ts
│   │   ├── cdcSync.job.ts
│   │   ├── notification.job.ts
│   │   └── reportGeneration.job.ts
│   │
│   ├── websocket/                # Socket.io event handlers
│   │   ├── exam.ws.ts
│   │   ├── proctoring.ws.ts
│   │   ├── interview.ws.ts
│   │   └── leaderboard.ws.ts
│   │
│   ├── db/
│   │   ├── pg/
│   │   │   ├── schema/              # Drizzle schema definitions
│   │   │   └── migrations/          # Drizzle migrations
│   │   └── mongo/
│   │       ├── models/              # Mongoose models
│   │       └── indexes.ts
│   │
│   ├── lib/                      # Shared utilities
│   │   ├── logger.ts
│   │   ├── errors.ts               # Custom error classes
│   │   ├── pagination.ts
│   │   └── jwt.ts
│   │
│   ├── app.ts                    # Express app setup
│   └── server.ts                 # Entry point
│
├── tests/
├── drizzle.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```

### 5.3 Frontend (`ugskill-web/`) — 🔄 Phase 8 API Integration In Progress

```
ugskill-web/
├── src/
│   ├── components/
│   │   ├── ui/                        # Design system primitives
│   │   │   ├── Button.tsx / Button.css
│   │   │   ├── Badge.tsx
│   │   │   ├── TextInput.tsx
│   │   │   ├── IconButton.tsx
│   │   │   └── Primitives.css         # Shared token-based CSS
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx            # Role-aware nav (student / admin sections)
│   │   │   ├── Navbar.tsx             # Profile dropdown, notifications
│   │   │   └── DashboardLayout.tsx    # Sidebar + Navbar shell
│   │   ├── loaders/
│   │   │   ├── AuraProgress.tsx       # SVG animated loader
│   │   │   └── Skeleton.tsx           # Pulse skeleton placeholders
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx     # JWT-aware route guard
│   │   └── features/
│   │       └── course/
│   │           └── CourseCard.tsx
│   │
│   │   ├── pages/                         # Route-level pages
│   │   │   ├── Login.tsx                  # Real JWT auth (dev bypass removed)
│   │   │   ├── Signup.tsx
│   │   │   ├── ForgotPassword.tsx
│   │   │   ├── ResetPassword.tsx
│   │   │   ├── Dashboard.tsx              # LMS widgets, streak calendar
│   │   │   ├── Discover.tsx               # ✅ API integrated — useQuery + search debounce
│   │   │   ├── CourseLanding.tsx          # ✅ API integrated — enroll mutation
│   │   │   ├── VideoPlayer.tsx            # ✅ API integrated — real lecture + notes save
│   │   │   ├── AssignmentSubmit.tsx       # ✅ API integrated — multipart upload
│   │   │   ├── PlacementsHub.tsx          # ✅ API integrated — drives + kanban
│   │   │   ├── CompanyDetail.tsx          # ✅ API integrated — drive detail + apply
│   │   │   ├── InterviewPrep.tsx          # ✅ API integrated — sessions + schedule mock
│   │   │   ├── ReadinessAnalytics.tsx     # ✅ API integrated — radar chart + AI insights
│   │   │   ├── Community.tsx              # ✅ API integrated — infinite query + like/bookmark/publish
│   │   │   ├── Leaderboards.tsx           # ✅ API integrated — scope tabs + my rank card
│   │   │   ├── LiveGD.tsx                 # ✅ API integrated — session fetch + leave mutation
│   │   │   ├── LiveInterview.tsx          # 🆕 NEW — fullscreen interview room
│   │   │   ├── Profile.tsx                # 🆕 NEW — edit profile + change password
│   │   │   ├── Notifications.tsx          # 🆕 NEW — paginated notification list
│   │   │   ├── CertificateViewer.tsx      # 🆕 NEW — certificate card + verify/download
│   │   │   ├── Exams.tsx                  # ✅ API integrated — exam list with status tabs
│   │   │   ├── ExamInterface.tsx          # ✅ API integrated — fullscreen proctored exam
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.tsx     # 🔄 Pending API integration
│   │   │       ├── UserDirectory.tsx      # 🔄 Pending API integration
│   │   │       ├── BatchManagement.tsx    # 🔄 Pending API integration
│   │   │       ├── CourseBuilder.tsx      # 🔄 Pending API integration
│   │   │       ├── QuizBuilder.tsx        # 🔄 Pending API integration
│   │   │       ├── PlacementsConfig.tsx   # 🔄 Pending API integration
│   │   │       └── ExamOps.tsx            # 🔄 Pending API integration
│   │
│   ├── components/ui/
│   │   └── AIChatbot.tsx                  # Floating AI chat sidebar (global)
│   │   GlobalNotifications.tsx            # Header bell dropdown (global)
│   │
│   ├── store/
│   │   ├── auth.store.ts              # Zustand — JWT, user (real auth, no bypass)
│   │   └── dashboard.store.ts         # Zustand — sidebar, UI state
│   │
│   ├── lib/
│   │   ├── api.ts                     # Axios instance with JWT interceptor + refresh queue
│   │   ├── useDebounce.ts             # 🆕 useDebounce hook for search inputs
│   │   └── utils.ts                   # cn() classname helper
│   │
│   ├── App.tsx                        # React Router v6 route tree
│   ├── main.tsx                       # QueryClientProvider + StrictMode
│   └── index.css                      # Global design tokens (Midnight Navy)
│
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 6. API Design Conventions

### 6.1 URL Structure

```
/api/v1/{resource}
```

**All endpoints are versioned from day one.** Examples:

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Login |
| `POST` | `/api/v1/auth/refresh` | Refresh JWT |
| `GET` | `/api/v1/courses` | List courses (paginated) |
| `GET` | `/api/v1/courses/:id` | Get course detail |
| `POST` | `/api/v1/enrollments` | Enroll in a course |
| `POST` | `/api/v1/exams/:id/start` | Start an exam attempt |
| `POST` | `/api/v1/exams/:id/submit` | Submit exam answers |
| `GET` | `/api/v1/placements/drives` | List placement drives |
| `POST` | `/api/v1/placements/drives/:id/apply` | Apply to a drive |

### 6.2 Standard Response Format

**Success:**
```json
{
  "success": true,
  "data": { },
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "ENROLLMENT_CLOSED",
    "message": "Enrollment for this course has ended.",
    "details": {
      "courseId": "course_abc123",
      "closedAt": "2026-04-01T00:00:00Z"
    }
  }
}
```

### 6.3 Authentication

- **Access Token:** Short-lived JWT (15 min), sent in `Authorization: Bearer <token>`
- **Refresh Token:** Long-lived (7 days), stored in HTTP-only cookie
- **Token payload:**
```json
{
  "sub": "user_uuid",
  "role": "student",
  "institutionId": "inst_uuid",
  "iat": 1712930400,
  "exp": 1712931300
}
```

**Roles:** `super_admin` · `institution_admin` · `faculty` · `student` · `company_admin` · `recruiter`

---

## 7. Cross-Cutting Concerns

### 7.1 Rate Limiting

| Endpoint Category | Limit | Why |
|---|---|---|
| Auth (login, register) | 5 req/min per IP | Brute-force protection |
| Exam submission | 1 req/attempt | Prevent duplicate submissions |
| General API | 100 req/min per user | Fair usage |
| File upload | 10 req/min per user | Prevent abuse |

### 7.2 Caching Strategy (Redis)

| Data | TTL | Pattern |
|---|---|---|
| Course catalog | 5 min | Cache-aside |
| User session | 15 min | JWT validation cache |
| Leaderboard | 30 sec | Snapshot cache, invalidated on score update |
| Exam questions (during attempt) | Duration of exam | Loaded once, served from cache |

### 7.3 File Storage

| Content Type | Storage Location | Access |
|---|---|---|
| Profile photos | `/{userId}/profile/` | Public (signed URL) |
| Resumes | `/{userId}/resumes/` | Private (signed URL, recruiter access) |
| Course media | `/courses/{courseId}/media/` | Enrolled students only |
| Exam attachments | `/exams/{examId}/media/` | During attempt only |

### 7.4 Observability

| Concern | Tool | Integration |
|---|---|---|
| Structured logging | Winston + Morgan | Winston for app logs, Morgan for HTTP access logs |
| Error tracking | Sentry | Backend + Frontend SDKs |
| API monitoring | Custom metrics → Prometheus/Grafana | Request latency, error rates, queue depth |
| Uptime | Health check endpoint `/api/v1/health` | External monitor (UptimeRobot / Betterstack) |

---

## 8. State Management Rules

> [!IMPORTANT]
> **Do NOT mix React Query and Zustand responsibilities.**

| State Type | Tool | Examples |
|---|---|---|
| **Server state** (data from API) | React Query | Courses, user profile, exam data, enrollment status |
| **UI state** (client-only) | Zustand | Sidebar open/close, modal visibility, theme, current exam question index |
| **Form state** | React Hook Form | Login form, registration, exam answers in progress |
| **URL state** | React Router | Current page, query params, filters |
| **Real-time state** | Socket.io + Zustand | Live timer, proctoring alerts, connected participants |

---

## 9. Implementation Roadmap

### Phase 1 — Foundation ✅
- [x] Scaffold backend (`ugskill-api`) — Express + TypeScript + Drizzle + Mongoose
- [ ] Scaffold frontend (`ugskill-web`) — React + Vite + Tailwind + React Query
- [x] Set up PostgreSQL (Supabase) and MongoDB connections
- [x] Set up Redis connection
- [x] Implement config management (env vars, validation with Zod)
- [x] Build health check endpoint
- [x] Set up Winston + Morgan logging

### Phase 2 — Auth & Users ✅
- [x] Auth module — register, login, JWT + refresh tokens
- [x] User profiles — CRUD, role-based access
- [x] RBAC middleware
- [ ] Protected routes on frontend
- [ ] Login/Register pages

### Phase 3 — LMS (Core + Student Experience) ✅
- [x] Course CRUD (admin/creator) — Mongo + PG catalog sync
- [x] Course search via PG catalog
- [x] Enrollment flow — enroll, check-access, list-mine
- [x] Batch course access — grant/revoke per batch
- [x] Course content delivery (MongoDB content blocks)
- [x] Course progress tracking, streaks, and certificates
- [x] Quiz definitions and student attempt engine
- [x] Assignment submission and grading flow
- [x] Course reviews and moderation system

### Phase 4 — Exams ✅
- [x] Exam creation (admin/faculty) — PG `exams` + Mongo `exam_definitions`
- [x] Question bank management (MongoDB `exam_question_bank`)
- [x] Exam sections & batch access — PG `exam_sections`, `exam_batch_access`
- [x] Exam attempt flow — start, save incremental, submit
- [x] Scoring pipeline — sync MVP, BullMQ offload ready → PG `exam_scores`
- [x] Rankings — PG `exam_rankings`
- [x] Exam proctoring events — Mongo `exam_proctoring_events`
- [x] Real-time exam timer (Socket.io) — implemented in Chunk 8
- [x] Async scoring via BullMQ — implemented in Chunk 7

### Phase 5 — Placements ✅
- [x] Company & recruiter management
- [x] Drive creation and publishing
- [x] Student applications
- [x] Eligibility filtering
- [x] Interview scheduling
- [x] Mock interviews & GD management
- [x] Readiness scoring & Peer groups
- [x] Proctoring events ingestion

### Phase 6 — Polish & Scale ✅
- [x] Notification system (in-app + email via BullMQ)
- [x] File upload (S3-compatible)
- [x] Rate limiting
- [x] Sentry integration
- [x] Performance optimization / Caching layer
- [x] Load testing
- [x] OpenAPI / Swagger Documentation
- [x] WebSockets (Chat, Rooms, Tracking, Leaderboard)

### Phase 7 — Frontend SPA (React) ✅
- [x] **Chunk F1: Foundation & Design System** — Vite 6 + React 19 + TS, Midnight Navy token system, Button, Skeleton, AuraProgress loader
- [x] **Chunk F2: Auth & Layout Shells** — Login, Signup, ForgotPassword, ResetPassword, DashboardLayout, Sidebar (role-aware), Navbar (profile dropdown), ProtectedRoute, devLogin bypass
- [x] **Chunk F3: Student Portal — LMS Experience** — Dashboard widgets + streak calendar, Discover catalog, CourseLanding, VideoPlayer (fullscreen 70/30), AssignmentSubmit (drag-drop + S3 progress)
- [x] **Chunk F4: Student Portal — Placements & Community** — PlacementsHub (grid/Kanban), CompanyDetail (rounds + apply), Community (post feed, compose, like/reply, tag filters)
- [x] **Chunk F5: Student Portal — Live Exam Engine** — Exam list (status tabs + scores), ExamInterface (fullscreen: countdown timer, question palette, flag system, anti-cheat, submit modal, results screen)
- [x] **Chunk F6: Admin — General & User Management** — KPI dashboard (recharts radar), UserDirectory (sortable table + bulk actions), BatchManagement (cohort access split-panel)
- [x] **Chunk F7: Creator — LMS Builder** — CourseBuilder (3-step stepper: metadata → curriculum → media), QuizBuilder (MCQ authoring + answer key + explanations)
- [x] **Chunk F8: Admin — Placements & Exam Ops** — PlacementsConfig (drive + eligibility configurator with live preview), ExamOps (live proctoring command center with incident log)
- [x] **Chunk F9: Platform-wide Polish** — AIChatbot (floating global sidebar), GlobalNotifications (header bell dropdown), LiveGD (video-call GD grid), Leaderboards (podium + ranked table)

### Phase 9 — AI Proctoring (Current Priority 🔴)
- [ ] **P9-P (FIRST):** AI-powered proctoring engine
  - Backend: `src/modules/proctoring/` module + AI API client (`aiProctoring.ts`)
  - AI API signals: gaze direction, eye presence, face detection, head pose, confidence score
  - Violation scoring engine: LOW → MEDIUM → HIGH → CRITICAL tiers + unified `riskScore`
  - BullMQ async frame analysis job (non-blocking AI API calls)
  - REST: `POST /proctoring/frame`, `GET /violations`, `GET /summary`, `POST /override`
  - WebSocket upgrades: `proctoring:ai-alert`, `proctoring:warning`, `proctoring:terminated`
  - Frontend: frame capture every 5s in `ExamInterface.tsx`, gaze warning overlay, upgraded pre-flight
  - Admin: risk-score grid in `ExamOps.tsx`, new `ProctoringReport.tsx` page
  - DB: extend `exam_proctoring_events` schema + add `proctoringConfig` to `exams` PG table
- [ ] P9-A: Payments (Razorpay/Stripe)
- [ ] P9-B: Transactional email (Resend/SendGrid)
- [ ] P9-D: Coding judge (Judge0)
- [ ] P9-E: Full AI integrations (chatbot, readiness, mock interview)
- [ ] P9-F/G: Instructor grading + analytics
- [ ] P9-H: Mobile app (PWA first)
- [ ] P9-I: Multi-tenancy (SaaS)

---

## 10. Key Architecture Decisions Log

| Decision | Choice | Rationale | Date |
|---|---|---|---|
| Development flow | DB → Backend → Frontend | Schema is the contract; prevents denormalized messes | Apr 12, 2026 |
| Frontend framework | React + Vite (not Next.js) | 90%+ app is behind login (no SSR needed), simpler architecture | Apr 12, 2026 |
| Backend framework | Express.js | Battle-tested, massive ecosystem, everyone knows it, faster to develop with | Apr 13, 2026 |
| PostgreSQL ORM | Drizzle | Close to raw SQL, matches hand-designed schema philosophy | Apr 12, 2026 |
| State management | React Query + Zustand | RQ for server state, Zustand for UI state — clean separation | Apr 12, 2026 |
| Backend architecture | routes → services → repositories | Critical for PG + Mongo coordination in single operations | Apr 12, 2026 |
| API versioning | `/api/v1/...` from day one | API shape will change; plan for it now | Apr 12, 2026 |
| Real-time | Socket.io | Exams, proctoring, interviews, GD, leaderboards need bidirectional real-time | Apr 12, 2026 |
| Job processing | BullMQ (Redis) | CDC sync, scoring, notifications must be async | Apr 12, 2026 |
| Hybrid DB sync | CDC (Change Data Capture) | PG ↔ Mongo cross-references need eventual consistency | Apr 12, 2026 |
| Hybrid DB sync | Full asynchronous BullMQ/CDC implemented | Synchronous dual-writes refactored out in Chunk 7 | Apr 17, 2026 |
| AI dev tooling | 7 MCP servers | Context7 for docs, Supabase/Mongo for DB, Draw.io for diagrams, Sequential Thinking for reasoning | Apr 13, 2026 |
| Folder structure | `schema/` + `docs/` (no spaces) | CLI-friendly, clean, descriptive names | Apr 13, 2026 |
| Frontend Foundation | Initialized `ugskill-web` | React 19 + Vite + TypeScript. Strict Vanilla CSS tokens. | Apr 18, 2026 |
| Frontend Styling | Vanilla CSS over Tailwind | Hand-crafted design token system — full control, zero runtime cost, matches design spec exactly | Apr 18, 2026 |
| Dev Auth Bypass | `devLogin()` in auth store | Injects mock Admin token so frontend can be tested without backend running | Apr 18, 2026 |
| F1–F5 Shipped | 14 pages + design system live | Full student portal: auth, LMS, placements, community, live exam engine — all in one session | Apr 18, 2026 |
| F6–F9 Shipped | Admin/creator portals + platform features | KPI dash, user dir, batch mgmt, CourseBuilder, QuizBuilder, ExamOps, PlacementsConfig, AIChatbot, GD, Leaderboards | Apr 18, 2026 |
| Build Stabilized | Zero TS errors | Resolved 20+ TS6133 warnings across 12 files; production bundle compiles in <2s | Apr 18, 2026 |
| I1–I3 Shipped | Auth + LMS pages API-integrated | Real JWT flow; Discover, CourseLanding, VideoPlayer, Exams, ExamInterface, AssignmentSubmit all use live `useQuery` | Apr 20, 2026 |
| I4 Shipped | Placements pages API-integrated | PlacementsHub, CompanyDetail, InterviewPrep, ReadinessAnalytics — all mock data removed | Apr 20, 2026 |
| I5 Shipped | Community/Social pages API-integrated | Community (infinite scroll + like/bookmark), Leaderboards (scope tabs), LiveGD (session fetch/leave) | Apr 20, 2026 |
| I7 Shipped | 4 new pages built | LiveInterview (fullscreen room), Profile (edit + password), Notifications (paginated), CertificateViewer (card + verify) | Apr 20, 2026 |
| useDebounce Hook | `lib/useDebounce.ts` | Shared debounce for search inputs across Community, Discover, UserDirectory | Apr 20, 2026 |
| Phase 8 Complete | All API integration done | Full I1–I10 done; real auth, real data, sockets wired, deployed | Apr 29, 2026 |
| Phase 9 Priority Set | P9-P (AI Proctoring) is #1 next build | AI API in hand for gaze/eye/face. Existing: `exam_proctoring_events` + `proctoring.ws.ts` | Apr 29, 2026 |
| Phase 8.5 Complete | API Parity & Stub Migration | Removed `stubRouter`. All modules (Notifications, Leaderboards, Community, etc.) are now production-ready. | Apr 30, 2026 |
| Proctoring Foundation | Risk scoring & Event ingestion | Implemented `ProctoringService` with risk-based auto-termination and MongoDB telemetry. | Apr 30, 2026 |

---

<div align="center">



[⬆ Back to top](#-ugskill)

</div>

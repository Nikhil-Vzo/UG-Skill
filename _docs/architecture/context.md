# UGSkill Platform — Architectural Context

> **Purpose:** Single source of truth for any AI model or developer working on this project.
> Update this file whenever the data model, module scope, or tech decisions change.
> Last updated: April 17, 2026

> **⚠️ RULES:**
> - Always use **Context7 MCP** when generating code or looking up library/framework documentation.
> - Use **Sequential Thinking MCP** for complex multi-step reasoning and architectural decisions.
> - Use **Draw.io MCP** to generate diagrams (ERDs, data flows, architecture) so anyone can read them easily.

---

## 1. What We're Building

**UGSkill** is an education-technology platform with **three core modules**:

| Module | Purpose |
|--------|---------|
| **LMS** | Course/Roadmap catalogs, enrollment, video/content consumption, quizzes, assignments, streaks, certificates, AI tutor |
| **Placement** | Company management, interview flows, mock interviews (AI + Human), Group Discussions, proctoring, readiness scoring |
| **Exam** | Test engine, polymorphic question bank, sectioned exams, proctoring, evaluation, analytics, rankings |

**User Roles:** `student` · `creator` · `admin` · `hr` · `proctor`

---

## 2. Hybrid Database Strategy

```
┌──────────────────────────────────────────┐
│            PostgreSQL (Supabase)          │
│         Source of Truth / ACID / Analytics│
└──────────────┬───────────────────────────┘
               │  CDC / Event-driven sync
┌──────────────▼───────────────────────────┐
│              MongoDB                      │
│    Flexible Content / Events / Polymorphic│
└──────────────────────────────────────────┘
```

### 2.1 Guiding Principles

- **PostgreSQL owns:** identity, sessions, roles, batches, enrollments, computed scores, rankings, certificates, schedules, audit logs, notifications.
- **MongoDB owns:** course content trees, roadmap definitions, question banks (polymorphic), interview flow configs, company profiles, exam attempt state, proctoring events, AI chat history, activity events, AI-generated content, recording metadata.
- **Sync Strategy:** In early backend implementation phases (Chunks 4-6), the service layer will synchronously dual-write (Saga-style) to both Mongo and PG for simplicity. In Chunk 7+, this will be refactored to use async BullMQ/CDC workers.
- **CQRS where shapes differ:** Writes go to the owning DB; reads may come from materialized copies in the other DB.

### 2.2 Cross-Reference Convention

| Direction | Storage Type | Field Naming | Example |
|-----------|-------------|-------------|---------|
| PG → Mongo | `TEXT` column holding MongoDB `ObjectId` string | `mongo_*_id` | `enrollments.enrollable_id = '507f1f77bcf86cd799439011'` |
| Mongo → PG | `STRING` field holding PostgreSQL `UUID` | `pg_*_id` | `courses.pg_creator_id = '550e8400-e29b-41d4-a716-446655440000'` |

---

## 3. PostgreSQL Schema (Supabase)

**File:** `schema/postgres.sql` (713 lines)

### Extensions
- `pgcrypto` — UUID generation (`gen_random_uuid()`)
- `pg_trgm` — Trigram-based fuzzy search

### Utility
- `set_updated_at()` trigger function — auto-updates `updated_at` on every `UPDATE`

### Module 0 — Core / Identity
| Table | Purpose | Key Details |
|-------|---------|-------------|
| `users` | All platform users | UUID PK, multi-role via `TEXT[]`, soft-delete, OAuth support |
| `user_sessions` | Active login sessions | Token hash, IP, user-agent, expiry |
| `batches` | Student cohorts | Institution-scoped, status lifecycle |
| `batch_members` | M:N user ↔ batch | Role within batch (student/mentor/admin) |
| `audit_logs` | Immutable action log | **Partitioned by month** (`RANGE` on `created_at`) |

### Module 1 — LMS
| Table | Purpose | Key Details |
|-------|---------|-------------|
| `course_catalog` | PG-side course search/filter | Materialized from MongoDB `courses`, `tsvector` column for FTS |
| `roadmap_catalog` | PG-side roadmap search/filter | Materialized from MongoDB `roadmaps` |
| `enrollments` | Student ↔ course/roadmap | Polymorphic via `enrollable_type` + `enrollable_id` (Mongo ObjectId as TEXT) |
| `lecture_completions` | Per-lecture completion tracking | FK to user + enrollment, stores `watch_duration_secs` |
| `quiz_attempts` | Quiz attempt summary | FK to enrollment, score + attempt_number |
| `assignment_submissions` | Student assignments | File URL, deadline, grading state |
| `course_reviews` | Star ratings & text reviews | Moderation status, FK to user + `mongo_course_id` |
| `certificates` | Completion certificates | Unique `verification_code`, PDF URL |
| `student_streaks` | Learning streak tracking | Current/longest streak, last activity date |
| `progress_summary` | Materialized progress view | Aggregated from MongoDB activity events |
| `batch_course_access` | Batch → course permissions | Access period with `granted_at` / `expires_at` |

### Module 2 — Placement
| Table | Purpose | Key Details |
|-------|---------|-------------|
| `companies` | Company master data | Logo, website, status, `mongo_profile_id` |
| `company_drives` | Placement drives | Date range, eligibility criteria (CGPA, batch) |
| `drive_registrations` | Student → drive registration | Status lifecycle (registered → shortlisted → selected) |
| `placement_sessions` | Interview/mock sessions | Type (mock_interview/live_interview), status state machine |
| `readiness_scores` | Computed readiness per company+role | Composite scores, recalculated after each activity |
| `gd_sessions` | Group Discussion sessions | Topic, moderator, status, batch-linked |
| `gd_participants` | Student ↔ GD session | Per-participant scores (leadership, clarity, contribution) |
| `live_interview_slots` | Admin-created time slots | Interviewer assignment, capacity |
| `live_interview_bookings` | Student slot bookings | Confirmation status, reschedule support |
| `peer_groups` | Student study groups | Max members, created by student or admin |
| `peer_group_members` | M:N user ↔ peer group | Join date tracking |
| `peer_sessions` | Peer mock sessions | Interviewer/interviewee role tracking |

### Module 3 — Exam
| Table | Purpose | Key Details |
|-------|---------|-------------|
| `exams` | Exam master definition | Type, duration, sections config, proctoring toggle, `mongo_definition_id` |
| `exam_batch_access` | Batch → exam permissions | Access window start/end |
| `exam_sections` | Section breakdown | Order, marks, question count, duration |
| `exam_attempts` | Per-student attempt | Status state machine (not_started → in_progress → submitted → evaluated), `mongo_response_id` |
| `exam_scores` | Computed scores | **Partitioned by quarter** (`RANGE` on `scored_at`), percentile |
| `exam_rankings` | Per-exam leaderboard | Rank, percentile, batch-scoped |
| `notification_logs` | All notifications | **Partitioned by month**, multi-channel (email/push/in-app) |

### Partitioned Tables
| Table | Strategy | Granularity |
|-------|----------|-------------|
| `audit_logs` | `RANGE (created_at)` | Monthly |
| `exam_scores` | `RANGE (scored_at)` | Quarterly |
| `notification_logs` | `RANGE (created_at)` | Monthly |

---

## 4. MongoDB Schema

**File:** `schema/mongodb.js` (710 lines)

### Module 1 — LMS Collections
| Collection | Purpose | Key Patterns |
|-----------|---------|--------------|
| `courses` | Full content tree: sections[] → lectures[] → resources[] | JSON Schema validated, text index on title/description |
| `roadmaps` | Multi-stage learning paths with prerequisite graphs | Embedded stages[] with course refs |
| `quiz_definitions` | Quiz config + embedded questions (< 100) | Attached to lecture/section, MCQ/true-false types |
| `quiz_attempt_details` | Detailed per-question attempt data | Cross-ref `pg_attempt_id`, topic accuracy map |
| `ai_chat_sessions` | AI Tutor conversation threads | Bucket-pattern aware (16MB guard), TTL 12 months |
| `activity_events` | High-write event stream (watch, quiz, login) | TTL 12 months, **sharded** by `pg_student_id` |

### Module 2 — Placement Collections
| Collection | Purpose | Key Patterns |
|-----------|---------|--------------|
| `question_bank` | Polymorphic: aptitude/coding/technical/hr/gd_topic | Company-tagged, difficulty-tagged, version history |
| `interview_flows` | Variable-structure round configs per company | Sequential/parallel dependency, deeply nested round configs |
| `company_profiles` | Extended company info (skills, patterns, GD history) | Cross-ref `pg_company_id`, wildcard index on skills |
| `mock_interview_attempts` | Per-question mock interview data + AI scores | Cross-ref `pg_session_id`, aggregate scores block |
| `proctoring_events` | Shared event stream (placement + exam) | TTL 90 days, **sharded** by `session_id`, severity levels |
| `gd_recordings` | GD video + speaker-labelled transcript | AI analysis (contribution, clarity, leadership per participant) |

### Module 3 — Exam Collections
| Collection | Purpose | Key Patterns |
|-----------|---------|--------------|
| `exam_question_bank` | Polymorphic: mcq_single/mcq_multi/coding/descriptive/numerical/fill_blank/matching | Source tagging (GATE, JEE, original), bloom taxonomy |
| `exam_definitions` | Full exam structure with question pool rules | Section-level pool configs with fallback strategies |
| `exam_responses` | Per-question response data per attempt | Randomized question sequence, topic summary |
| `exam_proctoring_events` | Exam-specific proctoring (separate TTL/shard) | TTL 12 months, **sharded** by `session_id` |

### Cross-Cutting Collections
| Collection | Purpose | Key Patterns |
|-----------|---------|--------------|
| `user_snapshots` | Materialized PG user data for fast AI reads | Unique on `pg_user_id`, skill profile, synced via CDC |
| `ai_generated_content` | AI outputs (quizzes, outlines, summaries, feedback) | Review status workflow, TTL 90 days for non-approved |

### Sharded Collections
| Collection | Shard Key | Strategy |
|-----------|-----------|----------|
| `activity_events` | `pg_student_id` | Hash |
| `proctoring_events` | `session_id` | Hash |
| `exam_proctoring_events` | `session_id` | Hash |

### TTL Indexes
| Collection | TTL |
|-----------|-----|
| `activity_events` | 12 months |
| `ai_chat_sessions` | 12 months |
| `proctoring_events` | 90 days |
| `exam_proctoring_events` | 12 months |
| `ai_generated_content` | 90 days (non-approved) |

---

## 5. Module Feature Map

### 5.1 LMS Module (3 roles × 18 panels)

#### Student Panels
| Panel | AI? | Scope |
|-------|-----|-------|
| Course Discovery & Enrollment | No | Browse catalog, search, enroll, wishlist |
| Video Player & Content Consumption | No | Adaptive streaming, playback controls, bookmarks |
| Progress & Streak Tracking | No | Visual progress, streaks, activity heatmap |
| Quiz & Assignment Interaction | No | Take quizzes, submit assignments, view grades |
| AI Tutor | Yes | In-video Q&A, doubt solving, semantic search |
| Student Dashboard | No | Continue learning, upcoming deadlines, activity summary |
| Student Notifications | No | Enrollment confirmations, deadline reminders |
| Recommendation Engine | Yes | AI-powered personalized course suggestions |
| Certificate & Achievement | No | Auto-generated certificates, downloadable PDF |

#### Creator Panels
| Panel | AI? | Scope |
|-------|-----|-------|
| Course Builder | No | Create courses, sections, lectures, uploads |
| Content & Media Upload | No | Video encoding, PDF, external links |
| Course Details & Metadata | No | Pricing, SEO, topic tags |
| Roadmap / Path Design | No | Multi-stage learning journeys, prerequisites |
| Quiz & Assignment Creation | No | MCQ builder, auto-grading, assignment deadlines |
| AI Content Tools | Yes | Quiz generation, outline generation, summarization |
| Course Analytics | No | Enrollments, completion rate, drop-off analysis |
| Creator Dashboard | No | KPI cards, content management |
| Creator Notifications | No | Approval alerts, grading reminders |

#### Admin Panels
| Panel | AI? | Scope |
|-------|-----|-------|
| User Management | No | Registration, auth, roles, sessions, access control |
| Access & Batch Control | No | Batches, private/public courses, permissions |
| Course Approval & Moderation | No | Review queue, approve/reject, versioning |
| Admin Dashboard | No | Platform-wide KPIs |
| Platform-Wide Analytics | No | Topic mastery, consistency tracking, retention |

### 5.2 Placement Module (3 roles × 21 panels)

#### Student Panels
| Panel | AI? | Scope |
|-------|-----|-------|
| Mock Interview (AI + Human) | Yes | AI mock sessions, human evaluator sessions |
| Interview Proctoring | No | Face/audio/tab detection, integrity scoring |
| Group Discussion (GD) | No | Join sessions, participate, view feedback |
| Feedback & Evaluation | No | Score breakdown, AI analysis, improvement tips |
| Interview Readiness | Yes | Readiness score, company-wise, skill gap detection |
| Interview Analytics | No | Performance trends, round-wise, peer comparison |
| Personalization Engine | Yes | Adaptive difficulty, weak-area targeting, spaced repetition |
| Group & Community | No | Study groups, peer practice, leaderboard |
| Notification System | No | Interview reminders, readiness alerts |
| Dashboard System | No | Readiness widget, upcoming sessions, past sessions |

#### Creator (HR/Recruiter) Panels
| Panel | AI? | Scope |
|-------|-----|-------|
| Interview Flow Management | No | Design round sequences, configure round types |
| Interview Test Engine | No | Assemble question sets, set parameters |
| Group Discussion (GD) | No | Moderate GDs, score participants |
| Feedback & Evaluation | No | Score candidates, debrief notes |
| Live Interview System | No | Conduct live interviews, evaluate |
| Interview Analytics | No | Batch-level performance, hiring reports |
| Question Bank (Interview) | No | CRUD questions, difficulty/company tagging |
| AI Interview Intelligence | Yes | AI question generation, NLP evaluation, speech analysis |

#### Admin Panels
| Panel | AI? | Scope |
|-------|-----|-------|
| Company Management | No | Company profiles, drives, eligibility |
| Interview Flow Management | No | Flow approval, version control |
| Interview Test Engine | No | Test scheduling, batch assignment |
| Interview Proctoring | No | Violation review, threshold config |
| Live Interview System | No | Slot management, interviewer assignment |
| Interview Analytics | No | Platform-wide placement metrics |
| Question Bank (Interview) | No | Bank governance, quality audit |
| Scheduling System | No | Slot creation, batch scheduling, reminders |
| Recording & Playback | No | Session archives, transcript access |
| Notification System | No | Notification pipeline config |
| Dashboard System | No | Admin placement overview |
| Access & Control | No | Role-based access, eligibility gates |
| System Infra | No | WebRTC, session management, scaling |
| Security | No | JWT sessions, encryption, fraud detection |

### 5.3 Exam Module (3 roles × ~12 panels)

#### Student Panels
- Exam Discovery & Registration
- Test-Taking Interface (timer, section navigation, question palette)
- Proctoring Compliance
- Results & Score Card
- Answer Review
- Analytics & Improvement

#### Creator Panels
- Question Bank Management (polymorphic CRUD)
- Exam Builder (section config, pool rules)
- Evaluation Dashboard (manual grading)
- AI Question Generation

#### Admin Panels
- Exam Scheduling & Access
- Proctoring Review
- Ranking & Leaderboard
- Platform Exam Analytics

---

## 6. Data Flow Patterns

### 6.1 CDC Sync Patterns
```
PG (users) → Event Bus → MongoDB (user_snapshots)     [read-only replica]
PG (companies) → Event Bus → MongoDB (company_profiles) [extended profile]
MongoDB (courses) → Event Bus → PG (course_catalog)    [search/filter/sort]
MongoDB (exam_responses) → Worker → PG (exam_scores)   [leaderboard/ranking]
MongoDB (activity_events) → Worker → PG (progress_summary) [materialized progress]
```

### 6.2 Consistency Model
| Scenario | Pattern | Consistency |
|----------|---------|-------------|
| Enrollment → unlock | PG transaction | Strong (ACID) |
| Exam submit → score → leaderboard | Saga (Mongo → worker → PG) | Eventual (seconds) |
| Proctoring violation → alert | Mongo write + WebSocket | Real-time, best-effort |
| Course created → catalog | Mongo write → CDC → PG upsert | Eventual (seconds) |
| Score computed → certificate | PG trigger → job queue → PDF | Eventual (minutes) |

### 6.3 Error Handling
- Cross-DB operations use the **Saga pattern with compensation**
- Failed PG writes after successful Mongo writes are **queued for retry** (exponential backoff)
- Never rollback a successful Mongo write — queue compensation instead

---

## 7. Schema Conventions

### PostgreSQL
- `snake_case` for all names, plural table names (`users`, `enrollments`)
- `UUID` primary keys via `gen_random_uuid()`
- `TIMESTAMPTZ` for all timestamps
- `created_at` + `updated_at` on every table (with trigger)
- `deleted_at TIMESTAMPTZ NULL` for soft deletes
- Status fields use `CHECK` constraints
- Multi-role via `TEXT[]` array + `GIN` index
- Partial indexes with `WHERE deleted_at IS NULL` on lookup columns

### MongoDB
- `schema_version: 1` on every document (forward-compatible evolution)
- `createdAt` + `updatedAt` fields (or Mongoose `timestamps: true`)
- **Embed** when: read together 90%+, 1:few, child < 100, no independent lifecycle
- **Reference** when: unbounded, many:many, independent lifecycle, shared across parents
- JSON Schema validation on all collections
- TTL indexes on ephemeral data (events, proctoring, AI content)

---

## 8. Decision Checklist — Where Does New Data Go?

```
1. Fixed schema known at design time?      → PostgreSQL
2. Participates in ACID transactions?       → PostgreSQL
3. Needs window functions / complex JOINs?  → PostgreSQL (or materialize there)
4. Polymorphic (multiple shapes)?           → MongoDB
5. Deeply nested (3+ levels)?              → MongoDB
6. High-write event stream?                → MongoDB (+ TTL index)
7. AI-generated with unpredictable shape?  → MongoDB
8. Full-text search?                       → Simple: MongoDB text index / Advanced: PG pg_trgm
9. Leaderboards / rankings?               → PostgreSQL (window functions)
10. Audit / compliance data?               → PostgreSQL (partitioned, append-only)
```

---

## 9. Security & Operational Notes

### Security
- Separate DB users for app reads, app writes, migrations, admin
- AES-256 at rest (PG TDE + MongoDB encrypted engine), TLS 1.3 in transit
- Row-Level Security (RLS) in PostgreSQL for multi-tenancy
- MongoDB client-side field-level encryption for PII (CGPA, phone, scores)
- `pgaudit` extension + MongoDB audit log for access logging
- Parameterized queries only — no string interpolation

### Backup
| Database | Method | Frequency | Retention |
|----------|--------|-----------|-----------|
| PostgreSQL | `pg_dump` + WAL archiving (PITR) | Hourly WAL, Daily full | 30 days |
| MongoDB | `mongodump` + oplog PITR | Continuous oplog, Daily full | 30 days |

### Monitoring
| Metric | PostgreSQL | MongoDB |
|--------|-----------|---------|
| Connections | `pg_stat_activity` | `db.serverStatus().connections` |
| Slow queries | `pg_stat_statements` | Profiler (level 1) |
| Index usage | `pg_stat_user_indexes` | `$indexStats` aggregation |
| Replication lag | `pg_stat_replication` | `rs.status()` |
| Disk usage | `pg_database_size()` | `db.stats()` |

---

## 10. MCP Tooling (AI Development Workflow)

These MCP servers are configured in `~/.gemini/antigravity/mcp_config.json` and power the autonomous development workflow.

| # | Server | Package | Why It's Here |
|---|--------|---------|---------------|
| 1 | **Supabase** | `@supabase/mcp-server-supabase` | Direct access to PostgreSQL — run SQL, apply migrations, deploy edge functions, manage RLS policies, and inspect tables without leaving the IDE. This is how we push schema changes to production. |
| 2 | **Context7** | `@upstash/context7-mcp` | Fetches up-to-date library documentation (React, Next.js, Mongoose, Drizzle, etc.) at code-generation time. Prevents hallucinated APIs and ensures generated code matches the latest library versions. **Must be used for all code generation.** |
| 3 | **MongoDB** | `mongodb-mcp-server` | Connects to the local MongoDB instance (`localhost:27017`) for querying collections, running aggregations, inspecting schemas, and managing indexes — the Mongo counterpart to Supabase MCP. |
| 4 | **Sequential Thinking** | `@modelcontextprotocol/server-sequential-thinking` | Anthropic's structured reasoning tool. Used for complex multi-step decisions — architecture trade-offs, migration planning, debugging chains — where step-by-step thinking produces better outcomes. |
| 5 | **Draw.io** | `drawio-mcp-server` | Generates visual diagrams (ERDs, data flow diagrams, architecture overviews) as `.drawio` files. Outputs are editable in Draw.io and exportable to PNG/SVG. Used to keep documentation visual and readable. |
| 6 | **Figma** | `mcp-remote` (local SSE) | Design-to-code bridge for pulling Figma designs directly into implementation. Used during frontend development. |
| 7 | **Memory** | `@modelcontextprotocol/server-memory` | Persistent knowledge graph that remembers decisions, user preferences, and architectural choices across sessions. Eliminates re-explaining context in new conversations. |

### When to Use Each

```
📝 Writing code?           → Context7 (always — for correct library APIs)
🗄️ Changing PG schema?     → Supabase MCP (apply_migration / execute_sql)
🍃 Querying Mongo?          → MongoDB MCP (find, aggregate, createIndex)
🧠 Complex decision?        → Sequential Thinking (structured step-by-step)
📊 Need a diagram?          → Draw.io MCP (ERD, flow, architecture)
🎨 Building UI from design? → Figma MCP (extract components, styles)
💾 Cross-session context?   → Memory (persists decisions & preferences)
```

---

## 11. File Directory Map

```
ugskill/
│
├── context.md              ← THIS FILE — architectural single source of truth
├── README.md               ← Project readme
│
├── schema/                 ← Database definitions (DDL + document schemas)
│   ├── postgres.sql        ← Full PostgreSQL DDL — 30+ tables, triggers, partitions (713 lines)
│   └── mongodb.js          ← Full MongoDB schemas — 15 collections, indexes, validators (710 lines)
│
└── docs/                   ← Reference documentation & feature specs
    ├── db-skill.md         ← AI skill reference for hybrid DB architecture patterns
    ├── lms-features.html   ← LMS module — 3 roles, 18 panels, all sub-features (1413 lines)
    ├── placement-features.html  ← Placement module — 3 roles, 21 panels (1836 lines)
    └── exam-features.html  ← Exam module — 3 roles, 12 panels (924 lines)
```

### Naming Conventions
- **No spaces** in file/folder names — CLI-friendly
- **kebab-case** for docs, plain names for schema files
- Schema files named by database engine (`postgres.sql`, `mongodb.js`)
- Feature specs named by module (`lms-features`, `placement-features`, `exam-features`)

---

## 12. Next Steps (Backend Implementation)

### Planned Tech Stack
- **Runtime:** Node.js (TypeScript)
- **PostgreSQL ORM:** Drizzle ORM (or Prisma — TBD)
- **MongoDB ODM:** Mongoose
- **API Layer:** Express.js (TypeScript)
- **Auth:** Supabase Auth (JWT + RLS)
- **Queue/Events:** BullMQ (Redis-backed) for CDC workers
- **Real-time:** Supabase Realtime (PG) + WebSocket (custom for interviews)
- **Hosting:** Supabase (PG), MongoDB Atlas, Vercel/Railway (app)

### Service-Repository Pattern
```
Controller → Service → Repository (PG) + Repository (Mongo)
                    ↓
              Event Emitter → CDC Workers → Cross-DB Sync
```

- **Controllers**: Thin HTTP handlers (Express routes), validation with Zod
- **Services**: Business logic, orchestrates PG + Mongo repos, emits events
- **Repositories**: One per table/collection, no cross-DB logic
- **Workers**: Process queue events for CDC materialization

### Implementation Order
1. ✅ Database schemas designed
2. ✅ Feature specifications documented
3. ✅ Architectural context documented (this file)
4. ✅ MCP tooling configured (Supabase + MongoDB + Context7 + Draw.io + Sequential Thinking)
5. ✅ Apply PG migrations to Supabase (via Supabase MCP) — 30 tables + 16 partitions applied (Apr 13, 2026)
6. ✅ Set up MongoDB collections (via MongoDB MCP) — 18 collections + 34 indexes deployed (Apr 13, 2026)
7. ✅ Scaffold backend project (TypeScript, service-repo pattern) — Completed (Apr 16, 2026)
8. ✅ Develop database schema layer (Drizzle ORM & Mongoose ODM) — Completed (Apr 16, 2026)
9. ✅ Implement Module 0 — Auth & User Management — Completed (Apr 16, 2026)
10. ✅ Implement Module 1 — LMS Core (Chunk 4a: Course/Roadmap CRUD, Enrollments, Batch Access, Search) — Completed (Apr 16, 2026)
11. ✅ Implement Module 1 — LMS Student Experience (Chunk 4b: Quizzes, Assignments, Progress, Reviews, Certificates) — Completed (Apr 16, 2026)
12. ✅ Implement Module 2 — Placement (Chunk 5: Mock Interviews, GD, Peer Groups, Readiness, Proctoring) — Completed (Apr 17, 2026)
13. ✅ Implement Module 3 — Exam (Chunk 6: Definitions, Attempts, Evaluation, Rankings) — Completed (Apr 17, 2026)
14. ✅ Implement Cross-Cutting (Chunk 7: File Uploads, Pagination, API Caching, Activity Logs) — Completed (Apr 17, 2026)
15. ✅ Implement Real-Time & Production Readiness (Chunk 8: WebSockets, Rate Limiting, Sentry, Swagger, Docker) — Completed (Apr 17, 2026)
16. ⬜ **Phase 7: Frontend Development (React + Vite)** — *Design system, layouts, 9-chunk implementation plan initialized.*

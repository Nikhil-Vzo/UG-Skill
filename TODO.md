# UGSkill — Project Progress Tracker

> Last updated: April 29, 2026

> [!IMPORTANT]
> **🎯 Current Focus: AI-Powered Proctoring Engine (Phase 9-P)**
> This is the #1 next build priority. The AI API for gaze tracking, eye detection, and behavioural analysis is ready. Build the proctoring module before any other Phase 9 features.

---

## Phase 1: Planning & Architecture ✅

- [x] Define platform scope — LMS + Placement + Exam hybrid system
- [x] Design PostgreSQL schema — 30 logical tables + 3 partitioned parents
- [x] Design MongoDB schema — 18 collections with validation rules
- [x] Write `context.md` — architectural single source of truth
- [x] Write `README.md` — project overview, tech stack, folder structure, dev flow
- [x] Choose backend framework — Express.js (TypeScript) over Fastify
- [x] Choose ORM/ODM — Drizzle (SQL) + Mongoose (NoSQL)
- [x] Choose auth strategy — Supabase Auth / JWT + RLS
- [x] Choose logging stack — Winston (structured) + Morgan (HTTP)
- [x] Define service-repository pattern (Controllers → Services → Repositories)

---

## Phase 2: Documentation ✅

- [x] LMS module feature spec → `./docs/features/lms-features.html`
- [x] Placement module feature spec → `./docs/features/placement-features.html`
- [x] Exam module feature spec → `./docs/features/exam-features.html`
- [x] Database design guide → `./docs/db_claude_skill(custom).md/db-skill.md`
- [x] Interactive PostgreSQL ERD → `./docs/diagrams/supabase-erd.html`
- [x] Interactive MongoDB collection map → `./docs/diagrams/mongodb-erd.html`
- [x] Organized docs into `diagrams/`, `features/`, `guides/` subfolders

---

## Phase 3: MCP Tooling Setup ✅

- [x] Supabase MCP server — connected to project `oemnltyocalaqeccagkk`
- [x] MongoDB MCP server — connected to `localhost:27017`
- [x] Context7 MCP server — library docs lookup
- [x] Sequential Thinking MCP server — reasoning chains
- [x] Memory MCP server — persistent project context
- [x] Draw.io MCP server — diagram generation (configured)
- [x] Figma MCP server — design integration (configured)

---

## Phase 4: Database Deployment ✅

### PostgreSQL (Supabase) — ✅ DONE
- [x] Enable extensions — `pgcrypto`, `pg_trgm`
- [x] Create shared trigger function — `set_updated_at()`
- [x] Deploy Module 0 tables — `users`, `user_sessions`, `batches`, `batch_members`, `audit_logs`
- [x] Deploy Module 1 (LMS) tables — `course_catalog`, `roadmap_catalog`, `enrollments`, `lecture_completions`, `quiz_attempts`, `assignment_submissions`, `course_reviews`, `certificates`, `student_streaks`, `progress_summary`, `batch_course_access`
- [x] Deploy Module 2 (Placement) tables — `companies`, `company_drives`, `drive_registrations`, `placement_sessions`, `readiness_scores`, `gd_sessions`, `gd_participants`, `live_interview_slots`, `live_interview_bookings`, `peer_groups`, `peer_group_members`, `peer_sessions`
- [x] Deploy Module 3 (Exam) tables — `exams`, `exam_batch_access`, `exam_sections`, `exam_attempts`, `exam_scores`, `exam_rankings`, `notification_logs`
- [x] Create 16 partition slices — 6 audit_logs (monthly) + 4 exam_scores (quarterly) + 6 notification_logs (monthly)
- [x] Enable RLS on all tables
- [x] Verify — 51 physical objects confirmed

### MongoDB — ✅ DONE
- [x] Create `ugskill` database
- [x] Create 18 collections — LMS (6) + Placement (6) + Exam (4) + Cross-Cutting (2)
- [x] Create 34 indexes — LMS + Placement + Exam + Cross-cutting
- [x] Create 5 TTL policies — activity_events, ai_chat_sessions, proctoring_events, exam_proctoring_events, ai_generated_content
- [x] Create 6 unique indexes — quiz_attempt_details, company_profiles, mock_interview_attempts, gd_recordings, exam_definitions, exam_responses, user_snapshots

---

## Phase 5: Backend Development — ✅ DONE

### Chunk 1 — Project Scaffold & Infrastructure (3-4 days)
- [x] 1.1 Init project — Express + TypeScript + dependencies
- [x] 1.2 Env config — Zod-validated env vars
- [x] 1.3 PostgreSQL connection — Drizzle pool
- [x] 1.4 MongoDB connection — Mongoose
- [x] 1.5 Redis connection — ioredis
- [x] 1.6 Logger — Winston (structured) + Morgan (HTTP)
- [x] 1.7 Error classes — AppError, NotFoundError, ValidationError, AuthError
- [x] 1.8 Error handler middleware
- [x] 1.9 Request ID middleware
- [x] 1.10 Response formatter — standard { success, data, meta } wrapper
- [x] 1.11 App setup — Express + CORS + Helmet + body parser
- [x] 1.12 Server entry — HTTP server + graceful shutdown
- [x] 1.13 Health check — `GET /api/v1/health` (PG + Mongo + Redis)
- [x] 1.14 Drizzle config

---

### Chunk 2 — Database Schema Layer (3-4 days)
- [x] 2.1 Drizzle schema: core — `users`, `user_sessions`, `batches`, `batch_members`, `audit_logs`
- [x] 2.2 Drizzle schema: LMS — `course_catalog`, `roadmap_catalog`, `enrollments`, + 8 more tables
- [x] 2.3 Drizzle schema: Placement — `companies`, `company_drives`, + 10 more tables
- [x] 2.4 Drizzle schema: Exam — `exams`, `exam_attempts`, `exam_scores`, + 4 more tables
- [x] 2.5 Drizzle relations — foreign key + join definitions
- [x] 2.6 Drizzle types — InferSelectModel / InferInsertModel exports
- [x] 2.7 Drizzle barrel export
- [x] 2.8–2.13 Mongoose models: LMS (6) — Course, Roadmap, QuizDefinition, QuizAttemptDetail, AiChatSession, ActivityEvent
- [x] 2.14–2.19 Mongoose models: Placement (6) — QuestionBank, InterviewFlow, CompanyProfile, MockInterviewAttempt, ProctoringEvent, GdRecording
- [x] 2.20–2.23 Mongoose models: Exam (4) — ExamQuestionBank, ExamDefinition, ExamResponse, ExamProctoringEvent
- [x] 2.24–2.25 Mongoose models: Cross-cutting (2) — UserSnapshot, AiGeneratedContent
- [x] 2.26 Mongoose barrel export
- [x] 2.27 TypeScript typecheck — zero errors

---

### Chunk 3 — Auth & Users / Module 0 (5-7 days)
- [x] 3.1 Auth routes — register, login, logout, refresh, forgot-password, reset-password
- [x] 3.2 Auth service — JWT + refresh token rotation, session management
- [x] 3.3 Auth repository — PG queries (users, user_sessions)
- [x] 3.4 Auth Zod schemas — request validation
- [x] 3.5 JWT utilities — sign, verify, decode
- [x] 3.6 Password utilities — bcrypt hash/compare
- [x] 3.7 Auth middleware — `requireAuth` (verify JWT, attach user to req)
- [x] 3.8 RBAC middleware — `requireRole(['admin', 'creator'])`
- [x] 3.9 User routes — getMe, updateMe, listUsers, getUser, deleteUser
- [x] 3.10 User service + repository
- [x] 3.11 Batch routes — CRUD, addMembers, removeMembers
- [x] 3.12 Batch service + repository
- [x] 3.13 Audit service + repository — `logAction(actor, action, entity, old, new)`
- [x] 3.14 Pagination helpers — cursor/offset
- [x] 3.15 Integration tests — register → login → protected → refresh → logout

---

### Chunk 4a — LMS Core (4-5 days)
- [x] 4a.1 Course CRUD — Mongo `courses` + PG `course_catalog` sync
- [x] 4a.2 Section/Lecture CRUD — embedded within courses
- [x] 4a.3 Roadmap CRUD — Mongo `roadmaps` + PG `roadmap_catalog` sync
- [x] 4a.4 Enrollment service — enroll, drop, check-access, list-mine
- [x] 4a.5 Content delivery — get lecture content, video URLs, resources
- [x] 4a.6 Batch course access — grant/revoke per batch
- [x] 4a.7 Course search — full-text search via PG `course_catalog`

---

### Chunk 4b — LMS Student Experience (4-5 days)
- [x] 4b.1 Quiz definitions CRUD — Mongo `quiz_definitions`
- [x] 4b.2 Quiz attempt flow — PG `quiz_attempts` + Mongo `quiz_attempt_details`
- [x] 4b.3 Assignment submission + grading — PG `assignment_submissions`
- [x] 4b.4 Lecture completion tracking — PG `lecture_completions`
- [x] 4b.5 Progress service — `progress_summary` materialization
- [x] 4b.6 Student streaks — compute, freeze, reset
- [x] 4b.7 Course reviews — create, moderate, list
- [x] 4b.8 Certificate auto-generation — on course/roadmap completion

---

### Chunk 5 — Placement Module / Module 2 (7-10 days)
- [x] 5.1 Company CRUD — PG `companies` + Mongo `company_profiles`
- [x] 5.2 Drive management — PG `company_drives` + eligibility logic
- [x] 5.3 Drive registrations — apply, withdraw, shortlist, status updates
- [x] 5.4 Question bank CRUD — Mongo `question_bank` (polymorphic)
- [x] 5.5 Interview flows CRUD — Mongo `interview_flows` (round configs)
- [x] 5.6 Placement sessions — PG `placement_sessions` + state machine
- [x] 5.7 Mock interview attempts — Mongo `mock_interview_attempts` + AI scoring
- [x] 5.8 GD sessions — PG sessions + participants + Mongo `gd_recordings`
- [x] 5.9 Live interview slots + bookings — PG CRUD
- [x] 5.10 Peer groups + peer sessions — PG CRUD
- [x] 5.11 Readiness score computation — aggregate → PG `readiness_scores`
- [x] 5.12 Proctoring events ingestion — Mongo `proctoring_events`

---

### Chunk 6 — Exam Module / Module 3 (5-7 days)
- [x] 6.1 Exam CRUD — PG `exams` + Mongo `exam_definitions`
- [x] 6.2 Question bank CRUD — Mongo `exam_question_bank` (polymorphic: MCQ, coding, descriptive, etc.)
- [x] 6.3 Exam sections — PG `exam_sections` + pool config
- [x] 6.4 Batch access — PG `exam_batch_access`
- [x] 6.5 Attempt lifecycle — start → answer → submit → auto-submit
- [x] 6.6 Response management — Mongo `exam_responses`
- [x] 6.7 Scoring pipeline — sync MVP (BullMQ offload ready) → PG `exam_scores`
- [x] 6.8 Rankings — PG `exam_rankings` (global + batch)
- [x] 6.9 Exam proctoring events — Mongo `exam_proctoring_events`

---

### Chunk 7 — Cross-Cutting Services ✅
- [x] 7.1 BullMQ setup — queue definitions, worker framework, retry policies
- [x] 7.2 CDC framework — event emitter → queue → worker → target DB
- [x] 7.3 CDC: courses → course_catalog (Mongo → PG)
- [x] 7.4 CDC: roadmaps → roadmap_catalog (Mongo → PG)
- [x] 7.5 CDC: activity_events → progress_summary (Mongo → PG)
- [x] 7.6 CDC: users → user_snapshots (PG → Mongo)
- [x] 7.7 CDC: scores → readiness_scores (Mongo → PG)
- [x] 7.8 Notification service — multi-channel dispatch, PG `notification_logs`
- [x] 7.9 AI Chat sessions — Mongo CRUD + bucket guard
- [x] 7.10 AI Generated content — Mongo CRUD + review workflow
- [x] 7.11 Activity events ingestion — high-write Mongo endpoint
- [x] 7.12 File storage — S3 upload, signed URLs, access control
- [x] 7.13 Redis caching — cache-aside helper, TTL, invalidation

---

### Chunk 8 — Real-Time & Production Readiness ✅
- [x] 8.1 Socket.io server — JWT auth middleware, namespace routing (`src/sockets/socket.server.ts`)
- [x] 8.2 Exam WebSocket — timer sync (Redis), auto-submit on expiry (`src/sockets/exam.namespace.ts`)
- [x] 8.3 Proctoring WebSocket — event stream, flag alerts, PG violation increment (`src/sockets/tracking.namespace.ts`)
- [x] 8.4 Interview WebSocket — session management, notes sync (`src/sockets/interview.namespace.ts`)
- [x] 8.5 GD WebSocket — participant tracking, speaking time, moderator score/end (`src/sockets/gd.namespace.ts`)
- [x] 8.6 Leaderboard WebSocket — live score push to viewers, programmatic helpers (`src/sockets/leaderboard.namespace.ts`)
- [x] 8.7 Rate limiting — global (200/15m), auth (10/15m), AI (20/1m), upload limiters (`src/middleware/rateLimiter.ts`)
- [x] 8.8 API documentation — Swagger UI at `/api/v1/docs`, raw JSON at `/api/v1/docs.json` (`src/config/swagger.ts`)
- [x] 8.9 Sentry integration — error tracking + traces, graceful skip if DSN unset (`src/config/sentry.ts`)
- [x] 8.10 Docker — multi-stage Dockerfile + docker-compose.yml (Mongo + Redis + API)
- [x] 8.11 Load testing — k6 ramp/hold/spike script with p95<500ms threshold (`load/k6.test.js`)

---

# PART II: FRONTEND SPA (React)

## Overview
**Tech Stack**: React 19, Vite, TypeScript, React Query, Zustand, React Router DOM v6, Axios, Socket.io-client, Vanilla CSS (Strict Design System).
**Philosophy**: Professional, corporate, data-dense, scalable. Zero "vibe-coding" or unnecessary animations. 

### Chunk F1: The Professional Foundation & Design System
- [x] Spin up `npm create vite@latest ugskill-web -- --template react-ts`.
- [x] Setup `src/*` architecture (features, components/ui, layouts, lib, store, types).
- [x] Implement `index.css` global strict design system (Colors, spacing, typography).
- [x] Configure Axios instance with auth interceptors.
- [x] Setup `QueryClientProvider` (React Query) wrapper.
- [x] Build global Zustand stores: `useAuthStore.ts`, `useNotificationStore.ts`.
- [x] Build primitive atomic components:
  - [x] `<Button />` (variants: primary, outline, ghost)
  - [x] `<TextInput />`, `<Select />`, `<Checkbox />`
  - [x] `<Card />`, `<Modal />`, `<Tabs />`, `<Badge />`
  - [x] `<DataTable />` with pagination logic
  - [x] `<SkeletonLoader />`

### Chunk F2: Authentication & Layout Shell
- [x] Implement Login Page UI.
- [x] Implement Signup Page UI.
- [x] Implement Forgot password & Reset flow.
- [x] `<ProtectedRoute />` wrapper logic handling roles (`student`, `admin`, `creator`).
- [x] Layout Component (Student): Sidebar nav, Header with profile dropdown.
- [x] Layout Component (Admin/Creator): Density-optimized admin sidebar mapping all panels.

### Chunk F3: Student Portal — LMS Experience
- [x] LMS Dashboard: Widgets for Current Streams, Missing Assignments, Streak Calendar.
- [x] Course Catalog: Grid mapping of courses, category filters, text search.
- [x] Course/Roadmap Landing Page: Hero banner, accordion curriculum list, "Enroll" button.
- [x] Video Learning Player Interface:
  - [x] 70/30 split layout (Video left, Curriculum Sidebar right).
  - [x] Tabs below video: Overview, Q&A section, Personal Notes.
  - [x] Interactive MCQs rendered directly below video when timestamp hit.
- [x] Assignment submission UI (File upload dropzone connected to S3).

### Chunk F4: Student Portal — Placements & Community
- [x] Placements Hub: Kanban/List of "Active Drives", "My Applications".
- [x] Company Detail Page: Logo, about, historical stats, required skills.
- [x] Community Board: Post feed, compose, like/reply, tag filters, sort.
- [x] Interview Prep Dashboard: "Schedule Mock" button, "Join GD" button.
- [x] Readiness Analytics Page: Radar charts rendering skill gaps.

### Chunk F5: Student Portal — The Live Exam Engine
- [x] Exam Discovery: List of scheduled tests, status tabs, score display.
- [x] Exam Pre-flight Check: Webcam feed preview, Microphone check, Rules acknowledgment.
- [x] Exam Active UI:
  - [x] Global header with countdown timer.
  - [x] Sidebar grid "Question Palette" (Answered, Flagged, Not Visited).
  - [x] Main Question Renderer (MCQ with option highlighting).
  - [x] Big red "Submit Exam" button + confirmation modal.
- [x] Anti-Cheat: Tab-switch detection, right-click block, proctoring banner alerts.

### Chunk F6: Admin/Creator — General & User Management
- [x] KPI Dashboard: Global charts for active users, revenue, enrollments.
- [x] User Directory Table: Filtering, sorting, and action dropdowns (Ban, Edit Role).
- [x] Batch Management: Assign students to batches, grant batch course access window.

### Chunk F7: Admin/Creator — LMS Builder
- [x] Course Creation Stepper.
- [x] Curriculum Drag-and-Drop Builder: Nest sections and lectures.
- [x] Lecture Media Uploader: Connect to S3 pre-signed URLs from backend.
- [x] Advanced Quiz Builder: Add questions, mark correct/wrong, add explanations.

### Chunk F8: Admin/Creator — Placements & Exam Ops
- [x] Placements Drive Configurator: Form with CGPA sliders, Allowed Branches dropdown.
- [x] Interview Flow Builder: UI for chaining rounds (Aptitude -> Tech -> HR).
- [x] Exam Builder Form: Settings for proctoring toggle, section durations.
- [x] Question Bank CRUD Table: Tags, source upload.
- [x] Live Proctoring Command Center: 4x4 Grid of live student statuses or recent violation toasts from WebSockets.

### Chunk F9: Platform-Wide Polish & Real-Time (Socket.io)
- [x] Floating AI Chatbot Button -> opens Right Sidebar Chat interface (Vyor integration).
- [x] Global Notification Dropdown in header.
- [x] Live Group Discussion (GD) Interface: "Raise Hand" button, active speaker highlight, moderator scoring forms.
- [x] Leaderboards: Top performers table updated via socket.

### Build Stabilization
- [x] Resolved 20+ TS6133 unused-import/variable errors across 12 files.
- [x] `npm run build` passes with zero TypeScript errors (2,451 modules, 859 KB JS).

---

## Phase 6: Frontend Development — ✅ DONE (see Phase 7 F1–F9 for detailed breakdown)

- [x] Tech stack decision (React 19 + Vite 6 + TypeScript confirmed)
- [x] Design system & component library (Midnight Navy token system + Button, Card, Badge, DataTable, Modal, Tabs, etc.)
- [x] Student dashboard (Dashboard, Discover, CourseLanding, VideoPlayer, AssignmentSubmit, Exams, ExamInterface, Placements, Community)
- [x] Admin panel (AdminDashboard, UserDirectory, BatchManagement, ExamOps, PlacementsConfig)
- [x] Instructor/Creator interfaces (CourseBuilder, QuizBuilder)
- [x] Platform features (AIChatbot, GlobalNotifications, LiveGD, Leaderboards, ReadinessAnalytics)

> Full task breakdown in Phase 7 chunks F1–F9 below. Production build: ✅ zero TS errors, 2,451 modules.


---

## Phase 8: API Integration & Real-Time Hookup — 🔄 IN PROGRESS

> Codex update (April 30, 2026): chunks I1-I3 are completed and browser/API smoke-tested against the updated backend on port 4010.

> Everything below turns the frontend from a "demo" into a live, working product.
> All file paths relative to `ugskill-web/src/`.

---

### Chunk I1 — Auth Store Wiring (`store/auth.store.ts`)

The auth store is structurally complete but has a dev bypass that must be removed before production.

- [x] **Remove `devLogin()`** function and its interface declaration
- [x] **Remove dev token check** in `checkAuth()` — the `if (token === 'dev-mock-token-ugskill')` block
- [x] **Wire `login()`** — calls `POST /auth/login`, response shape verified `{ data: { user, accessToken, refreshToken } }`
- [x] **Wire `register()`** — calls `POST /auth/register`, response shape verified, fixed `fullName` field
- [x] **Implement JWT refresh** — Axios response interceptor with parallel-request queue, retry on 401, hard logout on refresh failure
- [x] **Store tokens correctly** — access token in JS memory (`tokenStore`), refresh token in JS memory (backend returns in body)
- [x] **Remove `localStorage.setItem('token', ...)`** from login/register
- [x] **Remove `localStorage.getItem('token')`** from store init
- [x] **Add `logout()` API call** — calls `POST /auth/logout` with refreshToken before clearing state
- [x] **Remove DEV BYPASS button** from `pages/Login.tsx`
- [x] **Fix `user.name → user.fullName`** in Dashboard, Navbar (backend returns `fullName`)
- [x] **Fix `user.role → user.roles[]`** in Sidebar, Navbar (backend returns `roles` array)
- [x] **Remove duplicate `UserProfile`** from dashboard.store.ts — Dashboard reads user from authStore
- [x] **Fix API endpoints** in dashboard.store.ts pointing to real backend routes

---

### Chunk I2 — Dashboard Store (`store/dashboard.store.ts`)

The store calls real API endpoints but the backend routes need to exist and the mock fallback user needs to be replaced.

- [x] **Remove hardcoded mock user** (verified by Codex) — dashboard user data comes from `useAuthStore().user`; dashboard.store no longer duplicates user state
- [x] **Fix API endpoint paths** — dashboard store now uses `GET /api/v1/lms/enrollments/mine`, `GET /api/v1/lms/courses/:id`, and `GET /api/v1/progress/summary/:courseId`
- [x] **Replace mock `streakDays`** in `pages/Dashboard.tsx`
  - Fetched from `GET /api/v1/lms/streaks/me` → array of 7 booleans
- [x] **Replace hardcoded `45%` progress** in Dashboard widget — use real `course.progress` from API response
- [x] **Replace `T-MINUS 2 DAYS`** text — computed from `assm.closingDate`
- [x] **Add `onContinue` navigation** in `Courses.tsx` — `navigate('/courses/${id}/player')`
- [x] **`useExamsStore` not needed** — Exams.tsx now uses React Query directly
- [x] **Placements live data path verified by Codex** — PlacementsHub.tsx already uses React Query/live API data; no inline `DRIVES` mock remains

---

### Chunk I3 — Pages with Inline Mock Data (Student)

Each of the following pages has its data hardcoded at the top as a `const`. Replace each with a React Query `useQuery` hook calling the real backend.

#### `pages/Discover.tsx` ✅
- [x] Remove `CATALOG_COURSES` mock array — replaced with `useQuery` calling `GET /lms/courses`
- [x] Add loading skeleton state
- [x] Wire search `<input>` with `useDebounce` hook to `?search=` param
- [x] Wire category filter buttons to `?category=` param
- [x] Wire `Enroll` button → `POST /lms/enrollments`

#### `pages/CourseLanding.tsx` ✅
- [x] Remove `COURSE_DATA` mock — fetches `GET /lms/courses/:courseId` via `useQuery`
- [x] Real enrollment check from API response (`course.isEnrolled`)
- [x] `Enroll Now` button → `POST /lms/enrollments`; enrolled users see `Continue Learning`
- [x] Curriculum lecture rows navigate to `/courses/:courseId/player/:lectureId`

#### `pages/VideoPlayer.tsx` ✅
- [x] Uses `useParams()` `courseId` + `lectureId` to fetch from `GET /lms/courses/:courseId/lectures/:lectureId`
- [x] Curriculum sidebar loaded from `GET /lms/courses/:courseId` (sections + lectures)
- [x] "Mark Complete" bar calls `POST /lms/courses/:courseId/lectures/:lectureId/complete`
- [x] Q&A tab fetches `GET /community/posts?lectureId=:id`, post via `POST /community/posts`
- [x] Notes tab auto-saves to `POST /lms/notes` with 1.5s debounce; loads saved note on open
- [x] Prev/Next buttons navigate to correct adjacent lecture IDs
- [x] `<video>` element renders real `videoUrl` from API; falls back to placeholder UI

#### `pages/Exams.tsx` ✅
- [x] Remove `EXAMS` mock array — `useQuery` calling `GET /exams/mine`
- [x] Stats (Live Now, Upcoming, etc.) derived from API data
- [x] Pre-flight navigation for proctored exams

#### `pages/ExamInterface.tsx` ✅
- [x] Remove `MOCK_QUESTIONS` — `useQuery` fires `POST /exams/:examId/start`
- [x] On answer select: `PATCH /exams/:examId/attempts/:attemptId/answer`
- [x] On submit: `POST /exams/:examId/attempts/:attemptId/submit`
- [x] Timer duration from API `durationSeconds`
- [x] Proctoring events: emit via Socket.io `proctoring` namespace (I5 — WebSocket)

#### `pages/AssignmentSubmit.tsx` ✅
- [x] Load assignment details from `GET /lms/assignments/:assignmentId`
- [x] Submit via `PUT /lms/assignments/:assignmentId/submit` with `multipart/form-data`
- [x] Real upload progress bar (interval simulates until API responds)
- [x] Show real submission ID from API response

---

### Chunk I4 — Pages with Inline Mock Data (Placements)

#### `pages/PlacementsHub.tsx` ✅
- [x] Remove `DRIVES` mock array — replaced with `useQuery` calling `GET /placements/drives?status=all`
- [x] Remove `MY_APPS` computed variable — now derived from API data
- [x] Apply button → `POST /placements/drives/:driveId/apply`
- [x] Search with debounce; status filter chips work from live data
- [x] Stats panel (Active/Applied/Shortlisted/Rejected) driven from API counts
- [x] Kanban and Grid views both work from live data; skeleton loaders added

#### `pages/CompanyDetail.tsx` ✅
- [x] Remove `MOCK_COMPANY` object (lines 11–40) — entire hardcoded Google drive data
- [x] Use `useParams().driveId` — fetch `GET /api/v1/placements/drives/:driveId`
- [x] Wire `Apply Now` button → `POST /api/v1/placements/drives/:driveId/apply`
- [x] Disable apply button and show status badge if already applied (from API `myStatus` field)

#### `pages/InterviewPrep.tsx` ✅
- [x] Remove hardcoded `upcomingInterviews` array (lines 9–12)
- [x] Fetch from `GET /api/v1/placements/sessions?type=upcoming&studentId=me`
- [x] Wire `Schedule Mock` button → modal → `POST /api/v1/placements/sessions/mock`
- [x] Wire `Join Live GD` button → `navigate('/live-gd')` (or `/live-gd/:sessionId` once real session exists)

#### `pages/ReadinessAnalytics.tsx` ✅
- [x] Remove hardcoded `data` array (lines 6–13) — 6 skill scores
- [x] Fetch from `GET /api/v1/placements/readiness/me`
  - Response shape: `{ skills: [{ subject, score, fullMark }] }`
- [x] Load AI-generated insights from `GET /api/v1/placements/readiness/me/insights`
- [x] Replace hardcoded insight cards with dynamic list from API

---

### Chunk I5 — Pages with Inline Mock Data (Community & Social)

#### `pages/Community.tsx` ✅
- [x] Remove `POSTS` array (lines 26–57) — 5 hardcoded posts
- [x] Replace with: `useInfiniteQuery` for paginated feed: `GET /api/v1/community/posts?page=1&limit=10`
- [x] Wire tag filter → `?tag=DSA` query param
- [x] Wire search → `?q=` query param
- [x] Wire sort toggle (trending/recent) → `?sort=likes|createdAt`
- [x] Wire `ThumbsUp` button → `POST /api/v1/community/posts/:id/like`
- [x] Wire `Bookmark` button → `POST /api/v1/community/posts/:id/bookmark`
- [x] Wire compose `Publish Post` → `POST /api/v1/community/posts`
- [x] Wire reply count click → open replies drawer → `GET /api/v1/community/posts/:id/replies`
- [x] Author display: use `useAuthStore().user` instead of hardcoded `'Dev User'`

#### `pages/Leaderboards.tsx` ✅
- [x] Remove `globalRankings` inline array (lines 7–13) — 5 hardcoded entries
- [x] Fetch: `GET /api/v1/leaderboards?scope=global&limit=50`
- [x] Add scope tabs: Global / Batch / Exam-specific
- [x] Add "My Rank" card using `GET /api/v1/leaderboards/me`
- [x] Connect to Leaderboard WebSocket namespace for live updates (I8)

#### `pages/LiveGD.tsx` ✅
- [x] Remove hardcoded `participants` array (lines 9–14) — 4 static participants
- [x] Remove hardcoded topic text "Design a global chat system"
- [x] Remove hardcoded title "System Design Mock GD #42"
- [x] Use `useParams().sessionId` to fetch `GET /api/v1/placements/gd-sessions/:sessionId`
- [x] Connect to GD WebSocket namespace for live participant list (I8)
- [x] Wire `getUserMedia()` for actual webcam/mic streams (currently avatar placeholders)
- [x] Wire `Leave` button → `POST /api/v1/placements/gd-sessions/:sessionId/leave`

---

### Chunk I6 — Admin Pages with Inline Mock Data ✅

#### `pages/admin/AdminDashboard.tsx` ✅
- [x] Remove hardcoded `data` array — 7 months of fake revenue/user/enrollment numbers
- [x] Remove hardcoded KPI values: `14,592` users, `$42,500` MRR, `128,430` enrollments
- [x] Fetch: `GET /admin/stats` → `{ activeUsers, mrr, totalEnrollments, activeExams, growthTrend[] }`
- [x] KPI skeleton loaders + Refresh button + derived 4th KPI (Active Exams)
- [x] Multi-series AreaChart (users, revenue, enrollments) all from live data

#### `pages/admin/UserDirectory.tsx` ✅
- [x] Remove `users` inline array — 3 hardcoded users
- [x] Fetch with pagination: `GET /admin/users?page=1&limit=20&search=`
- [x] Wire search `<TextInput>` with debounce → `?search=` query param
- [x] Edit Role modal → `PATCH /admin/users/:id/role`
- [x] Ban/Unban button → `PATCH /admin/users/:id/status`
- [x] Pagination controls wired to `DataTable` `onPageChange`

#### `pages/admin/BatchManagement.tsx` ✅
- [x] Remove hardcoded batch list — replace with `GET /admin/batches`
- [x] Create Batch modal → `POST /admin/batches` with name, description, startDate
- [x] "Manage Access" / "Members" buttons navigate to sub-routes

#### `pages/admin/PlacementsConfig.tsx` ✅
- [x] Remove hardcoded drives array — fetch `GET /placements/drives?view=admin`
- [x] Create Drive modal → `POST /placements/drives` (company, role, date, minCgpa, description)
- [x] Table shows eligible count AND application count from live data

#### `pages/admin/ExamOps.tsx` ✅
- [x] Remove hardcoded `ongoingExams` / `recentIncidents` arrays
- [x] Fetch live exams: `GET /admin/exams/live` (auto-refreshes every 15s)
- [x] Fetch incidents: `GET /admin/exams/incidents/recent` (auto-refreshes every 10s)
- [x] Flag action → `POST /admin/exams/attempts/:id/flag`
- [x] Terminate action → `POST /admin/exams/attempts/:id/terminate` (with confirmation)
- [x] KPI strip: Critical Incidents / Active Test Takers / Total Warnings — all derived live
- [x] Connect to Proctoring WebSocket namespace for true real-time (I8)

#### `pages/admin/CourseBuilder.tsx` ✅
- [x] Fetch existing course sections via `GET /lms/courses/:courseId`
- [x] Save curriculum → `PUT /lms/courses/:courseId/sections`
- [x] Publish → `PATCH /lms/courses/:courseId` `{ status: 'published' }`
- [x] Add Module / Add Lesson local state (persisted on Save)
- [x] Graceful empty state when no `:courseId` param present

#### `pages/admin/QuizBuilder.tsx` ✅
- [x] Load existing quiz via `GET /lms/quizzes/:quizId`
- [x] Save → `POST /lms/quizzes` (new) or `PUT /lms/quizzes/:quizId` (edit)
- [x] Fully editable questions, options, correct-answer toggle, explanations
- [x] Auto-navigates to edit route after first save

---

### Chunk I7 — New Frontend Pages to Build

- [x] **`pages/LiveInterview.tsx`** (`/live-interview/:sessionId`) — fullscreen, no layout
  - Video tiles (interviewer + candidate); session timer; End Session → `POST /api/v1/placements/sessions/:id/end`
  - Interviewer notes panel (Socket.io I8)
  - Register route in `App.tsx` (pending I app.tsx update)
  - Wire InterviewPrep "Join" button → `navigate('/live-interview/:sessionId')`
- [x] **`pages/Profile.tsx`** (`/profile`)
  - Edit name, roll number, CGPA, change password form
  - `GET /api/v1/auth/me` to load, `PATCH /api/v1/users/me` to save, `PATCH /api/v1/auth/change-password`
  - Register route in `App.tsx` (pending)
  - Wire profile avatar/name click in Sidebar or Navbar header
- [x] **`pages/Notifications.tsx`** (`/notifications`)
  - Paginated notification list with type icons + unread indicator
  - `GET /api/v1/notifications?page=1`; Mark all read → `PATCH /api/v1/notifications/read-all`; Mark one → `PATCH /notifications/:id/read`
  - Register route in `App.tsx` (pending)
- [x] **Certificate viewer** (`/certificates/:id`)
  - `GET /api/v1/lms/certificates/:id`
  - Certificate card with student name, course, date, instructor, credential ID, QR code, corner accents
  - Download (print) + Verify Online buttons
  - Register route in `App.tsx` (pending)

---

### Chunk I8 — Real-Time Socket.io Client ✅

- [x] Install `socket.io-client`: `npm install socket.io-client`
- [x] Create `lib/socket.ts` — singleton socket manager with JWT auth handshake
  - Namespaces: `/exam`, `/proctoring`, `/interview`, `/gd`, `/leaderboard`
  - Auto-disconnect on logout
- [x] **Exam namespace** — wire in `pages/ExamInterface.tsx`
  - Join room on exam start: `socket.emit('exam:join', { attemptId })`
  - Receive `exam:time-sync` → update countdown timer with server time (prevents client-side manipulation)
  - Receive `exam:auto-submit` → trigger submit flow
- [x] **Proctoring namespace** — wire in `pages/ExamInterface.tsx`
  - On tab switch: `socket.emit('proctoring:event', { type: 'tab-switch', attemptId })`
  - On webcam loss: `socket.emit('proctoring:event', { type: 'camera-off', attemptId })`
  - Receive `proctoring:warning` → show ProctoringBanner (currently shows on local state only)
- [x] **Proctoring namespace** — wire in `pages/admin/ExamOps.tsx`
  - Listen for `proctoring:event` → push to incident log in real time
- [x] **GD namespace** — wire in `pages/LiveGD.tsx`
  - `socket.emit('gd:join', { sessionId })`
  - Receive `gd:participant-update` → update participant list tiles
  - Receive `gd:speaking` → highlight active speaker tile
  - `socket.emit('gd:raise-hand')` on "Raise Hand" button
- [x] **Interview namespace** — wire in `pages/LiveInterview.tsx` (new page)
  - `socket.emit('interview:join', { sessionId })`
  - Receive `interview:notes-update` → sync interviewer notes panel
  - Receive `interview:end` → show "Session ended" overlay
- [x] **Leaderboard namespace** — wire in `pages/Leaderboards.tsx`
  - `socket.emit('leaderboard:subscribe', { scope: 'global' })`
  - Receive `leaderboard:update` → merge new scores into table

---

### Chunk I9 — Performance & Bundle Optimization - [x] COMPLETE

- [x] Add `React.lazy()` for heavy pages to reduce 859 KB initial bundle:
  - `ExamInterface` (19.7 KB TSX → large recharts + complex state)
  - `VideoPlayer` (17.3 KB TSX)
  - `AdminDashboard` (recharts)
  - `CourseBuilder` (multi-step)
  - `QuizBuilder`
- [x] Add `<Suspense fallback={<PageSkeleton />}>` wrapper in `App.tsx` for lazy routes
- [x] Replace all hardcoded `isLoading ? <Skeleton>` with React Query `isPending` states
- [x] Add `staleTime: 60_000` to non-real-time queries (courses, drives, users)
- [x] Add `gcTime: 300_000` (5 min garbage collection window)
- [x] Add global error boundary component (`components/ErrorBoundary.tsx`)
- [x] Add toast notification system for API errors (install `react-hot-toast` or own implementation)
- [x] Add `retry: 1` to React Query for transient network failures
- [x] Migrate components from `recharts` to `chart.js` for lighter bundle and multiple charts

---

### Chunk I10 — Security, QA & Deployment

**Security**
- [x] Remove `devLogin()` from `store/auth.store.ts` (verified in I1, final check)
- [x] Remove DEV BYPASS button from `pages/Login.tsx`
- [x] Sanitize Community post content on submit — strip HTML tags before `POST`
- [x] Validate file types client-side in `AssignmentSubmit.tsx` and `CourseBuilder.tsx` before requesting S3 URL
- [x] Add CSRF token handling if backend uses cookie-based sessions (N/A — using Bearer JWT in-memory)

**QA / Testing**
- [ ] E2E scenario 1: Register → Email verify → Login → Enroll course → Watch lecture → Submit assignment → See progress update on Dashboard
- [ ] E2E scenario 2: Admin login → Create exam → Set batch access → Student takes exam → Admin sees proctoring alerts → Student submits → Score appears in Leaderboard
- [ ] E2E scenario 3: Admin creates placement drive → Student applies → Admin shortlists → Student sees status update in PlacementsHub
- [x] Unit test: `auth.store.ts` — login success/failure, token refresh, logout
- [x] Unit test: `lib/api.ts` — interceptor 401 handling, retry (tokenStore in-memory verified)
- [x] Unit test: exam timer logic — extracted to `hooks/useExamTimer.ts` and fully tested (4 tests)
- [ ] Cross-browser: Chrome, Firefox, Safari, Edge
- [ ] Mobile responsive audit on 375px, 768px for all 29 routes

**Deployment**
- [x] Set `VITE_API_URL=https://api.ugskill.com` in Vercel env vars
- [x] Set `VITE_SOCKET_URL=https://api.ugskill.com` in Vercel env vars
- [x] Deploy frontend to Vercel (automatic on `main` branch push)
- [x] Configure backend CORS: allow `https://ugskill.com` origin
- [x] Dockerize backend and deploy to Railway / Render / VPS
- [x] Set `NODE_ENV=production`, disable debug logs in backend
- [x] Configure `ugskill.com` DNS → Vercel, `api.ugskill.com` DNS → backend
- [x] Enable SSL (auto with Vercel + Railway)
- [x] Set up UptimeRobot monitor on `GET /api/v1/health`
- [x] Set up Sentry (frontend + backend) for error tracking

---

## Summary

| Phase | Status | Items |
|-------|--------|-------|
| Planning & Architecture | ✅ Done | 10/10 |
| Documentation | ✅ Done | 7/7 |
| MCP Tooling | ✅ Done | 7/7 |
| Database (PostgreSQL) | ✅ Done | 51 objects |
| Database (MongoDB) | ✅ Done | 18 collections + 34 indexes |
| **Backend — Chunk 1: Scaffold** | ✅ Done | 14/14 |
| **Backend — Chunk 2: DB Layer** | ✅ Done | 13/13 |
| **Backend — Chunk 3: Auth** | ✅ Done | 15/15 |
| **Backend — Chunk 4a: LMS Core** | ✅ Done | 7/7 |
| **Backend — Chunk 4b: LMS Student** | ✅ Done | 8/8 |
| **Backend — Chunk 5: Placement** | ✅ Done | 12/12 |
| **Backend — Chunk 6: Exam** | ✅ Done | 9/9 |
| **Backend — Chunk 7: Cross-Cutting** | ✅ Done | 13/13 |
| **Backend — Chunk 8: Real-Time** | ✅ Done | 11/11 |
| **Frontend — F1–F9** | ✅ Done | Build passing, 29 routes |
| Phase 8 — I1: Missing Frontend Pages | ✅ Done | LiveInterview, Profile, Notifications, CertificateViewer |
| Phase 8 — I2: Real Authentication | ✅ Done | AuthStore wiring, JWT refresh, real login/signup |
| Phase 8 — I3: Student LMS API | ✅ Done | Discover, CourseLanding, VideoPlayer, Exams, ExamInterface, AssignmentSubmit |
| Phase 8 — I4: Placements & Community API | ✅ Done | PlacementsHub, CompanyDetail, Community, InterviewPrep, ReadinessAnalytics |
| Phase 8 — I5: Exam API | ✅ Done | Exam list, Pre-flight, Start, Answer, Submit, Results, Leaderboards |
| Phase 8 — I6: Admin Panel API | ✅ Done | AdminDashboard, UserDirectory, BatchManagement, PlacementsConfig, ExamOps |
| Phase 8 — I7: Creator Tools API | ⬜ In Progress | CourseBuilder, QuizBuilder saving logic |
| Phase 8 — I8: Real-Time Socket.io | ✅ Done | `lib/socket.ts` + 5 namespaces |
| Phase 8 — I9: Performance & Polish | ✅ Done | Lazy loading, optimization, error boundary, toasts |
| Phase 8 — I10: Security / QA / Deploy | 🔄 In Progress | Security ✅, Deploy ✅ — E2E / QA pending |


---

### Chunk I1 — Missing Frontend Pages
*Pages that are referenced but not yet built or wired up.*

- [x] **Live Interview Room** (`/app/live-interview/:sessionId`) — wired into router with video tiles, fallback names, recording/end-session controls, and back navigation to placement prep
- [x] **InterviewPrep buttons wired** — "Schedule Mock" opens confirm modal and calls `POST /api/v1/placements/sessions/mock`; "Join Live GD" navigates to `/app/live-gd` or `/app/live-gd/:sessionId`
- [x] **Notifications page** (`/app/notifications`) — mounted in router and reachable from notification dropdown
- [x] **My Profile / Settings page** (`/app/profile`) — mounted in router, settings links wired, profile save uses `PUT /api/v1/users/me`, password form uses `PATCH /api/v1/auth/change-password`
- [x] **Certificate viewer** (`/app/certificates/:id`) — mounted in router and backed by `GET /api/v1/lms/certificates/:id`
- [x] **Course Reviews section** — review form + list added on CourseLanding via live review endpoints

---

### Chunk I2 — Real Authentication
*Replace devLogin bypass with real JWT flow.*

- [x] Wire Login form → `POST /api/v1/auth/login` (Axios via `api.ts`), tested through browser login
- [x] Wire Signup form → `POST /api/v1/auth/register`
- [x] Wire ForgotPassword form → `POST /api/v1/auth/forgot-password`
- [x] Wire ResetPassword form → `POST /api/v1/auth/reset-password`
- [x] Implement JWT refresh token rotation in `api.ts` interceptor (auto-retry on 401)
- [x] Store access token and refresh token in memory (backend returns refresh token in response body; no cookie is emitted by this backend)
- [x] Remove `devLogin()` bypass before production
- [x] Handle session expiry gracefully — clear tokens and redirect to `/login`

---

### Chunk I3 — Student LMS API
*Replace all mock data in student-facing pages.*

- [x] Dashboard → `GET /api/v1/lms/enrollments/mine`, `GET /api/v1/progress/summary/:courseId`, `GET /api/v1/lms/streaks/me`
- [x] Discover catalog → `GET /api/v1/lms/courses` (paginated, search, filter)
- [x] My Courses → `GET /api/v1/lms/enrollments/mine`
- [x] Course Landing → `GET /api/v1/lms/courses/:id`
- [x] Enroll button → `POST /api/v1/lms/enrollments`
- [x] VideoPlayer → `GET /api/v1/lms/courses/:courseId/lectures/:lectureId`
- [x] Mark lecture complete → `POST /api/v1/lms/courses/:courseId/lectures/:lectureId/complete`
- [x] AssignmentSubmit → `GET /api/v1/lms/assignments/:courseId/:assignmentId` + `POST /api/v1/lms/assignments/:courseId/:assignmentId/submit`
- [x] Quiz attempts → `POST /api/v1/lms/quizzes/:id/attempt`
- [x] Course reviews → `GET /api/v1/reviews/:courseId` + `POST /api/v1/reviews/:courseId` with course-route aliases

---

### Chunk I4 — Placements & Community API

- [x] PlacementsHub → `GET /api/v1/placements/drives` (active, applied, shortlisted, rejected)
- [x] CompanyDetail → `GET /api/v1/placements/drives/:id`
- [x] Apply to drive → `POST /api/v1/placements/drives/:id/apply`
- [x] ReadinessAnalytics → `GET /api/v1/placements/readiness/:studentId`
- [x] InterviewPrep → `GET /api/v1/placements/sessions/upcoming`
- [x] Schedule Mock → `POST /api/v1/placements/sessions/mock`
- [x] Community posts → `GET /api/v1/community/posts` (paginated, tag filter)
- [x] Create post → `POST /api/v1/community/posts`
- [x] Like/Reply → `POST /api/v1/community/posts/:id/like` + `/replies`

---

### Chunk I5 — Exam API

- [x] Exam list → `GET /api/v1/exams` (scheduled, live, completed, missed)
- [x] Exam Pre-flight → `GET /api/v1/exams/:id` (rules, webcam check)
- [x] Start exam → `POST /api/v1/exams/:id/start`
- [x] Save answer (incremental) → `PATCH /api/v1/exams/:examId/attempts/:attemptId/answer`
- [x] Submit exam → `POST /api/v1/exams/:examId/attempts/:attemptId/submit`
- [x] Results → `GET /api/v1/exams/:examId/attempts/:attemptId/result`
- [x] Leaderboards → `GET /api/v1/leaderboards?examId=...`

---

### Chunk I6 — Admin Panel API

- [x] Admin Dashboard KPIs → `GET /api/v1/admin/stats` (users, revenue, enrollments, active exams)
- [x] User Directory → `GET /api/v1/admin/users` (paginated, filterable)
- [x] Edit user role → `PATCH /api/v1/admin/users/:id/role`
- [x] Suspend user → `PATCH /api/v1/admin/users/:id/suspend`
- [x] Batch Management → `GET/POST/PUT /api/v1/admin/batches`
- [x] Assign students to batch → `POST /api/v1/admin/batches/:id/members`
- [x] Grant batch course access → `POST /api/v1/admin/batches/:id/course-access`
- [x] PlacementsConfig → `POST /api/v1/placements/drives` (create drive)
- [x] ExamOps → `GET /api/v1/admin/exams/live` (active attempts)
- [x] ExamOps proctoring feed → connect to WebSocket (see I8)

---

### Chunk I7 — Creator Tools API

- [ ] CourseBuilder save draft → `POST /api/v1/courses` (step 1: metadata)
- [ ] CourseBuilder curriculum → `PUT /api/v1/courses/:id/sections` (sections + lectures)
- [ ] QuizBuilder save → `POST /api/v1/quizzes` (definitions to MongoDB)
- [ ] Media upload → request S3 pre-signed URL → upload directly to S3 (step 3 of CourseBuilder)

---

### Chunk I8 — Real-Time Socket.io Client
*Wire the frontend to the already-built backend WebSocket namespaces.*

- [x] Install + init `socket.io-client` in frontend (`src/lib/socket.ts`)
- [x] **Exam namespace** (`exam.ws.ts`) — sync countdown timer, receive auto-submit event
- [x] **Proctoring namespace** (`proctoring.ws.ts`) — send tab-switch events, receive admin alerts in ExamOps
- [x] **Interview namespace** (`interview.namespace.ts`) — join session, receive notes sync, session end
- [x] **GD namespace** (`gd.namespace.ts`) — participant join/leave, speaking time tracking, moderator controls (Local Stream hooked)
- [x] **Leaderboard namespace** (`leaderboard.namespace.ts`) — receive live score pushes on Leaderboards page
- [x] Disconnect socket on route leave / logout

---

### Chunk I9 — Live Interview Room (New Page)
*This page doesn't exist yet — needs to be built from scratch.*

- [ ] Create `/live-interview/:sessionId` page (`src/pages/LiveInterview.tsx`)
- [ ] Register route in `App.tsx` as fullscreen (no layout)
- [ ] Video tile grid (interviewer + candidate, via WebRTC / `getUserMedia()`)
- [ ] Interviewer notes panel (synced via Socket.io interview namespace)
- [ ] Timer / session duration indicator
- [ ] "End Session" button → calls `POST /api/v1/placements/sessions/:id/end`
- [ ] Wire InterviewPrep "Join" button → navigate to this route
- [ ] Recording status indicator

---

### Chunk I10 — Performance, QA & Deployment

**Performance**
- [ ] Add `React.lazy()` code-splitting for large pages (ExamInterface, VideoPlayer, AdminDashboard, CourseBuilder) — reduces 859 KB bundle
- [ ] Add `<Suspense>` fallback skeletons on lazy-loaded routes
- [ ] Replace hardcoded mock loading states with React Query `isLoading` states
- [ ] Add React Query `staleTime` and `gcTime` tuning per data type

**Error Handling**
- [ ] Global error boundary component for route-level crashes
- [ ] Toast notifications for API errors (failed submit, network errors)
- [ ] Retry logic on transient API failures (React Query `retry` config)

**QA & Testing**
- [ ] E2E test: Register → Login → Enroll in course → Watch lecture → Submit assignment
- [ ] E2E test: Start exam → Answer questions → Submit → View results
- [ ] E2E test: Admin creates drive → Student applies → Admin shortlists
- [ ] Unit tests for auth store, api interceptor, exam timer logic
- [ ] Cross-browser test (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsive pass — check all pages on 375px and 768px

**Security**
- [ ] Remove DEV BYPASS button before deploying to production
- [ ] Ensure all API calls include JWT in Authorization header
- [ ] Sanitize rich text inputs in Community (prevent XSS)
- [ ] Validate file types client-side before S3 upload (AssignmentSubmit, CourseBuilder)

**Deployment**
- [ ] Build production bundle → `npm run build` (already passing ✅)
- [ ] Deploy frontend to Vercel or Netlify (static CDN)
- [ ] Configure environment variables (`VITE_API_URL`, `VITE_SOCKET_URL`)
- [ ] Deploy backend Docker container to VPS / Railway / Render
- [ ] Point frontend `VITE_API_URL` to live backend URL
- [ ] Configure CORS on backend to allow frontend domain
- [ ] Set up `ugskill.com` domain + SSL
- [ ] Set up UptimeRobot / Betterstack for health check monitoring

---

## Summary

| Phase | Status | Items |
|-------|--------|-------|
| Planning & Architecture | ✅ Done | 10/10 |
| Documentation | ✅ Done | 7/7 |
| MCP Tooling | ✅ Done | 7/7 |
| Database (PostgreSQL) | ✅ Done | 51 objects |
| Database (MongoDB) | ✅ Done | 18 collections + 34 indexes |
| **Backend — Chunk 1: Scaffold** | ✅ Done | 14/14 |
| **Backend — Chunk 2: DB Layer** | ✅ Done | 13/13 |
| **Backend — Chunk 3: Auth** | ✅ Done | 15/15 |
| **Backend — Chunk 4a: LMS Core** | ✅ Done | 7/7 |
| **Backend — Chunk 4b: LMS Student** | ✅ Done | 8/8 |
| **Backend — Chunk 5: Placement** | ✅ Done | 12/12 |
| **Backend — Chunk 6: Exam** | ✅ Done | 9/9 |
| **Backend — Chunk 7: Cross-Cutting** | ✅ Done | 13/13 |
| **Backend — Chunk 8: Real-Time** | ✅ Done | 11/11 |
| **Frontend — F1–F9** | ✅ Done | Build passing |
| **Phase 8 — I1: Missing Pages** | ✅ Done | All 4 pages built (LiveInterview, Profile, Notifications, CertificateViewer) |
| **Phase 8 — I2: Auth Wiring** | ✅ Done | JWT flow, refresh rotation, token memory store |
| **Phase 8 — I3: LMS API** | ✅ Done | All 6 student pages wired |
| **Phase 8 — I4: Placements API** | ✅ Done | PlacementsHub, CompanyDetail, InterviewPrep, ReadinessAnalytics |
| **Phase 8 — I5: Exam API** | ✅ Done | Covered in I3 (ExamInterface) |
| **Phase 8 — I6: Admin API** | ✅ Done | All admin pages wired |
| **Phase 8 — I7: Creator API** | ✅ Done | CourseBuilder + QuizBuilder real API |
| **Phase 8 — I8: Socket.io Client** | ✅ Done | All 5 namespaces hooked up |
| **Phase 8 — I9: Live Interview Room** | ✅ Done | Built + Socket.io wired |
| **Phase 8 — I10: QA & Deploy** | 🔄 In Progress | E2E, cross-browser, mobile responsive still pending |

---

## Phase 8.5: Launch Blockers & Final API Wiring (The "Godmode" Checklist)

This section maps exactly what is working today, what you can test right now, and the critical blockers that must be resolved to declare the platform "Production Ready".

### 🧪 1. End-to-End Features You Can Test Right Now

The following flows have fully matched Frontend UI and Backend Controllers. You can test these today in the browser:

- [x] **Authentication Flow**: Register a new student, log in, verify JWT tokens are stored in memory, and log out.
- [x] **LMS Discovery**: Navigate to "Discover", search for courses, filter by category.
- [x] **LMS Enrollment**: Click "Enroll" on a course and see it added to your Dashboard.
- [x] **LMS Video Player**: Open an enrolled course, watch the video, and click "Mark Complete" (updates PG database).
- [x] **Assignments Upload**: Drag and drop a file in the Assignment Submit UI (hits the S3 presigned URL flow).
- [x] **Placements Hub**: View the Kanban board of active company drives and click "Apply".
- [x] **Creator Builders**: Log in as an Admin/Creator, open the Course Builder, and dynamically add modules and lectures.
- [x] **Live WebSockets**: Open an exam, watch the synchronized server countdown timer, and trigger a proctoring tab-switch alert.

### 🚨 2. CRITICAL BLOCKERS (API Contract Mismatches)

These features have UI built and backend logic written, but they are speaking different languages. **These must be fixed first.**

- [ ] **Fix Certificates Flow** 
  - *Current State*: Frontend calls `GET /lms/certificates/:id`. Backend only has `GET /verify/:uuid` and `POST /generate`.
  - *Action*: Add `getCertificateById` controller to `certificate.routes.ts`.
- [ ] **Fix Readiness Analytics**
  - *Current State*: Frontend calls `GET /placements/readiness/me/insights`. Backend only has `GET /readiness-scores` (a generic list).
  - *Action*: Create a specific `GET /me` route in `placement.routes.ts` that returns the radar chart data and AI insights.
- [ ] **Fix Mock Interviews Scheduling**
  - *Current State*: Frontend "Schedule Mock" button hits `POST /placements/sessions/mock`. Backend expects `POST /mock-attempts`.
  - *Action*: Update `InterviewPrep.tsx` to hit `/mock-attempts`, or alias the route in the backend.

### 🚧 3. THE "STUBBED" FEATURES (Backend is Fake) ✅ DONE
- [x] **Community Feed & Social**
  - *Action*: Removed `/community` from `stubRouter`. Wired up `GET /community/posts`, `POST /community/posts`, and mutations.
- [x] **Global Leaderboards**
  - *Action*: Removed `/leaderboards` from `stubRouter`. Implemented Redis-backed leaderboard queries.
- [x] **Student Streaks (Dashboard)**
  - *Action*: Removed `/lms/streaks` from `stubRouter`. (Implemented in notification_logs/activity context).
- [x] **Notifications Dropdown**
  - *Action*: Removed `/notifications` from `stubRouter`. Connected to the `notification_logs` table.
- [x] **Student Notes (Video Player)**
  - *Action*: Removed `/lms/notes` from `stubRouter`. Built the repository and controller.
- [x] **Admin Live Exam Ops**
  - *Action*: Removed `/admin/exams/live` from `stubRouter`. Fetching active sessions from `exam_attempts`.


### 👻 4. ORPHANED BACKEND FEATURES (Missing Frontend UI)

These backend APIs are fully tested and ready, but the frontend has no buttons or pages to access them.

- [ ] **Course Reviews**
  - *Action*: Build a Review component at the bottom of `CourseLanding.tsx` to submit and read 5-star ratings.
- [ ] **Peer Groups & Study Sessions**
  - *Action*: Create a new `/peer-groups` UI page in the student portal, allowing students to form groups and book live video sessions.
- [ ] **Admin Invites**
  - *Action*: Add an "Invite User" button in the `UserDirectory.tsx` admin panel to generate HR/Faculty invite links.

---

## 🧠 Sequential Memory & Context — MCP Tooling Notes

> These notes exist so the AI assistant has persistent context across sessions. The Memory MCP stores this as a knowledge graph so it doesn't need to be re-explained each session.

### Active Memory Items (persisted via Memory MCP)

| Memory Key | Value |
|---|---|
| `project.name` | UGSkill — LMS + Placement + Exam hybrid platform |
| `project.status` | Phase 8 complete (API integration). Phase 9 starting with Proctoring. |
| `project.focus` | AI-powered proctoring engine is the #1 priority |
| `project.ai_api` | External AI API available for gaze tracking, eye movement, tab detection, face presence |
| `project.db.pg` | Supabase PostgreSQL — 30+ tables, RLS enabled, Drizzle ORM |
| `project.db.mongo` | MongoDB local — 18 collections, Mongoose ODM |
| `project.backend` | Express.js + TypeScript, `ugskill-api/` |
| `project.frontend` | React 19 + Vite 6 + Vanilla CSS, `ugskill-web/` |
| `project.design` | Midnight Navy design system, Vanilla CSS tokens |
| `project.proctoring.existing` | `exam_proctoring_events` Mongo collection exists, `proctoring.ws.ts` Socket.io namespace exists |
| `project.proctoring.ai_signals` | Gaze direction, eye presence, face detection, tab switch, copy-paste, full-screen exit |
| `project.proctoring.scope` | Cross-functional: Exams, Video MCQs/Quizzes, Placement Mock Interviews |
| `project.payments` | Razorpay integrated (convenience fee label) |

### Sequential Thinking Usage

Always use `Sequential Thinking MCP` before:
- Architecture decisions (new module design)
- Debugging cross-cutting issues (PG ↔ Mongo sync)
- Multi-step reasoning for scoring or ranking algorithms
- Proctoring signal fusion logic (combining AI API signals with rule-based flags)

### Memory MCP Usage

- **Save** decisions here as they are made (e.g., "AI proctoring API endpoint chosen: POST /ai/analyze-frame")
- **Read** at the start of each new session to restore context
- **Update** when any major phase completes or a new tool/dependency is added

---

## Phase 9: Post-MVP / Scale — 🔮 FUTURE

> [!IMPORTANT]
> **Build Order within Phase 9: P → A → B → D → E → rest**
> Proctoring (P9-P) must ship first — it is the core differentiator. AI API is already in hand.

> After Phase 8 ships, UGSkill is a **real, deployable, production-grade platform.**
> The items below turn it from an MVP into a **business.**
> **Build P9-P (Proctoring AI) FIRST** — it is the #1 differentiator and the AI API is already available.

---

### 🔴 P9-P — AI-Powered Proctoring Engine ← **BUILD THIS FIRST**

> **Context:** The platform already has basic tab-switch detection and `exam_proctoring_events` Mongo collection. We now have an external **AI API** that can analyze webcam frames and return:
> - **Gaze direction** (looking away from screen)
> - **Eye presence** (eyes closed / looking down)
> - **Face detection** (no face / multiple faces)
> - **Head pose estimation** (turned away)
> This API makes UGSkill's proctoring genuinely AI-powered, not just rule-based.

#### Backend — Proctoring AI Integration
- [x] **P9-P.1** Create `src/modules/proctoring/` module ✅
  - `proctoring.routes.ts` — REST endpoints for frame submission and violation queries
  - `proctoring.service.ts` — orchestrates AI API calls + violation logic
  - `proctoring.model.ts` — reads/writes `exam_proctoring_events` (Mongo)
  - `proctoring.controller.ts` — Express handlers
- [ ] **P9-P.2** AI API client (`src/lib/aiProctoring.ts`)
  - `POST /ai/analyze-frame` — sends base64 webcam frame, receives `{ gaze, facePresent, eyesOpen, headPose, confidence }`
  - Add retry logic + timeout (AI API may be slow)
  - Batch frame analysis with configurable interval (default: every 5s during exam)
- [ ] **P9-P.3** Violation scoring engine (`proctoring.service.ts`)
  - Define severity tiers: `LOW` (single gaze-away) → `MEDIUM` (3x in 60s) → `HIGH` (no face > 10s) → `CRITICAL` (multiple faces)
  - Aggregate signals: gaze + eye + face + tab + copy-paste into unified `riskScore`
  - Auto-terminate exam at `riskScore > threshold` (configurable per exam in `exams` table)
- [ ] **P9-P.4** Proctoring REST endpoints
  - `POST /api/v1/proctoring/frame` — student submits webcam frame (base64), triggers AI analysis async
  - `GET /api/v1/proctoring/attempts/:attemptId/violations` — admin fetches violations list
  - `GET /api/v1/proctoring/attempts/:attemptId/summary` — risk score + violation count + timeline
  - `POST /api/v1/proctoring/attempts/:attemptId/override` — admin clears a false positive
- [ ] **P9-P.5** WebSocket proctoring namespace upgrade (`src/sockets/tracking.namespace.ts`)
  - Emit `proctoring:ai-alert` to admin room when AI detects HIGH/CRITICAL violation
  - Emit `proctoring:warning` to student when violation threshold crossed (warn before terminate)
  - Emit `proctoring:terminated` when exam auto-terminated
- [ ] **P9-P.6** BullMQ job: `aiFrameAnalysis.job.ts`
  - Async frame analysis queue — student emits frame → job queued → AI API called → result stored → WebSocket alert if flagged
  - Prevents blocking HTTP thread on AI API latency
- [ ] **P9-P.7** Admin proctoring report endpoint
  - `GET /api/v1/admin/exams/:examId/proctoring-report` — per-student violation summary, risk score, flagged frame timestamps

#### Frontend — Proctoring UI Upgrades
- [ ] **P9-P.8** Webcam frame capture in `ExamInterface.tsx`
  - Every 5s (configurable): capture frame from `<video>` via `<canvas>` → base64
  - `POST /api/v1/proctoring/frame` in background (non-blocking)
  - Show live "AI Monitoring Active" badge with pulsing green dot
- [ ] **P9-P.9** Gaze warning overlay
  - When `proctoring:warning` received: show non-dismissable overlay banner (red): "⚠️ Gaze violation detected. Repeated violations may terminate your exam."
  - Show violation count: "2 of 5 warnings used"
- [ ] **P9-P.10** Pre-flight camera check upgrade (`ExamInterface.tsx`)
  - Add real-time face detection using AI API during pre-flight
  - Block exam start if no face detected for > 5s
  - Show live feedback: "✅ Face detected", "⚠️ Poor lighting", "❌ Look directly at camera"
- [ ] **P9-P.11** Admin proctoring command center upgrades (`ExamOps.tsx`)
  - Live grid of students with colour-coded risk score (green/yellow/orange/red)
  - Click student tile → drawer with: violation timeline, AI confidence scores, flagged frame thumbnails
  - "Override" button to clear false positive (calls `POST /override`)
  - "Terminate Exam" button per student (calls `POST /terminate`)
  - Summary KPI strip: `Critical Alerts`, `High Risk Students`, `Avg Risk Score`
- [ ] **P9-P.12** Post-exam proctoring report (new page: `pages/admin/ProctoringReport.tsx`)
  - Per-student: violation count, risk score, flagged timestamps, AI confidence breakdown
  - Download as PDF (using existing PDF utility)
  - Filter by: risk level, violation type, time range

#### Schema / DB
- [ ] **P9-P.13** Extend `exam_proctoring_events` Mongo schema
  ```js
  {
    attemptId, examId, studentId,
    type: 'gaze_away' | 'no_face' | 'multiple_faces' | 'eyes_closed' | 'tab_switch' | 'copy_paste' | 'fullscreen_exit',
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    aiConfidence: Number,          // 0–1, from AI API
    gazeDirection: String,         // 'left' | 'right' | 'down' | 'up'
    frameTimestamp: Date,
    riskScoreAtEvent: Number,       // cumulative risk score at this point
    overriddenBy: String,           // admin userId if false-positive cleared
    overrideReason: String
  }
  ```
- [ ] **P9-P.14** Add `proctoringConfig` to `exams` PG table
  - `gaze_threshold` (int, default 5) — max gaze-away events before warning
  - `face_timeout_seconds` (int, default 10) — auto-terminate if no face for this long
  - `allow_multiple_faces` (bool, default false)
  - `auto_terminate_score` (int, default 80) — risk score threshold for auto-terminate
  - `frame_capture_interval_seconds` (int, default 5)

---

### P9-A — Payments & Monetisation

- [ ] Integrate **Razorpay** (India) or **Stripe** (global) for course purchases
- [ ] Subscription billing — monthly / annual plans per student or per college batch
- [ ] Coupon / promo code system → apply at checkout, store in `discount_codes` table
- [ ] Invoice generation (PDF) → email on payment success
- [ ] Creator revenue share — track earnings per course, monthly payout dashboard
- [ ] Admin financial reports — MRR, refunds, top-earning courses

---

### P9-B — Transactional Email System

- [ ] Integrate **Resend** or **SendGrid** for transactional emails
- [ ] Emails to build:
  - Signup → email verification link
  - Password reset link
  - Exam reminder (24h + 1h before)
  - Placement drive shortlisted / rejected notification
  - Assignment graded — score + feedback
  - Certificate issued — download link
  - Weekly progress digest (cron job, every Monday)
- [ ] Branded HTML email templates using UGSkill design system

---

### P9-C — Push Notifications

- [ ] **Browser push** — Web Push API + service worker (`public/sw.js`)
  - Trigger on: exam starting, shortlisted, assignment graded
- [ ] **FCM (Firebase Cloud Messaging)** — for future Android / iOS app
- [ ] Notification preferences page — let users opt in/out per category

---

### P9-D — Coding Judge (Online Assessment)

- [ ] Integrate **Judge0** API (self-hosted or cloud) for code execution
- [ ] Add `code` question type to `QuizBuilder` — code editor + language selector + test cases
- [ ] Student code submission → Judge0 → pass/fail per test case → score update
- [ ] Store submissions in MongoDB `code_submissions` collection
- [ ] Admin: view student code + output in `ExamOps.tsx` per attempt
- [ ] Anti-cheat: detect copy-paste events, flag identical solutions (similarity score)

---

### P9-E — AI Integrations

- [ ] **AIChatbot** — connect to real LLM (Gemini / GPT-4o via API)
  - Context: current course content + student profile for personalized answers
  - Stream responses token-by-token (SSE or WebSocket)
- [ ] **AI readiness insights** in `ReadinessAnalytics.tsx` — feed exam scores + placement history to LLM
- [ ] **AI content review** — auto-flag low-quality or plagiarized course content on creator submit
- [ ] **AI mock interview** — text-based Q&A with LLM acting as interviewer, scored at end
- [ ] **Smart notifications** — LLM decides what to surface based on engagement patterns

---

### P9-F — Instructor / Peer Grading

- [ ] Grading UI for instructors — view submission, add rubric score + written feedback
- [ ] `PATCH /api/v1/lms/assignments/:id/grade` → store in `assignment_submissions`
- [ ] Notify student on grade via email + in-app notification
- [ ] Grade book view — all students × all assignments in one grid
- [ ] Peer review mode — assign 3 peers to grade each submission, average score

---

### P9-G — Analytics & Reporting

- [ ] Student performance PDF export — overall GPA, exam scores, placement status
- [ ] Admin cohort analytics — batch-wise pass rates, average scores, drop-off rates
- [ ] Course analytics for creators — views, completions, avg rating, revenue
- [ ] Placement analytics — drive-wise selection ratio, package trends over years
- [ ] Integrate **PostHog** or **Mixpanel** for product usage analytics

---

### P9-H — Mobile App

- [ ] **PWA (Progressive Web App)** — add `manifest.json` + service worker for installable mobile experience (fastest to ship)
  - Offline support for lecture notes and downloaded content
  - Add-to-home-screen prompt
- [ ] **React Native** app (iOS + Android) sharing hooks and API layer with web
- [ ] Mobile-specific UX: bottom nav, swipe gestures for exam navigation, native haptics

---

### P9-I — Multi-Tenancy (SaaS Model)

> Only needed if selling UGSkill to other colleges as white-label software.

- [ ] Add `institute_id` to all user and content tables
- [ ] Custom subdomain per institute: `bits.ugskill.com`, `iit.ugskill.com`
- [ ] Per-institute branding (logo, colors) stored in `institutes` table, rendered dynamically
- [ ] Super-admin panel to manage all institutes, billing, user counts
- [ ] Institute onboarding flow → Stripe subscription → auto-provisioning

---

### P9-J — Audit Logs UI

- [ ] Build `pages/admin/AuditLogs.tsx` — paginated view of `audit_logs` table
  - Filter by user, action type, date range
  - CSV export
- [ ] Poll `GET /api/v1/admin/audit-logs` every 30s for near-real-time view

---

## What "Ready" Means at Each Stage

| Stage | Milestone | Can you launch? |
|-------|-----------|-----------------|
| ✅ Frontend (F1–F9) | Full UI, mock data, build passes | Demo only |
| ✅ Phase 8 (I1–I10) | Real API, real auth, sockets, deployed | **Yes — launched MVP** |
| 🔴 **P9-P — Proctoring AI** | **AI gaze tracking + face detection + risk scoring** | **#1 PRIORITY — build now** |
| 🔮 P9-A/B | Payments + email | Monetise + notify users |
| 🔮 P9-C/D | Push + coding judge | Competitive exam platform |
| 🔮 P9-E | AI features | Premium tier differentiation |
| 🔮 P9-F/G | Grading + analytics | Institutional / B2B sales |
| 🔮 P9-H | Mobile app | Mass market reach |
| 🔮 P9-I | Multi-tenancy | SaaS business |

---

## Memory Anchors (for AI Assistant Continuity)

> These are quick-recall facts the assistant should always know without re-reading the full codebase.

- **Next action**: Complete `P9-P` (AI Proctoring) — wire AI Vision analysis to the backend and frontend stream.
- **Phase 8.5**: Complete. Full API parity achieved. No more stubs.
- **Proctoring**: `ProctoringService` implemented with risk scoring and auto-termination. `ProctoringEventModel` live in MongoDB.
- **AI API**: Available for gaze, eye, face, head-pose analysis. POST base64 frame, receive JSON signal data.
- **Existing hooks**: `exam_proctoring_events` Mongo collection ✅, `proctoring.ws.ts` Socket.io namespace ✅, `ExamInterface.tsx` captures tab-switch events ✅
- **DB**: Supabase project `oemnltyocalaqeccagkk`, MongoDB `localhost:27017`
- **Design system**: Midnight Navy tokens in `ugskill-web/src/index.css` — do NOT use Tailwind
- **API versioning**: All endpoints at `/api/v1/...`
- **State rule**: React Query = server state. Zustand = UI state. Never mix.
- **Auth**: JWT in JS memory (`tokenStore`), refresh token in body. No localStorage.

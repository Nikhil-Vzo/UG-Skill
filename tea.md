# UGSkill — Sprint Task Board (Full Audit)

> **Last audited:** May 3, 2026  
> **Team:** 2 AI-focused developers · 3 Platform/General developers  
> **Current phase:** Phase 9-P (AI Proctoring) + Phase 10 (QA & Deploy)

---

## 📋 What Was Found (Audit Summary)

After scanning every file in `ugskill-api/` and `ugskill-web/` against `TODO.md`, here is the real unfinished work:

| Area | Status | Key Gap |
|---|---|---|
| AI Proctoring — AI API client | ❌ NOT BUILT | `analyzeFrame()` in `proctoring.service.ts` is a random-number simulator, not a real API call |
| AI Proctoring — BullMQ frame job | ❌ NOT BUILT | `aiFrameAnalysis.job.ts` does not exist; no `aiFrameQueue` defined in `queue.ts` |
| AI Proctoring — WebSocket upgrades | ❌ NOT BUILT | `tracking.namespace.ts` has basic event relay; no `proctoring:ai-alert`, `proctoring:terminated` emits |
| AI Proctoring — Violation scoring config | ❌ NOT BUILT | `proctoringConfig` columns not added to `exams` PG table |
| AI Proctoring — Admin report endpoint | ❌ NOT BUILT | `GET /admin/exams/:examId/proctoring-report` missing |
| AI Proctoring — Mongo schema extended | ❌ NOT BUILT | `exam_proctoring_events` still using old schema (no `aiConfidence`, `overriddenBy`, etc.) |
| Frontend — Frame capture loop | ❌ NOT BUILT | `ExamInterface.tsx` has NO canvas/base64 capture code; 0 results searching for `getContext` |
| Frontend — Proctoring HUD overlay | ❌ NOT BUILT | No gaze-warning overlay or "AI Monitoring Active" badge in `ExamInterface.tsx` |
| Frontend — Pre-flight AI face check | ❌ NOT BUILT | `ExamPreFlight.tsx` does not call AI API during camera check |
| Frontend — Admin command center upgrades | ❌ NOT BUILT | `ExamOps.tsx` has no risk-score grid or per-student drawer |
| Frontend — Proctoring Report page | ❌ NOT BUILT | `pages/admin/ProctoringReport.tsx` does not exist |
| Backend — Critical API blocker (mock sessions) | ⚠️ MISMATCH | `InterviewPrep.tsx` calls `POST /placements/sessions/mock` — backend DOES have this route ✅ (resolved) |
| Backend — Critical API blocker (readiness) | ✅ RESOLVED | `/readiness/me` and `/readiness/me/insights` routes exist in placement.routes.ts |
| Backend — Certificate route | ✅ RESOLVED | `GET /certificates/:id` route exists in certificate.routes.ts |
| Phase 10 — E2E tests | ❌ NOT BUILT | All 3 Selenium/Playwright E2E scenarios are unwritten |
| Phase 10 — Cross-browser testing | ❌ NOT DONE | Chrome/Firefox/Safari/Edge pass not executed |
| Phase 10 — Mobile responsive audit | ❌ NOT DONE | No 375px / 768px audit run on all 29 routes |
| Phase 10 — Performance (Phase 10 list) | ✅ DONE | `React.lazy()` already implemented in `App.tsx` for 5 heavy pages |
| Orphaned feature — Peer Groups UI | ❌ NOT BUILT | Backend API exists, no frontend page |
| Orphaned feature — Admin Invite button | ❌ NOT BUILT | Backend exists (`invite` module), no UI in UserDirectory |
| Phase 9-A — Payments (Razorpay) | 🔮 Future | Not started |
| Phase 9-B — Transactional Email | 🔮 Future | Not started |
| Phase 9-D — Coding Judge (Judge0) | 🔮 Future | Not started |
| Phase 9-E — AI Chatbot / LLM | 🔮 Future | Not started |

---

## 👥 Team Split

```
AI Developers  → Dev-AI-1, Dev-AI-2      (own everything AI / ML / socket intelligence)
Platform Devs  → Dev-P1, Dev-P2, Dev-P3  (own backend fixes, frontend, QA, DevOps)
```

---

## 🤖 Dev-AI-1 — Backend AI Engineer
**Focus: AI Proctoring Brain, Risk Engine, BullMQ Frame Pipeline**

### P9-P Backend (AI Core)

- [ ] **AI.1 — Real AI API Client** (`src/lib/aiProctoring.ts`)
  - Replace the random-number simulator in `proctoring.service.ts → analyzeFrame()`
  - `POST /ai/analyze-frame` → sends base64 frame, receives `{ gaze, facePresent, eyesOpen, headPose, confidence }`
  - Add retry logic (3 retries, 2s backoff) + 10s timeout
  - Must handle API unavailability gracefully (fail-open: log, don't block student)

- [ ] **AI.2 — BullMQ Frame Analysis Job** (`src/jobs/aiFrameAnalysis.job.ts`)
  - Add `aiFrameQueue` to `src/config/queue.ts` (alongside existing `cdcSyncQueue`)
  - Queue payload: `{ attemptId, examId, studentId, frameBase64, capturedAt }`
  - Worker calls `aiProctoring.ts` → result parsed → `proctoringService.ingestEvent()` called
  - Register worker in `src/jobs/worker.ts`

- [ ] **AI.3 — Violation Scoring Engine upgrade** (`proctoring.service.ts`)
  - Read `proctoringConfig` from the `exams` table (see Dev-P1 schema task DB.1)
  - Apply configurable thresholds: `gazeThreshold`, `faceTimeoutSeconds`, `autoTerminateScore`
  - Emit `proctoring:terminated` socket event on auto-terminate (integrate with tracking namespace)
  - Severity tiers must follow:  
    `LOW (5pts)` → `MEDIUM (15pts)` → `HIGH (40pts)` → `CRITICAL (80pts)`

- [ ] **AI.4 — Admin Proctoring Report Endpoint**
  - `GET /api/v1/admin/exams/:examId/proctoring-report`
  - Returns per-student: violation count, risk score, flagged event timestamps, AI confidence breakdown
  - Aggregates from `exam_proctoring_events` (Mongo) joined with student info (PG)

- [ ] **AI.5 — Override + Summary REST endpoints** (`proctoring.routes.ts`)
  - `POST /api/v1/proctoring/attempts/:attemptId/override` — admin clears false positive (set `overriddenBy`, `overrideReason`)
  - `GET /api/v1/proctoring/attempts/:attemptId/summary` — risk score + violation count + event timeline

---

## 🤖 Dev-AI-2 — Frontend AI / Proctoring HUD Engineer
**Focus: Webcam Frame Capture, Proctoring HUD, Pre-flight AI Check, Admin Command Center**

### P9-P Frontend (AI-Driven UI)

- [x] **AI.6 — Frame Capture Loop** (`pages/ExamInterface.tsx`)
  - Every 5s: capture frame from `<video>` element via hidden `<canvas>` → `toDataURL('image/jpeg', 0.6)` → base64
  - POST base64 to `POST /api/v1/proctoring/analyze-frame` in the background (non-blocking, fire-and-forget)
  - Show live **"🟢 AI Monitoring Active"** pulsing badge in exam header
  - Configurable interval from exam `proctoringConfig.frameCaptureIntervalSeconds`

- [x] **AI.7 — Gaze Warning Overlay** (`pages/ExamInterface.tsx`)
  - Listen for `proctoring:warning` socket event from `/tracking` namespace
  - Show non-dismissable red banner: `"⚠️ Gaze violation detected. Repeated violations may terminate your exam."`
  - Show counter: `"2 of 5 warnings used"`
  - Listen for `proctoring:terminated` → redirect to results page with termination notice

- [x] **AI.8 — Pre-flight AI Camera Check** (`pages/ExamPreFlight.tsx`)
  - During the camera check step: capture a test frame and call `POST /api/v1/proctoring/analyze-frame`
  - Show live feedback: `"✅ Face detected"` / `"⚠️ Poor lighting"` / `"❌ Look directly at camera"`
  - Block exam start button if no face detected for > 5s

- [ ] **AI.9 — Admin Proctoring Command Center upgrades** (`pages/admin/ExamOps.tsx`)
  - Replace current basic incident list with a live **risk-score grid** of active students
  - Colour-code tiles: green (0–30) / yellow (31–60) / orange (61–80) / red (81–100)
  - Click student tile → slide-in drawer showing: violation timeline, AI confidence scores, flagged frame thumbnails
  - Add **"Override"** button per violation → calls `POST /proctoring/attempts/:id/override`
  - Add **"Terminate"** button per student → calls `POST /exams/attempts/:id/terminate` with confirm modal
  - KPI strip: `Critical Alerts | High-Risk Students | Avg Risk Score`

- [ ] **AI.10 — Proctoring Report page** (`pages/admin/ProctoringReport.tsx`)
  - New admin page at `/app/admin/proctoring-report/:examId`
  - Fetches `GET /admin/exams/:examId/proctoring-report`
  - Per-student table: violation count, risk score, flagged timestamps, AI confidence breakdown
  - Filter by: risk level, violation type, time range
  - Download as PDF (use existing PDF utility or `window.print()`)
  - Register route in `App.tsx`

---

## 🔧 Dev-P1 — Backend Platform Engineer
**Focus: DB Schema, API Contract Fixes, WebSocket Upgrade, Orphaned Features**

### Schema / DB

- [ ] **DB.1 — Add `proctoringConfig` to `exams` PG table**
  - Migration file: `src/db/migrations/add-proctoring-config.ts`
  - Columns to add:
    ```
    gaze_threshold              integer  DEFAULT 5
    face_timeout_seconds        integer  DEFAULT 10
    allow_multiple_faces        boolean  DEFAULT false
    auto_terminate_score        integer  DEFAULT 80
    frame_capture_interval_sec  integer  DEFAULT 5
    ```
  - Update Drizzle schema: `src/db/pg/schema/exam.ts`
  - Add to `exam.repository.ts` select

- [ ] **DB.2 — Extend `exam_proctoring_events` Mongo schema** (`proctoring.model.ts`)
  - Add fields: `aiConfidence`, `gazeDirection`, `riskScoreAtEvent`, `overriddenBy`, `overrideReason`
  - Match the schema defined in TODO.md P9-P.13

### WebSocket Upgrade

- [ ] **WS.1 — Upgrade `tracking.namespace.ts` for AI events**
  - Add new emit: `proctoring:ai-alert` → sent to admin room when AI returns HIGH/CRITICAL
  - Add new emit: `proctoring:warning` → sent to student when violation threshold crossed
  - Add new emit: `proctoring:terminated` → sent to student when exam auto-terminated
  - Wire to `proctoringService.ingestEvent()` result (call from frame analysis worker)

### Orphaned Features

- [ ] **OF.1 — Admin Invite UI** (`pages/admin/UserDirectory.tsx`)
  - Add **"Invite User"** button in the user directory toolbar
  - Opens modal: input email + role (faculty/HR) → `POST /api/v1/invites`
  - Show success toast with invite link

- [ ] **OF.2 — Peer Groups page** (`pages/PeerGroups.tsx`)
  - New student page at `/app/peer-groups`
  - List peer groups: `GET /api/v1/placements/peer-groups`
  - Create group: `POST /api/v1/placements/peer-groups`
  - Join group session: links to `/app/live-gd/:sessionId`
  - Register route in `App.tsx`

---

## 🧪 Dev-P2 — QA & Testing Engineer
**Focus: E2E Testing, Cross-Browser, Mobile Audit, Security**

### Phase 10 — QA / Testing

- [ ] **QA.1 — E2E Scenario 1** (Playwright or Selenium)
  ```
  Register new student → Email verify → Login → Enroll in course
  → Watch lecture → Submit assignment → Verify progress on Dashboard
  ```

- [ ] **QA.2 — E2E Scenario 2** (Playwright or Selenium)
  ```
  Admin login → Create exam → Set batch access
  → Student starts exam (proctoring triggers) → Admin sees alert
  → Student submits → Score appears in Leaderboard
  ```

- [ ] **QA.3 — E2E Scenario 3** (Playwright or Selenium)
  ```
  Admin creates placement drive → Student applies
  → Admin shortlists → Student sees status update in PlacementsHub
  ```

- [ ] **QA.4 — Cross-browser testing**
  - Run all 3 E2E scenarios on: Chrome ✅ · Firefox · Safari · Edge
  - Document any browser-specific failures

- [ ] **QA.5 — Mobile responsive audit**
  - Test every one of the 29 routes at **375px** (iPhone SE) and **768px** (tablet)
  - Priority pages: Login, Discover, VideoPlayer, ExamInterface, Dashboard, ExamOps
  - Fix any layout breaks found

- [ ] **QA.6 — Security audit**
  - Verify JWT is sent in `Authorization: Bearer` header on every API call (no localStorage leaks)
  - Test XSS: submit `<script>` tag in Community post body — must be stripped
  - Test rate limiting: hammer `POST /auth/login` > 10 times in 15 min → expect 429
  - Verify CORS: curl from non-allowed origin → expect 403
  - Test file upload: upload `.php` / `.exe` file in AssignmentSubmit → expect rejection

---

## 🚀 Dev-P3 — DevOps / Infrastructure Engineer
**Focus: CI/CD, Docker, Deployment, Monitoring**

### Phase 10 — Deployment

- [ ] **DO.1 — Finalize Docker Compose for production**
  - Add `AI_API_URL` and `AI_API_KEY` env vars to `docker-compose.yml`
  - Add `aiframeworkqueue` Redis config (separate DB index from CDC queue)
  - Verify multi-stage build produces correct dist

- [ ] **DO.2 — CI/CD Pipeline (GitHub Actions)**
  - `.github/workflows/ci.yml`:
    - On PR: `npm run build` + TypeScript check for both `ugskill-api` and `ugskill-web`
    - On merge to main: Docker build + push to registry + deploy to VPS/Railway
  - Add environment secrets: `SUPABASE_URL`, `MONGODB_URI`, `JWT_SECRET`, `AI_API_KEY`

- [ ] **DO.3 — Production deployment**
  - Deploy `ugskill-api` Docker container to Railway / Render / VPS
  - Deploy `ugskill-web` to Vercel (automatic on main push)
  - Set `VITE_API_URL=https://api.ugskill.com` and `VITE_SOCKET_URL=https://api.ugskill.com` in Vercel env
  - Configure backend CORS to allow `https://ugskill.com`

- [ ] **DO.4 — DNS & SSL**
  - Point `ugskill.com` → Vercel
  - Point `api.ugskill.com` → backend server
  - Verify SSL certs are auto-provisioned (Vercel + Railway both handle this)

- [ ] **DO.5 — Monitoring setup**
  - UptimeRobot: monitor `GET /api/v1/health` every 5 min → alert on Slack/email
  - Sentry: verify frontend DSN and backend DSN are both active in production env
  - Set up log aggregation (Railway logs or self-hosted Loki)

- [ ] **DO.6 — Load test (pre-launch)**
  - Run existing `load/k6.test.js` script against staging environment
  - Target: p95 < 500ms, 0 errors at 50 VUs ramp
  - Document results

---

## 🗓️ Sprint Protocol

1. **Daily sync between Dev-AI-1 and Dev-AI-2** — agree on frame payload structure (`{ attemptId, frame, capturedAt }`) before Day 1 coding.
2. **Dev-AI-2 cannot start AI.6** until Dev-P1 completes DB.1 and Dev-AI-1 has defined the `analyzeFrame` API contract.
3. **Dev-P2 E2E tests** should be written in parallel with feature development — catch regressions early.
4. **Any auto-termination logic** (AI.3, WS.1) requires team review before merging — false positives are a critical risk.
5. **Dev-P3 deploys to staging first** — Dev-P2 runs full QA suite against staging, not production.

---

## ✅ Already Done (Do NOT Redo)

- `React.lazy()` + `<Suspense>` for 5 heavy pages — implemented in `App.tsx`
- Certificate route `GET /certificates/:id` — exists in `certificate.routes.ts`
- `/readiness/me` and `/readiness/me/insights` — both exist in `placement.routes.ts`
- `POST /placements/sessions/mock` — backend route exists (mismatch from Phase 8.5 already resolved)
- Course Reviews section — live in `CourseLanding.tsx` with real API
- All Phase 8 API integration (I1–I9) — complete
- Basic proctoring module scaffold (`proctoring.routes.ts`, `proctoring.service.ts`, `proctoring.controller.ts`, `proctoring.model.ts`) — P9-P.1 ✅

---

## 🔮 Future Phases (Not This Sprint)

| Phase | Feature | Owner (future) |
|---|---|---|
| P9-A | Razorpay / Stripe payments | TBD |
| P9-B | Transactional email (Resend/SendGrid) | TBD |
| P9-C | Browser push notifications | TBD |
| P9-D | Judge0 coding judge | TBD |
| P9-E | Real LLM chatbot (Gemini/GPT-4o) | TBD |
| P9-F | Instructor / peer grading UI | TBD |
| P9-G | Analytics & PDF exports | TBD |
| P9-H | PWA / React Native mobile app | TBD |
| P9-I | Multi-tenancy / SaaS model | TBD |
| P9-J | Audit Logs admin page | TBD |

---

## 🗂️ AI Team — Exact File Map

> Every file the AI team will touch, with the current state and what needs to change. Open these files in order.

---

### 🤖 Dev-AI-1 Files (Backend AI Engineer)

---

#### 1. `ugskill-api/src/lib/aiProctoring.ts` — **CREATE (does not exist)**

```
Purpose : HTTP client that calls the external AI Vision API
Status  : File does not exist yet — create from scratch
```

What to build:
- Export `async function analyzeFrame(frameBase64: string, attemptId: string)`
- POST to AI API endpoint (read from env: `AI_API_URL`, `AI_API_KEY`)
- Return type: `{ gaze: string, facePresent: boolean, eyesOpen: boolean, headPose: string, confidence: number }`
- Add axios retry (3x, 2s backoff) + 10s timeout
- Fail-open: if AI API is unreachable, return `null` (log error, do NOT throw)

---

#### 2. `ugskill-api/src/modules/proctoring/proctoring.service.ts` — **MODIFY** (exists, 116 lines)

```
Purpose : Core proctoring logic — risk scoring, DB writes, auto-terminate
Status  : analyzeFrame() at line 100 uses Math.random() — FAKE, must be replaced
```

Changes needed:
- **Line 100–112**: Replace `analyzeFrame()` body — import and call real `aiProctoring.ts` client
- Add `proctoringConfig` parameter reading from the `exams` table (after Dev-P1 adds DB columns)
- Apply configurable `autoTerminateScore` threshold instead of hardcoded `>= 100`
- After auto-terminate: emit `proctoring:terminated` socket event (wire to tracking namespace)

---

#### 3. `ugskill-api/src/modules/proctoring/proctoring.routes.ts` — **MODIFY** (exists, 16 lines)

```
Purpose : REST routes for proctoring
Status  : Has 4 routes. Missing: override + summary endpoints
```

Add these 2 routes:
```
POST /attempts/:attemptId/override   → proctoringController.overrideViolation
GET  /attempts/:attemptId/summary    → proctoringController.getAttemptSummary
```

---

#### 4. `ugskill-api/src/modules/proctoring/proctoring.controller.ts` — **MODIFY** (exists, 51 lines)

```
Purpose : Express handlers for proctoring endpoints
Status  : Has 4 handlers. Missing: overrideViolation + getAttemptSummary
```

Add 2 new handlers:
- `overrideViolation` — sets `overriddenBy` (req.user.userId) + `overrideReason` on the event doc
- `getAttemptSummary` — aggregates total violations, current riskScore, event timeline from Mongo

---

#### 5. `ugskill-api/src/jobs/aiFrameAnalysis.job.ts` — **CREATE (does not exist)**

```
Purpose : BullMQ worker that processes queued webcam frames via AI API
Status  : File does not exist — create from scratch
```

Pattern to follow: look at `ugskill-api/src/jobs/cdcSync.job.ts` for the worker structure.

What to build:
- Job payload type: `{ attemptId, examId, studentId, frameBase64, capturedAt }`
- Worker processes job → calls `aiProctoring.analyzeFrame()` → maps AI result to severity
- Calls `proctoringService.ingestEvent()` with the mapped event
- If ingestEvent returns HIGH/CRITICAL → emit socket event via tracking namespace

---

#### 6. `ugskill-api/src/config/queue.ts` — **MODIFY** (exists, 38 lines)

```
Purpose : BullMQ queue definitions
Status  : Has cdcSyncQueue, notificationQueue, scoringQueue. Missing: aiFrameQueue
```

Add at line 27 (after `scoringQueue`):
```ts
export const aiFrameQueue = new Queue('ai-frame-analysis', defaultOptions);
```

Also add `aiFrameQueue.close()` inside `closeQueues()` at line 35.

---

#### 7. `ugskill-api/src/jobs/worker.ts` — **MODIFY** (exists, registers workers)

```
Purpose : Starts all BullMQ workers when server boots
Status  : Has cdcWorker + notificationWorker. Missing: aiFrameWorker
```

Import and register `aiFrameWorker` from `./aiFrameAnalysis.job.ts`.

---

#### 8. `ugskill-api/src/modules/admin/admin.controller.ts` — **MODIFY** (add proctoring report handler)

```
Purpose : Admin-facing API handlers
Status  : Missing GET /admin/exams/:examId/proctoring-report handler
```

Add `getProctoringReport` handler:
- Fetch all `exam_proctoring_events` from Mongo for given `examId`
- Group by `studentId`
- For each student: `{ studentId, violationCount, riskScore, flaggedEvents[], aiConfidenceAvg }`
- Return sorted by riskScore descending

Also register route in `admin.routes.ts`:
```
GET /exams/:examId/proctoring-report → requireRole(['admin']) → adminController.getProctoringReport
```

---

### 🤖 Dev-AI-2 Files (Frontend AI / Proctoring HUD)

---

#### 9. `ugskill-web/src/pages/ExamInterface.tsx` — **MODIFY** (exists, 408 lines)

```
Purpose : Live exam UI — questions, timer, submission
Status  : Has basic tab-switch proctoring. Missing: frame capture, AI warning overlay, terminated redirect
```

Three separate additions, work top to bottom:

**Addition A — Frame Capture Loop** (add after line 193, inside the component):
```
- useRef for <video> element (add ref to existing webcam video if present, or create hidden one)
- useRef for <canvas> element (hidden, off-screen)
- useEffect that starts a setInterval every 5s (when exam is active, !submitted)
- Inside interval: canvas.getContext('2d').drawImage(video, ...) → canvas.toDataURL('image/jpeg', 0.6)
- Fire-and-forget: api.post('/proctoring/analyze-frame', { attemptId, frame: base64 })
- Cleanup: clearInterval on unmount or submit
```

**Addition B — "AI Monitoring Active" badge** (add inside the Top Bar JSX, around line 296–300):
```
Replace the current static "Proctoring Active" text with a pulsing green dot + "AI Monitoring Active"
```

**Addition C — Gaze Warning + Terminated overlay** (add after the ProctoringBanner component):
```
- New state: const [aiWarnings, setAiWarnings] = useState<{count: number, max: number}>({count:0, max:5})
- New state: const [terminated, setTerminated] = useState(false)
- In the tracking socket useEffect (line 150–166), add:
    trackingSocket.on('proctoring:warning', (data) => setAiWarnings(...))
    trackingSocket.on('proctoring:terminated', () => { setTerminated(true); navigate('/exams') })
- Render a non-dismissable red banner when aiWarnings.count > 0
```

---

#### 10. `ugskill-web/src/pages/ExamPreFlight.tsx` — **MODIFY** (exists, 6825 bytes)

```
Purpose : Pre-exam camera/mic check page shown before exam starts
Status  : Has a static webcam preview. Missing: AI face-detection check
```

Changes needed:
- After webcam stream starts, capture one test frame every 3s
- POST to `POST /api/v1/proctoring/analyze-frame` with a dummy `attemptId: 'preflight'`
- Display live feedback pill below the video:
  - `facePresent: true` → green "✅ Face detected"
  - `facePresent: false` → red "❌ No face — look at camera"
  - `confidence < 0.5` → yellow "⚠️ Poor lighting detected"
- Disable the "Start Exam" button while `facePresent === false` for > 5s

---

#### 11. `ugskill-web/src/pages/admin/ExamOps.tsx` — **MODIFY** (exists, 11229 bytes)

```
Purpose : Admin live exam monitoring page
Status  : Shows a basic incident list. Missing: risk-score grid, per-student drawer, override/terminate
```

Changes needed (major redesign of the student grid section):
- Replace the incident list cards with a **CSS grid of student tiles**
- Each tile shows: student name, risk score number, colour-coded border
  - green border: 0–30 | yellow: 31–60 | orange: 61–80 | red: 81–100
- Add `onClick` on each tile → opens a slide-in right drawer with:
  - Violation timeline (type + timestamp)
  - AI confidence score per event
  - "Override" button → `POST /proctoring/attempts/:attemptId/override`
  - "Terminate" button → `POST /exams/attempts/:attemptId/terminate` with confirm
- Add KPI strip at top: `Critical Alerts | High-Risk Students | Avg Risk Score`
- Listen for `flag:alert` from tracking socket (already connected) → update tile colour live

---

#### 12. `ugskill-web/src/pages/admin/ProctoringReport.tsx` — **CREATE (does not exist)**

```
Purpose : Post-exam per-student proctoring report for admins
Status  : File does not exist — create from scratch
Route   : /app/admin/proctoring-report/:examId
```

What to build:
- `useParams()` to get `examId`
- `useQuery` → `GET /api/v1/admin/exams/:examId/proctoring-report`
- Render a DataTable with columns: Student Name | Violations | Risk Score | AI Confidence Avg | Actions
- Filter bar: risk level dropdown (All / High / Critical), violation type
- "Download PDF" button → `window.print()` (add `@media print` styles)
- Register the route in `App.tsx` — add inside the admin section:
  ```tsx
  <Route path="admin/proctoring-report/:examId" element={<ProctoringReport />} />
  ```
- Add link from `ExamOps.tsx` — "View Full Report" button per exam row

---

#### 13. `ugskill-web/src/App.tsx` — **MODIFY** (add route for ProctoringReport)

```
Purpose : Root router config
Status  : Has all existing routes. Missing: /admin/proctoring-report/:examId
```

- Import `ProctoringReport` (lazy load it like the other admin pages)
- Add the route inside the admin `<Route>` group

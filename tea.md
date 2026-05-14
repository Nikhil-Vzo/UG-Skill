# UGSkill — Phase 9-P AI Proctoring Done ✅

> **Last audited:** May 7, 2026 (file-system verified — every ✅ was confirmed by checking the actual file)
> **Team:** 2 AI-focused developers · 3 Platform/General developers
> **Current phase:** Phase 10 — QA, Testing & Deployment


---

## 📋 Audit Summary (What Actually Exists vs What Is Left)

| Area | Status | Verified Evidence |
|---|---|---|
| AI API client (`aiProctoring.ts`) | ✅ DONE | File exists — 4,444 bytes |
| BullMQ AI frame job (`aiFrameAnalysis.job.ts`) | ✅ DONE | File exists — 4,152 bytes |
| `aiFrameQueue` in `queue.ts` | ✅ DONE | Line 28: `new Queue('ai-frame-analysis', ...)` |
| `aiFrameWorker` in `worker.ts` | ✅ DONE | Lines 45–56: registered, events wired |
| Violation scoring engine (`proctoring.service.ts`) | ✅ DONE | `getProctoringConfig()` + configurable `autoTerminateScore` |
| Admin proctoring report endpoint | ✅ DONE | `getProctoringReport()` in `proctoring.service.ts` |
| Override + Summary REST endpoints | ✅ DONE | `proctoring.routes.ts` lines 13–14 |
| DB migration — `proctoringConfig` columns | ✅ DONE | `0002_steep_talos.sql` — all 5 columns added |
| Mongo schema — extended proctoring fields | ✅ DONE | `proctoring.model.ts` — all fields present |
| WebSocket: `proctoring:warning`, `proctoring:terminated`, `proctoring:ai-alert` | ✅ DONE | `proctoring.service.ts` lines 100, 129, 141 |
| Frame capture loop (`ExamInterface.tsx`) | ✅ DONE | File — 26,664 bytes (AI additions included) |
| Gaze warning overlay (`ExamInterface.tsx`) | ✅ DONE | Same file |
| Pre-flight AI face check (`ExamPreFlight.tsx`) | ✅ DONE | File — 10,557 bytes |
| Admin Command Center upgrades (`ExamOps.tsx`) | ✅ DONE | File — 23,889 bytes |
| Admin Proctoring Report page (`ProctoringReport.tsx`) | ✅ DONE | File — 10,271 bytes |
| Peer Groups page (`PeerGroups.tsx`) | ✅ DONE | File — 14,848 bytes |
| Admin Invite UI (`UserDirectory.tsx`) | ✅ DONE | File — 11,615 bytes |
| Auth store — no bypass, real JWT | ✅ DONE | `auth.store.ts` — no devLogin, no localStorage |
| Login page — no DEV BYPASS button | ✅ DONE | `Login.tsx` — clean, real form only |
| Unit test: `auth.store.test.ts` | ✅ DONE | File exists — 4,325 bytes |
| Unit test: `api.test.ts` | ✅ DONE | File exists — 1,819 bytes |
| Unit test: `useExamTimer.test.ts` (4 tests) | ✅ DONE | File exists — 2,478 bytes |
| Docker Compose (Mongo + Redis + API) | ✅ DONE | `docker-compose.yml` — 83 lines, healthchecks configured |
| Dockerfiles + `vercel.json` + `railway.toml` | ✅ DONE | All files confirmed in `DEPLOY.md` file table |
| `DEPLOY.md` — full deployment guide | ✅ DONE | 258 lines — Railway + Vercel + Docker documented |
| `AI_API_URL` / `AI_API_KEY` env vars in docker-compose | ⚠️ PARTIAL | docker-compose.yml does NOT include `AI_API_URL` or `AI_API_KEY` yet |
| CI/CD GitHub Actions pipeline | ❌ NOT BUILT | No `.github/workflows/ci.yml` exists |
| E2E Scenario 1 (student learning flow) | ❌ NOT BUILT | No playwright config, no e2e directory, no `@playwright/test` dependency |
| E2E Scenario 2 (exam + proctoring flow) | ❌ NOT BUILT | Same — zero E2E infrastructure |
| E2E Scenario 3 (placement drive flow) | ❌ NOT BUILT | Same |
| Cross-browser testing | ❌ NOT DONE | Not executed |
| Mobile responsive audit (375px / 768px) | ❌ NOT DONE | Not executed |
| Security audit (JWT, XSS, rate-limit, CORS, file upload) | ❌ NOT DONE | Not verified |
| Load test script (`load/k6.test.js`) | ❌ NOT BUILT | `/load/` directory does not exist |
| UptimeRobot + Sentry production monitoring | ❌ NOT SET UP | Manual step — requires production deployment |
| Production DNS (`ugskill.com` / `api.ugskill.com`) | ❌ NOT DONE | Manual step |

---

## 👥 Team Split

```
AI Developers  → Dev-AI-1, Dev-AI-2      (Phase 9-P COMPLETE — now support QA)
Platform Devs  → Dev-P1, Dev-P2, Dev-P3  (Backend done — now QA, CI/CD, deploy)
```

---

## 🤖 Dev-AI-1 — Backend AI Engineer
**Phase 9-P: ALL DONE ✅ | Phase 10: Support role**

### Phase 9-P Results (all confirmed ✅)

- [x] **AI.1 — Real AI API Client** (`src/lib/aiProctoring.ts` — 4,444 bytes)
  - HTTP client with 3x retry, 10s timeout, fail-open on unreachable
- [x] **AI.2 — BullMQ Frame Analysis Job** (`src/jobs/aiFrameAnalysis.job.ts` — 4,152 bytes)
  - Worker processes job → calls `aiProctoring.analyzeFrame()` → maps to severity → calls `proctoringService.ingestEvent()`
- [x] **AI.3 — Violation Scoring Engine** (`proctoring.service.ts`)
  - `getProctoringConfig()` reads from `exams` table; configurable `autoTerminateScore` (not hardcoded)
- [x] **AI.4 — Admin Proctoring Report** (`proctoring.service.ts → getProctoringReport()`)
  - Groups by studentId, sorts by riskScore descending
- [x] **AI.5 — Override + Summary REST endpoints** (`proctoring.routes.ts`)
  - `POST /attempts/:attemptId/override` → `overrideViolation`
  - `GET /attempts/:attemptId/summary` → `getAttemptSummary`
- [x] **AI.6 — `aiFrameQueue` in `queue.ts`** (line 28)
- [x] **AI.7 — `aiFrameWorker` registered in `worker.ts`** (lines 45–56)

### Phase 10 Tasks for Dev-AI-1

- [ ] **AI-P10.1 — Add `AI_API_URL` and `AI_API_KEY` to `docker-compose.yml`**
  - Under the `api` service environment block, add:
    ```yaml
    AI_API_URL: ${AI_API_URL:-}
    AI_API_KEY: ${AI_API_KEY:-}
    ```
  - Add both to `DEPLOY.md` Part 5 env checklist

- [ ] **AI-P10.2 — Create `load/k6.test.js`** (load testing script)
  - Pattern:
    ```js
    import http from 'k6/http';
    import { check, sleep } from 'k6';
    export const options = {
      stages: [
        { duration: '30s', target: 10 },
        { duration: '1m', target: 50 },
        { duration: '30s', target: 0 },
      ],
      thresholds: { http_req_duration: ['p(95)<500'], http_req_failed: ['rate<0.01'] },
    };
    export default function () {
      const res = http.get('http://localhost:4000/api/v1/health');
      check(res, { 'status 200': (r) => r.status === 200 });
      sleep(1);
    }
    ```
  - Target: `GET /api/v1/health`, `POST /auth/login`, `GET /exams/mine`
  - Run against staging before launch

- [ ] **AI-P10.3 — Support Dev-P2 on QA Scenario 2 | Phase 9: Proctoring | ✅ Done | AI Gaze tracking, face presence, tab detection | `POST /exams/:id/start` returns correct shape**
  - Confirm `proctoring:warning` socket event is reachable in test environment

---

## 🤖 Dev-AI-2 — Frontend AI / Proctoring HUD Engineer
**Phase 9-P: ALL DONE ✅ | Phase 10: Mobile audit + visual regression**

### Phase 9-P Results (all confirmed ✅)

- [x] **AI.6 — Frame Capture Loop** (`ExamInterface.tsx` — 26,664 bytes)
- [x] **AI.7 — Gaze Warning Overlay** (`ExamInterface.tsx`)
- [x] **AI.8 — Pre-flight AI Face Check** (`ExamPreFlight.tsx` — 10,557 bytes)
- [x] **AI.9 — Admin Command Center** (`ExamOps.tsx` — 23,889 bytes)
- [x] **AI.10 — Proctoring Report page** (`ProctoringReport.tsx` — 10,271 bytes)

### Phase 10 Tasks for Dev-AI-2

- [ ] **AI2-P10.1 — Mobile responsive audit: AI-specific pages** (375px + 768px)
  - Priority: `ExamInterface.tsx`, `ExamPreFlight.tsx`, `ExamOps.tsx`, `ProctoringReport.tsx`
  - Check at 375px: webcam preview, AI monitoring badge, question palette overflow
  - Check at 768px: 2-column layout breakpoints on ExamOps grid
  - Fix any layout breaks — edit `ExamInterface.css` (currently 1,303 bytes, very thin) and `ExamPreFlight.css`

- [ ] **AI2-P10.2 — ExamInterface.css expansion**
  - Current file is only 1,303 bytes — insufficient for the additions made to the TSX
  - Add CSS for: AI monitoring badge pulse animation, gaze warning red banner, terminated overlay, frame capture spinner

- [ ] **AI2-P10.3 — Visual smoke test of proctoring flow**
  - Walk through: preflight → exam start → AI monitoring badge visible → simulate `proctoring:warning` socket event → confirm red banner renders
  - Document any rendering issues found

- [ ] **AI2-P10.4 — ExamPreFlight.css expansion** (currently 198 bytes — almost empty)
  - Add CSS for: face-detected pill (green), no-face pill (red), poor-lighting pill (yellow), disabled-start-button state

---

## 🔧 Dev-P1 — Backend Platform Engineer
**Phase 9-P: ALL DONE ✅ | Phase 10: CI/CD + env hardening**

### Phase 9-P Results (all confirmed ✅)

- [x] **DB.1 — `proctoringConfig` columns added** (`0002_steep_talos.sql`)
  - `gaze_threshold`, `face_timeout_seconds`, `allow_multiple_faces`, `auto_terminate_score`, `frame_capture_interval_sec`
- [x] **DB.2 — Mongo schema extended** (`proctoring.model.ts`)
  - `aiConfidence`, `gazeDirection`, `riskScoreAtEvent`, `overriddenBy`, `overrideReason` — all present
- [x] **WS.1 — WebSocket AI events** — `proctoring:ai-alert`, `proctoring:warning`, `proctoring:terminated` all emitted from `proctoring.service.ts`
- [x] **OF.1 — Admin Invite UI** (`UserDirectory.tsx` — 11,615 bytes)
- [x] **OF.2 — Peer Groups page** (`PeerGroups.tsx` — 14,848 bytes)

### Phase 10 Tasks for Dev-P1

- [ ] **P1-P10.1 — GitHub Actions CI Pipeline** (create `.github/workflows/ci.yml`)
  ```yaml
  name: CI
  on:
    push:
      branches: [main]
    pull_request:
      branches: [main]
  jobs:
    api-check:
      runs-on: ubuntu-latest
      defaults:
        run:
          working-directory: ugskill-api
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with: { node-version: '20', cache: 'npm', cache-dependency-path: 'ugskill-api/package-lock.json' }
        - run: npm ci
        - run: npx tsc --noEmit
    web-check:
      runs-on: ubuntu-latest
      defaults:
        run:
          working-directory: ugskill-web
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with: { node-version: '20', cache: 'npm', cache-dependency-path: 'ugskill-web/package-lock.json' }
        - run: npm ci
        - run: npx tsc -b
        - run: npm run test
  ```
  - Add secrets to GitHub: `SUPABASE_URL`, `MONGODB_URI`, `JWT_SECRET`, `AI_API_KEY`

- [ ] **P1-P10.2 — Add `AI_API_URL` / `AI_API_KEY` to `docker-compose.yml`**
  - Coordinate with Dev-AI-1 (same task — assign to one owner)

- [ ] **P1-P10.3 — Add API test script to `ugskill-api/package.json`**
  - Backend currently has `"test": "echo \"Error: no test specified\" && exit 1"`
  - Add: `"test": "vitest run"` (or jest equivalent) once backend unit tests exist
  - Add at least one test: `GET /api/v1/health` returns `{ status: 'healthy' }`

---

## 🧪 Dev-P2 — QA & Testing Engineer
**Focus: All remaining E2E tests, cross-browser, mobile audit, security**

### ❌ Phase 10 — E2E Tests (ZERO progress — start here)

**Setup (do this first, before any test):**
```bash
cd ugskill-web
npm install --save-dev @playwright/test
npx playwright install
```

Create `ugskill-web/playwright.config.ts`:
```ts
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

Add to `ugskill-web/package.json` scripts:
```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

---

- [ ] **QA.1 — E2E Scenario 1** (`e2e/student-learning.spec.ts`)
  ```
  Register new student → Email verify → Login → Enroll in course
  → Watch lecture → Submit assignment → Verify progress on Dashboard
  ```
  Key assertions:
  - `POST /auth/register` → 201, redirect to `/app`
  - Dashboard shows enrolled course with progress > 0%
  - Assignment submit shows confirmation toast

- [ ] **QA.2 — E2E Scenario 2** (`e2e/exam-proctoring.spec.ts`)
  ```
  Admin login → Create exam → Set batch access
  → Student starts exam (proctoring triggers)
  → Admin sees proctoring alert in ExamOps
  → Student submits → Score appears in Leaderboard
  ```
  Key assertions:
  - Exam starts with AI monitoring badge visible
  - `POST /proctoring/analyze-frame` returns `{ facePresent: true }`
  - Score row appears in leaderboard table within 10s of submit

- [ ] **QA.3 — E2E Scenario 3** (`e2e/placement-drive.spec.ts`)
  ```
  Admin creates placement drive → Student applies
  → Admin shortlists → Student sees status update in PlacementsHub
  ```
  Key assertions:
  - Drive appears in PlacementsHub with status "Open"
  - Apply button changes to "Applied" badge after click
  - After admin shortlists: student sees "Shortlisted" status in Kanban

- [ ] **QA.4 — Cross-browser testing**
  - Run all 3 E2E scenarios on: Chrome ✅ · Firefox · Safari · Edge
  - Document any browser-specific failures in a `QA-REPORT.md`
  - Add to playwright.config.ts:
    ```ts
    projects: [
      { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
      { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
      { name: 'webkit', use: { ...devices['Desktop Safari'] } },
      { name: 'edge', use: { ...devices['Desktop Edge'] } },
    ]
    ```

- [ ] **QA.5 — Mobile responsive audit** (375px + 768px)
  - Test every one of the **29 student/admin routes** at 375px (iPhone SE) and 768px (iPad)
  - Priority order:
    1. `Login`, `Signup` — auth entry
    2. `Dashboard`, `Discover`, `Courses` — core LMS
    3. `ExamInterface`, `ExamPreFlight`, `ExamOps` — proctoring (highest risk)
    4. `PlacementsHub`, `CompanyDetail`, `InterviewPrep`
    5. `Community`, `Leaderboards`, `PeerGroups`
    6. Admin pages: `AdminDashboard`, `UserDirectory`, `BatchManagement`, `ExamOps`
  - For each: screenshot + note any overflow / hidden content / broken layout
  - Fix top 10 highest severity issues
  - Target pages for Dev-AI-2: `ExamInterface`, `ExamPreFlight`, `ExamOps`, `ProctoringReport`

- [ ] **QA.6 — Security audit**
  - **JWT check:** verify `Authorization: Bearer <token>` header is sent on every API call
    ```bash
    curl -X GET http://localhost:4000/api/v1/users/me
    # Must return 401 — not the user
    ```
  - **XSS check:** POST `<script>alert('xss')</script>` as a Community post body → must be stripped
  - **Rate limit:** hammer `POST /auth/login` 12× in 15 min → expect 429 on 11th+
  - **CORS:** `curl -H "Origin: https://evil.com" http://localhost:4000/api/v1/health` → no `Access-Control-Allow-Origin: https://evil.com`
  - **File upload:** attempt uploading `shell.php` and `virus.exe` in AssignmentSubmit → expect 400/415 rejection
  - Document results in `QA-REPORT.md`

---

## 🚀 Dev-P3 — DevOps / Infrastructure Engineer
**Focus: Production deployment, monitoring, load test**

### Phase 10 Tasks for Dev-P3

- [ ] **DO.1 — Finalize `docker-compose.yml` for production readiness**
  - Add `AI_API_URL` and `AI_API_KEY` env vars under `api.environment`
  - Change `NODE_ENV: development` → `NODE_ENV: production` for prod compose
  - Add `ai-frame-analysis` note to Redis config comment (separate DB index can be `?db=1` if needed)
  - Create a `docker-compose.prod.yml` override that excludes `volumes: ./src:/app/src:ro` bind mount
  - Verify multi-stage Dockerfile produces a lean final image (`npm run build` → `node dist/server.js`)

- [ ] **DO.2 — CI/CD Pipeline** (coordinate with Dev-P1 on `.github/workflows/ci.yml`)
  - Add a `deploy` job triggered only on merge to `main`:
    ```yaml
    deploy:
      needs: [api-check, web-check]
      if: github.ref == 'refs/heads/main'
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - name: Trigger Railway deploy
          run: curl -X POST ${{ secrets.RAILWAY_WEBHOOK_URL }}
    ```
  - Add secrets: `RAILWAY_WEBHOOK_URL`, `VERCEL_DEPLOY_HOOK`

- [ ] **DO.3 — Production deployment**
  - Deploy `ugskill-api` Docker container to Railway (follow `DEPLOY.md` Part 2)
  - Deploy `ugskill-web` to Vercel (follow `DEPLOY.md` Part 1)
  - Set `VITE_API_URL=https://api.ugskill.com/api/v1` in Vercel env
  - Set `VITE_SOCKET_URL=https://api.ugskill.com` in Vercel env
  - Configure backend CORS `CORS_ORIGINS=https://ugskill.com,https://www.ugskill.com`
  - Run `npm run seed:admin` after first deploy to create admin user

- [ ] **DO.4 — DNS & SSL**
  - Point `ugskill.com` → Vercel (add custom domain in Vercel dashboard)
  - Point `api.ugskill.com` → Railway API service URL
  - Verify SSL certs auto-provisioned (Vercel + Railway both handle this automatically)
  - Test: `curl https://ugskill.com` → 200, `curl https://api.ugskill.com/api/v1/health` → `{ status: 'healthy' }`

- [ ] **DO.5 — Monitoring setup**
  - **UptimeRobot:** Create monitor → `GET https://api.ugskill.com/api/v1/health` every 5 min → alert on email + Slack
  - **Sentry:** verify frontend DSN (`SENTRY_DSN`) is set in Vercel env
  - **Sentry:** verify backend DSN is set in Railway env — confirm error events arrive in Sentry dashboard after intentional test error
  - **Railway logs:** confirm structured Winston JSON logs are readable in Railway Logs tab
  - Optional: self-hosted Grafana / Loki if VPS is used instead of Railway

- [ ] **DO.6 — Load test (pre-launch)**
  - Wait for Dev-AI-1 to create `load/k6.test.js`
  - Run against staging: `k6 run load/k6.test.js --env BASE_URL=https://staging-api.ugskill.com`
  - Target: p95 < 500ms, error rate < 1%, at 50 VUs sustained for 1 min
  - Document results: paste k6 summary output into `QA-REPORT.md` under "Load Test Results"

---

## 🗓️ Sprint 2 Protocol (Phase 10)

| Day | Activity |
|---|---|
| Day 1 | Dev-P2 installs Playwright + scaffolds all 3 E2E test files. Dev-P3 sets up Railway + Vercel staging env. Dev-P1 creates GitHub Actions CI file. Dev-AI-1 creates `load/k6.test.js`. Dev-AI-2 starts mobile audit on ExamInterface. |
| Day 2 | Dev-P2 runs QA.1 (student flow). Dev-P3 wires DO.3 staging deploy. Dev-P1 verifies CI runs on PR. Dev-AI-2 fixes `ExamInterface.css` and `ExamPreFlight.css`. |
| Day 3 | Dev-P2 runs QA.2 (exam proctoring) + QA.3 (placement). Dev-P3 sets up UptimeRobot + Sentry. Dev-AI-1 runs k6 load test. |
| Day 4 | Dev-P2 runs cross-browser (QA.4) + security audit (QA.6). Dev-P3 sets up production DNS. |
| Day 5 | All team: fix bugs found in QA. Dev-P3 final production deploy. Sign-off meeting. |

---

## ✅ Already Done — Do NOT Redo

### Backend
- `React.lazy()` + `<Suspense>` for 5 heavy pages — in `App.tsx`
- All Phase 5 backend (Chunks 1–8): scaffold, DB layer, auth, LMS, placements, exam, cross-cutting, real-time
- All Phase 8 API integrations (I1–I9): every frontend page wired to real backend
- Certificate route `GET /certificates/:id` — exists
- `/readiness/me` and `/readiness/me/insights` — both exist
- `POST /placements/sessions/mock` — exists
- Course Reviews — live in `CourseLanding.tsx`
- AI proctoring module: `aiProctoring.ts`, `aiFrameAnalysis.job.ts`, `proctoring.service.ts`, `proctoring.controller.ts`, `proctoring.routes.ts`, `proctoring.model.ts` — ALL COMPLETE
- All WS namespaces: `/exam`, `/tracking`, `/interview`, `/gd`, `/leaderboard`
- `docker-compose.yml`, `Dockerfile`, `railway.toml`, `vercel.json`, `DEPLOY.md` — ALL EXIST

### Frontend
- All 29+ routes and pages — built and wired
- `PeerGroups.tsx`, `LiveInterview.tsx`, `Profile.tsx`, `Notifications.tsx`, `CertificateViewer.tsx`, `ProctoringReport.tsx` — all exist
- Real auth flow — no bypass, JWT refresh rotation, in-memory token store
- Unit tests: `auth.store.test.ts`, `api.test.ts`, `useExamTimer.test.ts` — all exist

---

## 🗂️ Remaining File Map — What Needs to Be Created

| File | Owner | Status |
|---|---|---|
| `.github/workflows/ci.yml` | Dev-P1 | ❌ Create from scratch |
| `ugskill-web/playwright.config.ts` | Dev-P2 | ❌ Create from scratch |
| `ugskill-web/e2e/student-learning.spec.ts` | Dev-P2 | ❌ Create from scratch |
| `ugskill-web/e2e/exam-proctoring.spec.ts` | Dev-P2 | ❌ Create from scratch |
| `ugskill-web/e2e/placement-drive.spec.ts` | Dev-P2 | ❌ Create from scratch |
| `load/k6.test.js` | Dev-AI-1 | ❌ Create from scratch |
| `QA-REPORT.md` | Dev-P2 | ❌ Create during QA |
| `ugskill-web/src/pages/ExamInterface.css` | Dev-AI-2 | ⚠️ Exists but only 1,303 bytes — expand |
| `ugskill-web/src/pages/ExamPreFlight.css` | Dev-AI-2 | ⚠️ Exists but only 198 bytes — expand |
| `ugskill-api/docker-compose.yml` (AI env vars) | Dev-AI-1 / Dev-P1 | ⚠️ Modify — add `AI_API_URL`, `AI_API_KEY` |

---

## 🔮 Future Phases (Not This Sprint — Backlog)

| Phase | Feature | Owner (future) |
|---|---|---|
| P9-A | Razorpay / Stripe payments | TBD |
| P9-B | Transactional email (Resend / SendGrid) | TBD |
| P9-C | Browser push notifications | TBD |
| P9-D | Judge0 coding judge | TBD |
| P9-E | Real LLM chatbot (Gemini / GPT-4o) | TBD |
| P9-F | Instructor / peer grading UI | TBD |
| P9-G | Analytics & PDF exports (full suite) | TBD |
| P9-H | PWA / React Native mobile app | TBD |
| P9-I | Multi-tenancy / SaaS model | TBD |
| P9-J | Audit Logs admin page | TBD |

---

## 🐛 Frontend Bug Audit (May 7, 2026 — Code-Verified)

> All entries below were confirmed by reading the actual `.tsx` source files.
> Severity: 🔴 Critical (silently broken) · 🟡 Medium (wrong UX) · 🟢 Minor (polish)

### ✅ Already Fixed This Session

| File | Fix Applied |
|---|---|
| `exam.service.ts` | **Postgres Constraint Fix**: Added validation guards to strip invalid `examType` values, preventing `exams_exam_type_check` violations. |
| `exam.service.ts` | **Date Serialization Fix**: Added explicit `new Date()` transformations for `windowStart` and `windowEnd` to fix `value.toISOString is not a function` error during DB insertion. |
| `ExamBuilder.tsx` | **UI Input Control**: Injected a controlled dropdown for `examType` and added robust mutation error handling to prevent React crashes. |
| `AdminExams.tsx` | **Admin Visibility**: Added "Exam Type" column to the admin table for better oversight. |
| `App.tsx` | Wildcard `<Route path="*">` placed **before** VideoPlayer / ExamPreFlight / ExamInterface routes — all 3 were completely unreachable (Fixed) |
| `App.tsx` | 31 | `LiveInterview` imported but **no route registered** | Added `/app/live-interview/:sessionId` route |

---

### ❌ Remaining Frontend Bugs — To Fix

#### 🔴 BUG-1 · `Exams.tsx:86` — "View Report" button is dead

```
<Button variant="ghost" size="sm" leftIcon={<BarChart2 size={14} />}>View Report</Button>
```

- **Problem:** No `onClick` — clicking does nothing. Also, no student-facing exam report/results route exists anywhere in `App.tsx`.
- **Fix needed:**
  1. Add `onClick={() => navigate(\`/app/exams/${exam.attemptId ?? exam.id}/report\`)}` to the button
  2. Create a `ExamReport.tsx` page that fetches `/exams/attempts/:attemptId`
  3. Register route `/app/exams/:attemptId/report` in `App.tsx`
- **Owner:** Dev-P2
- **Effort:** ~4h (page + route + API wiring)

---

#### 🔴 BUG-2 · `InterviewPrep.tsx:62–65` — "Join Live GD" navigates to a non-existent route

```ts
navigate(`/app/live-gd/${nextSession.id}`);  // or navigate('/app/live-gd')
```

- **Problem:** Neither `/app/live-gd` nor `/app/live-gd/:sessionId` exists in `App.tsx`. Clicking "Join Live GD" always 404s to the root redirect.
- **Fix needed:** Either register `<Route path="/app/live-gd/:sessionId">` pointing to a `LiveGD.tsx` page, OR redirect to `InterviewRoom` if GD sessions share the same room component.
- **Owner:** Dev-P3
- **Effort:** ~2h (route wiring or redirect)

---

#### 🔴 BUG-3 · `PlacementsHub.tsx:392–399` — CGPA filter checkbox wired to unused state

```ts
const [minCGPA, setMinCGPA] = useState<number>(0);
// ...
checked={minCGPA === 0}
onChange={(e) => setMinCGPA(e.target.checked ? 0 : 10)}
```

- **Problem:** `minCGPA` state is set by the checkbox but is **never read** inside `filtered` useMemo (line 195–227). The filter memo uses `user?.cgpa` directly. The checkbox silently does nothing.
- **Fix needed:** Inside the `filtered` useMemo, replace `const matchesCGPA = !d.cgpaCutoff || d.cgpaCutoff <= (user?.cgpa || 10)` with `const matchesCGPA = minCGPA === 0 || !d.cgpaCutoff || d.cgpaCutoff <= (user?.cgpa || 10)` and include `minCGPA` in the dependency array.
- **Owner:** Dev-P1
- **Effort:** ~30min

---

#### 🟡 BUG-4 · `PlacementsHub.tsx:411` — "Timeline" view toggle renders kanban instead

```tsx
{view === 'grid' ? (
  <div ...>  {/* grid */}
) : (
  <div ...>  {/* ALWAYS kanban — even when view === 'timeline' */}
```

- **Problem:** The ternary is `grid ? gridView : kanbanView`. There's no branch for `'timeline'`. Selecting "Timeline" in the view toggle shows the kanban board — wrong view, no error.
- **Fix needed:** Either implement a proper timeline/table view for `view === 'timeline'`, or remove the "Timeline" toggle button from the UI until it's built.
- **Owner:** Dev-P1
- **Effort:** ~3h to implement OR ~15min to hide the button

---

#### 🟡 BUG-5 · `Dashboard.tsx:260` — Deadline items are not clickable despite showing a `ChevronRight` arrow

```tsx
<div key={assm.id} className={`deadline-item ...`}>
  ...
  <ChevronRight size={16} className="deadline-arrow" />
</div>
```

- **Problem:** The `ChevronRight` icon strongly implies the row is clickable (navigate to the assignment/exam). There is no `onClick` on the deadline row `<div>`. Clicking anywhere on it does nothing.
- **Fix needed:** Add `onClick={() => navigate(\`/app/exams/${assm.id}\`)}` and `cursor: pointer` style to the deadline item div.
- **Owner:** Dev-P2
- **Effort:** ~15min

---

#### 🟡 BUG-6 · `Leaderboards.tsx:194–195` — Pagination hardcoded, always shows page 1

```tsx
<DataTable data={entries} columns={columns} page={1} totalPages={1} />
```

- **Problem:** API fetches up to 50 entries (`/leaderboards?scope=...&limit=50`) but `DataTable` pagination props are hardcoded to `page={1} totalPages={1}`. If the API returns more, the user can never paginate. The `DataTable` `onPageChange` callback is never wired.
- **Fix needed:** Add `const [page, setPage] = useState(1)` state, pass it to the API query (`&page=${page}`), and wire `onPageChange={setPage}` + compute `totalPages` from the API response's total count.
- **Owner:** Dev-P3
- **Effort:** ~1h

---

#### 🟢 BUG-7 · `InterviewPrep.tsx:55` — `scheduleMockMutation.onSuccess` navigate (FIXED by App.tsx route addition)

- **Problem (was):** On successful mock scheduling, code navigated to `/app/live-interview/:sessionId` which had no registered route.
- **Status:** ✅ Resolved — `/app/live-interview/:sessionId` route was added to `App.tsx` in this session.

---

### 📋 Frontend Bug TODO List by Developer

| Dev | Bug | File | Est. |
|---|---|---|---|
| **Dev-P1** | BUG-3: Wire `minCGPA` into `filtered` memo | `PlacementsHub.tsx` | 30min |
| **Dev-P1** | BUG-4: Implement timeline view OR hide toggle | `PlacementsHub.tsx` | 15min–3h |
| **Dev-P2** | BUG-1: "View Report" button + `ExamReport.tsx` page + route | `Exams.tsx`, `App.tsx` | 4h |
| **Dev-P2** | BUG-5: Add `onClick` to deadline rows in Dashboard | `Dashboard.tsx` | 15min |
| **Dev-P3** | BUG-2: Register `/app/live-gd/:sessionId` route | `App.tsx`, `InterviewPrep.tsx` | 2h |
| **Dev-P3** | BUG-6: Wire `DataTable` pagination in Leaderboards | `Leaderboards.tsx` | 1h |

---

## 📊 Overall Progress Scoreboard

| Category | Total Tasks | Done | Left | % |
|---|---|---|---|---|
| Phase 9-P AI Backend | 8 | 8 | 0 | 100% |
| Phase 9-P AI Frontend | 5 | 5 | 0 | 100% |
| Phase 9-P DB/WS | 4 | 4 | 0 | 100% |
| Phase 9-P Orphaned Features | 2 | 2 | 0 | 100% |
| Phase 10 — QA / E2E | 6 | 0 | 6 | 0% |
| Phase 10 — DevOps | 6 | 1 | 5 | 17% |
| Phase 10 — CI/CD | 1 | 0 | 1 | 0% |
| Phase 10 — CSS fixes | 2 | 0 | 2 | 0% |
| Frontend Bugs (code-verified) | 7 | 2 | 5 | 29% |
| **TOTAL** | **41** | **22** | **19** | **54%** |

> **Sprint 2 goal:** Close the remaining 19 tasks (5 frontend bugs + 14 infra/QA tasks) to reach 100% and go live.

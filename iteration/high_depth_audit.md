# High-Depth Technical Audit: UGSkill Systemic Bottlenecks

**Audit Date**: May 9, 2026
**Status**: CRITICAL GAPS IDENTIFIED
**Scope**: RBAC Security, Proctoring Integrity, Placement Pipeline, Infrastructure Robustness

---

## 1. RBAC & Security Audit: "The Open Vault"
### [CRITICAL] PII Exposure in Placement Registrations
*   **File**: `ugskill-api/src/modules/placement/placement.controller.ts`
*   **Vulnerability**: The `listRegistrations` endpoint (used for applicant lists) lacks the `req.user.roles.includes('admin')` guard present in other sensitive controllers.
*   **Impact**: Any authenticated student can call `/api/v1/placements/registrations` and retrieve the full names, IDs, and drive statuses of every other student on the platform.
*   **Recommendation**: Implement immediate scoping middleware to restrict `studentId` to `req.user.userId` unless the role is `admin` or `hr`.

### [HIGH] Self-Signed Proctoring Events
*   **Vulnerability**: The `ingestProctoringEvent` endpoint accepts arbitrary payloads from the client.
*   **Impact**: A malicious user can intercept the request and send a "clean" heartbeat even if the AI engine detected violations. There is no server-side validation of the "Incident Confidence" or "Timestamp Integrity".

---

## 2. Proctoring Integrity: "The Client-Side Illusion"
### [MAJOR] Lack of Server-Side Verification
*   **Finding**: The `ProctoringEngine.ts` (TFJS/MediaPipe) is technically sophisticated but entirely client-bound.
*   **Gap**: If a student blocks the API endpoint or disables the JS loop, the server has no "Proof of Absence." The system defaults to "No Incidents" rather than "Proctoring Disconnected."
*   **Recommendation**:
    1.  Implement a **Server-Side Heartbeat**: Client must send a signed ping every 30s.
    2.  Failure to receive 3 consecutive pings should auto-flag the exam attempt for "Proctoring Breach."

---

## 3. Placement Pipeline: "The Disconnected HR Portal"
### [STRUCTURAL] Admin-HR Disconnect
*   **Finding**: `HRDashboard.tsx` contains advanced applicant management (shortlisting, move-to-next-round), but it is orphaned from the `Admin/PlacementsConfig` workflow.
*   **Gap**: Admins setting up drives cannot see the "fruits of the drive" (the applicants) without manually navigating to a separate HR route which isn't linked in the sidebar.
*   **Recommendation**: Port the `ApplicantTable` component from HR portal into the `DriveConfig` drill-down view.

### [FUNCTIONAL] "Blind Apply" Vulnerability
*   **Finding**: Students can apply to placements without a validated profile or resume.
*   **Gap**: `registerForDrive` in `placement.service.ts` only checks for existence of the drive, not the eligibility or profile completeness of the student.

---

## 4. Infrastructure & "Zombie" Code
### [OPERATIONAL] Placeholder Admin Dashboard
*   **File**: `ugskill-web/src/pages/admin/AdminDashboard.tsx`
*   **Finding**: The dashboard returns hardcoded 0s because `/api/v1/admin/stats` is unimplemented.
*   **Impact**: Provides zero visibility into platform growth or exam health.

### [INFRASTRUCTURE] Hard-Crash on Database Failure
*   **File**: `ugskill-api/src/config/mongodb.ts`
*   **Finding**: `process.exit(1)` is called if Mongo is unreachable for 5s.
*   **Impact**: Even if Postgres (core user data) is healthy, a temporary Mongo hiccup takes down the entire API, preventing students from even viewing their profiles.

### [OPERATIONAL] Manual Question Entry Bottleneck
*   **File**: `ugskill-web/src/pages/admin/ExamBuilder.tsx`
*   **Finding**: Zero support for CSV/Bulk imports.
*   **Impact**: Scaling the exam bank is impossible for high-volume recruitment drives.

### [LOGICAL] Mocked Readiness Scores
*   **File**: `ugskill-api/src/modules/placement/placement.service.ts`
*   **Finding**: `computeReadinessScore` uses `Math.random()`.
*   **Gap**: The flagship "AI Readiness" feature is a facade in manual refresh mode, despite having a partially working CDC Sync job in the background.

---

## 5. Immediate Action Plan (Phase 10)

| **P0** | Fix PII leak in `listRegistrations` | `placement.controller.ts` |
| **P0** | Implement `/admin/stats` API | `admin.service.ts` |
| **P1** | Add CSV/Excel Question Importer | `ExamBuilder.tsx` |
| **P1** | Link HR Applicant View to Admin Drive Config | `PlacementsConfig.tsx` |
| **P1** | Add "Proctoring Heartbeat" to API | `exam.service.ts` |
| **P2** | Replace `Math.random()` with Real Aggregation | `placement.service.ts` |
| **P2** | Soften MongoDB Connection Logic | `mongodb.ts` |



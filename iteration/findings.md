# UGSkill Unified Audit Findings: Functional & Technical Deep-Dive

**Date**: May 10, 2026  
**Status**: COMPREHENSIVE AUDIT COMPLETE  
**Severity**: CRITICAL GAPS IDENTIFIED

---

## 1. Executive Summary
The UGSkill platform possesses a sophisticated skeletal structure (AI Proctoring, CDC Sync, Multi-module Architecture) but lacks the "Action Layer" and "Security Hardening" required for production-grade reliability. Key risks include PII exposure, infrastructure fragility, and major administrative "visibility" gaps in the placement pipeline.

---

## 2. Security & RBAC: [CRITICAL]
### PII Exposure in Placement Registrations
*   **Finding**: The `/api/v1/placements/registrations` endpoint lacks role-based scoping in `placement.controller.ts`.
*   **Risk**: Any student can retrieve the full names, IDs, and statuses of every applicant on the platform.
*   **Remedy**: Restrict `studentId` to `req.user.userId` for non-admin/HR roles.

### "Self-Signed" Proctoring Events
*   **Finding**: The `ingestProctoringEvent` endpoint accepts arbitrary payloads from the client without server-side validation of confidence scores or timestamp integrity.
*   **Risk**: High-technical users can spoof "Clean" proctoring logs.

---

## 3. Infrastructure & Resilience: [CRITICAL]
### MongoDB Hard-Crash Dependency
*   **Finding**: `ugskill-api/src/config/mongodb.ts` calls `process.exit(1)` if Mongo is unreachable for 5s.
*   **Risk**: A temporary Mongo hiccup takes down the entire platform, even if Postgres (core user/RBAC data) is healthy.

### Proctoring "Client-Side" Illusion
*   **Finding**: Detection is 100% client-bound (TFJS/MediaPipe).
*   **Risk**: No "Proof of Absence." If a student blocks the API or disables JS, the server defaults to "No Incidents."
*   **Remedy**: Implement a server-side heartbeat/ping loop.

---

## 4. Module-Wise Functional Gaps
### Placement Module (Highest Priority)
*   **Admin Visibility**: Admins can create drives but are "blind" to applicants. No list view of candidates exists in the `PlacementsConfig` workflow.
*   **"Blind Apply" Flow**: Students apply with 1-click; no resume upload, profile verification, or eligibility check is enforced.
*   **Status Tracking**: No visual timeline (Applied -> Exam -> Interview) for students to track their progress.

### Exam Module
*   **Bulk Entry Bottleneck**: Zero support for CSV/Excel question imports. Scaling the question bank is currently a manual click-heavy chore.
*   **Student Utilities**: Missing basic exam tools (Scientific Calculator, Virtual Scratchpad) specified in the documentation.
*   **Topic-Wise Analysis**: Results show raw scores only; lacking the "Skill Heatmap" (e.g., performance in DSA vs. OS) promised in Doc 2.4.

### LMS Module
*   **AI Sidebar Missing**: The promised AI Tutor sidebar in the video player is currently a placeholder or missing UI link.
*   **Roadmap Builder**: No UI to group courses into logical learning stages or enforce prerequisites.

---

## 5. "Zombie" Code & Technical Debt
*   **Placeholder Admin Dashboard**: The primary KPI dashboard returns hardcoded 0s because `/api/v1/admin/stats` is unimplemented.
*   **Mocked Readiness Scores**: Manual "Refresh Score" buttons use `Math.random()` despite having a partially functional background aggregation job.
*   **Schema Fragmentation**: Overlapping collections in Mongo (`examdefinitions` vs `exam_definitions`) leading to potential data orphans.

---
*Audit consolidated by Antigravity AI.*

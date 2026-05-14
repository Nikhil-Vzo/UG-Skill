# Phase 10: Platform Hardening & Feature Parity Plan

**Goal**: Transform UGSkill from a "Skeletal Prototype" to a "Production-Ready Platform" by closing security leaks and implementing critical administrative valves.

---

## 🚀 Priority 0: Security & Stability (Immediate)
- [ ] **Fix PII Leak**: Add `requireRole` and `studentId` scoping to `listRegistrations` controller.
- [ ] **Mongo Resilience**: Replace `process.exit(1)` with a retry mechanism or "Degraded Mode" flag in `mongodb.ts`.
- [ ] **Admin Stats**: Implement `/api/v1/admin/stats` to power the Admin Dashboard KPIs.

## 🚀 Priority 1: Placement Pipeline (Visibility & Action)
- [ ] **Admin Applicant Table**: Build `/admin/placements/:id/applicants` view (port from HR portal).
- [ ] **Resume Integration**: Add mandatory resume upload/selection to the `registerForDrive` flow.
- [ ] **Application Timeline**: Implement the visual stepper (Status Tracking) in `PlacementsHub`.
- [ ] **Shortlist Logic**: Wire "Shortlist/Reject" buttons in the Admin Applicant table.

## 🚀 Priority 2: Exam & Proctoring (Integrity)
- [ ] **Bulk Importer**: Implement CSV/Excel parser for `ExamBuilder` question bank.
- [ ] **Proctoring Heartbeat**: Implement a server-side heartbeat check to detect "Proctoring Disconnection."
- [ ] **Student Utilities**: Add draggable Calculator and Scratchpad to `ExamInterface`.
- [ ] **Skill Graph**: Replace raw scores with topic-wise analysis in the Results view.

## 🚀 Priority 3: LMS & AI (Experience)
- [ ] **AI Sidebar**: Wire the LLM backend to the `VideoPlayer` sidebar for concept clarification.
- [ ] **Roadmap Builder**: Create the UI to link courses into staged Learning Roadmaps.
- [ ] **Real Readiness**: Replace `Math.random()` with the actual background aggregation logic in `placement.service.ts`.

---

## 🛠️ Infrastructure Checklist
- [ ] Audit MongoDB collections for duplication (`exam_definitions` vs `examdefinitions`).
- [ ] Ensure all API endpoints have `try/catch` wrappers and standard error responses.
- [ ] Validate Redis/Socket.io connection resilience for high-concurrency exams.

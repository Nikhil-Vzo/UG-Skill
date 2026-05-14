# Deep Iteration: Technical & Functional Audit

**Goal**: Identify architectural, security, and deep-logic gaps in UGSkill.

## Phase 1: Security & RBAC Audit
- [ ] Investigate `ugskill-api` middleware for role-based access.
- [ ] Check if `/hr` endpoints are accessible to `student` role.
- [ ] Audit data leakage in applicant lists (PII exposure).

## Phase 2: Proctoring & Integrity Depth
- [ ] Deconstruct `ExamInterface.tsx` proctoring triggers.
- [ ] Verify server-side validation of proctoring incidents.
- [ ] Check for "offline mode" vulnerabilities in exam submission.

## Phase 3: Architectural "Dark Matter"
- [ ] Analyze cross-module dependencies (LMS -> Exam -> Placement).
- [ ] Check for "Zombie Code" (files that exist but aren't used).
- [ ] Performance audit: Large component re-renders (CourseBuilder, PlacementsConfig).

## Phase 4: Extreme UX Edge Cases
- [ ] "The Midnight Submission": What happens on network failure during the last 10 seconds of an exam?
- [ ] "The Profile Paradox": Can a student apply to a drive, then delete their profile?
- [ ] "The Bulk Failure": Test CSV import with 10,000 malformed rows.

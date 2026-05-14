# UGSkill Functional Flow Audit - Phase 1 Findings

**Date**: May 9, 2026
**Status**: Completed (Initial Research & Flow Mapping)

## 1. Executive Summary
The UGSkill platform has a robust foundation for LMS and Exam execution. However, the **Placement Module** currently lacks the "Action Layer" for administrators (candidate shortlisting, bulk processing, and gating). The **Exam Module** requires operational utilities for high-stakes testing, and the **LMS** needs deeper integration with the AI-assisted content generation features mentioned in the documentation.

---

## 2. LMS Module (Learning Management System)

### 🟢 Existing Features
- **Course Builder**: Section and lecture management (Video, Doc, Text, Link).
- **Course Player**: Responsive player with auto-completion and note-taking.
- **Admin Dashboard**: Overview of courses and basic engagement.

### 🔴 Functional Gaps & Broken Flows
| Feature | Admin Perspective | Student Perspective |
| :--- | :--- | :--- |
| **AI Question Gen** | **Missing UI Link**: Backend supports it, but the Course Builder lacks a "Generate Quiz from this Video/Doc" button. | N/A |
| **Integrated AI Tutor** | N/A | **Missing**: No side-panel for "Ask AI" during video playback to clarify concepts. |
| **Collaboration** | **Missing**: No "Discussion Board" management or comment moderation. | **Missing**: Peer-to-peer discussion or "Ask Teacher" thread. |
| **Bulk Content** | **Missing**: No bulk upload for course metadata or external playlists. | N/A |

---

## 3. Exam Module

### 🟢 Existing Features
- **AI Proctoring**: Advanced engine with face detection, multi-tab prevention, and socket.io events.
- **Exam Builder**: Interface for creating sections and individual questions.
- **Student Interface**: Question palette, timer, and submission flow.

### 🔴 Functional Gaps & Broken Flows
| Feature | Admin Perspective | Student Perspective |
| :--- | :--- | :--- |
| **Bulk Import** | **Missing**: Cannot upload 100+ questions via Excel/CSV. Must be added one-by-one. | N/A |
| **Utility Tools** | N/A | **Missing**: Scientific Calculator, Virtual Scratchpad, and Question Reporting. |
| **Section Gating** | **Logic Gap**: UI allows creating sections but doesn't clearly support "Complete Section A before Section B". | N/A |
| **Advanced Reports** | **Broken Flow**: "View Report" button (BUG-1) is often a dead link or lacks granular analysis. | **Broken Flow**: Results show only raw score; lacks "Review Answers" mode. |

---

## 4. Placement Module (High Priority)

### 🟢 Existing Features
- **Company Registry**: Basic CRUD for partner companies.
- **Drive Management**: Create drives with CGPA cutoffs and role descriptions.
- **Student Hub**: Kanban/Grid view of available drives and "Apply" button.

### 🔴 Functional Gaps & Broken Flows
| Feature | Admin Perspective | Student Perspective |
| :--- | :--- | :--- |
| **Candidate Management** | **CRITICAL GAP**: No list of applicants is visible. Admin sees "10 Applied" but cannot see WHO they are. | N/A |
| **Shortlisting/Gating** | **Missing**: No UI to shortlist candidates based on Exam Scores or Resume screening. | **Logic Gap**: Applying is 1-click; no "Resume Upload" or "Profile Review" step. |
| **Bulk Actions** | **Missing**: No bulk "Shortlist All > 8.0 CGPA" or "Reject All Ineligible". | N/A |
| **Timeline View** | **Incomplete**: `ListOrdered` icon exists but renders a simple list instead of a chronological recruitment timeline. | **Incomplete**: No visual progress tracker (e.g., "Round 1 Done -> Waiting for Round 2"). |
| **Communications** | **Missing**: No "Send Notification" or "Email All Candidates" feature. | N/A |

---

## 5. Phase 10 Recommendations (Action Plan)

### High Impact Fixes (Week 1)
1. **Admin Applicant List**: Create a dedicated view at `/app/admin/placements/:id/applicants` to list and filter candidates.
2. **Bulk Question Import**: Implement CSV/Excel parser for the `ExamBuilder`.
3. **Resume Integration**: Add a mandatory "Upload/Select Resume" step in the `PlacementsHub` apply flow.

### Secondary Polish (Week 2)
1. **AI Question Generator UI**: Wire the existing LLM backend to a button in the `CourseBuilder`.
2. **Exam Utilities**: Add a draggable calculator and scratchpad to `ExamInterface`.
3. **Timeline Visualization**: Implement a true vertical timeline in `PlacementsHub` for active recruitment cycles.

---

## 6. Audit Verdict
The platform is **70% Feature Ready** but **40% Workflow Ready**. The technical "pipes" (API, DB, AI) are mostly laid, but the "valves" (UI buttons, lists, bulk actions) are missing in the Placement and Exam admin modules.

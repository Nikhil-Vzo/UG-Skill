# UGSkill "Upground" Functional Flow Audit

**Project**: UGSkill (LMS, Exam, Placement)  
**Audit Phase**: 1 (Comprehensive Flow Mapping)  
**Objective**: Align production codebase with the 21-panel technical specifications.

---

## 1. LMS Module: The Learning Journey

### 🔄 Student Flow: Discovery to Mastery
*   **Ideal State**: A student enters, sees a **Learning Roadmap** (staged courses), enrolls, and watches videos with an **AI Sidebar** that explains concepts, takes timestamped notes, and searches through transcripts.
*   **Current Reality**: Students browse a simple list of courses. The video player is functional but "lonely"—no AI sidekick, no transcript, and no automated certificate issuance.

### 🔴 Critical Gaps (Missing "Valves")
| Feature Area | Missing Logic / Button | Impact |
| :--- | :--- | :--- |
| **Roadmaps** | **Roadmap Builder UI**: No way to group courses into "Stages". | High |
| **Video Player** | **AI Tutor Panel**: Missing the "Ask AI" sidebar specified in Doc 16.1. | Medium |
| **Video Player** | **Transcript View**: No scrollable, searchable text transcript. | Medium |
| **Engagement** | **Daily Streaks**: No gamification (GitHub-style heatmap) as per Doc 9.1. | Low |
| **Certification** | **Verification Portal**: No public URL to verify student certificates. | High |

### 🛠️ Admin Perspective
*   **The "Dead End"**: The Course Builder allows adding content, but there is no **"AI Gen"** button to automatically create quizzes from the uploaded video transcript.
*   **Gating Logic**: Missing the "Prerequisite" valve—e.g., "Student cannot start Course B until Quiz A is passed with 80%".

---

## 2. Exam Module: High-Stakes Assessment

### 🔄 Student Flow: Testing Under Pressure
*   **Ideal State**: Student joins a "Live" exam, passes a system/camera check, and has access to a **Scientific Calculator** and **Digital Scratchpad** while being monitored by AI. After submission, they get a **Bloom’s Taxonomy** breakdown of their performance.
*   **Current Reality**: The AI proctoring is strong, but the student is missing basic tools (calc/scratchpad). The result is just a number; they can't see WHICH topics (e.g., "Recursion", "Big O") they are weak in.

### 🔴 Critical Gaps (Missing "Valves")
| Feature Area | Missing Logic / Button | Impact |
| :--- | :--- | :--- |
| **Question Bank** | **Bulk Import (CSV/Excel)**: Admin must add 100 questions manually. | **CRITICAL** |
| **Exam Interface** | **Draggable Utilities**: No calculator or scratchpad widgets. | High |
| **Post-Exam** | **Topic-wise Analysis**: Results lack the "Skill Graph" visualization. | Medium |
| **Monitoring** | **Incident HUD**: Admin needs a real-time list of "Red Flag" students. | High |
| **Question Types** | **Coding Sandbox**: Missing the "Code Execution" question type. | Medium |

### 🛠️ Admin Perspective
*   **Flow Error**: Creating an exam doesn't allow "Versioning". If an admin updates a question, it changes for everyone immediately, even for those currently taking it.

---

## 3. Placement Module: Career Fulfillment (Highest Priority)

### 🔄 Student Flow: Application to Offer
*   **Ideal State**: Student sees a Drive, the system checks their CGPA/Skills automatically, they **Select a Resume** from their profile, and apply. They then track their status through a **Visual Timeline** (Applied -> Exam -> Interview -> Hired).
*   **Current Reality**: It's a "Black Box". Students click "Apply" and then... nothing happens. They can't see their status, and they never uploaded a resume.

### 🔴 Critical Gaps (Missing "Valves")
| Feature Area | Missing Logic / Button | Impact |
| :--- | :--- | :--- |
| **Profile** | **Admin UI** | **Applicant Visibility**: Admin cannot see applicants in `DriveConfig`, though `HRDashboard` has them. | **CRITICAL** |
| **UX Flow** | **Portal Disconnect**: No link between Admin Placement Config and HR Portal. | High |
| **Filtering** | **Shortlist Buttons**: Missing in Admin view (only exists in HR view). | **CRITICAL** |
| **Profile** | **Resume Manager**: No place for students to upload/parse CVs. | **CRITICAL** |
| **Apply Flow** | **Blind Apply**: 1-click apply without resume selection or profile verification. | High |
| **Status Tracking** | **Visual Timeline**: No "Application Progress" stepper for students. | High |
| **Integration** | **Auto-Sync Scores**: Exam scores don't automatically appear in the Placement list. | Medium |

### 🛠️ Admin Perspective
*   **The "Blind" Admin**: You can create a "Google SDE Drive", but you are blind to the 50 students who applied. There is no **"View Applicants"** button that leads to a filterable table.

---

## 4. Phase 10 Execution Strategy (The "Upground" Plan)

### 🚀 Week 1: The "Visibility" Sprint
1.  **Placement Applicant List**: Build the data table at `/admin/placements/:id/applicants`.
2.  **Resume Upload**: Add the Resume field to the `User` model and a simple upload in `PlacementsHub`.
3.  **Bulk Question Importer**: Build the CSV parser for `ExamBuilder`.

### 🎨 Week 2: The "Intelligence" Sprint
1.  **AI Sidebar for LMS**: Integrate the existing LLM into the `VideoPlayer` view.
2.  **Exam Tools**: Implement the draggable Calculator and Scratchpad components.
3.  **Placement Status Logic**: Add a `status` field (Pending, Shortlisted, Rejected) to `PlacementApplication`.

---

## 5. Audit Verdict
The platform has the **Skeletal Structure** but lacks the **Connective Tissue**. 
*   **LMS**: Needs more "Glue" (AI integration, Roadmap logic).
*   **Exam**: Needs more "Tools" (Bulk import, Student utilities).
*   **Placement**: Needs a **Complete Overhaul** of the Admin interface (Visibility & Gating).

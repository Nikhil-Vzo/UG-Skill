# UGSkill — Frontend Sitemap
> Dev server: `http://localhost:5173` | All protected routes require login (or use DEV BYPASS on login page)
> Last updated: April 18, 2026 — All F1–F9 routes implemented ✅

---

## 🔓 Public Routes (No login required)

| Page | URL | File |
|------|-----|------|
| Login | `/login` | `src/pages/Login.tsx` |
| Sign Up | `/register` | `src/pages/Signup.tsx` |
| Forgot Password | `/forgot-password` | `src/pages/ForgotPassword.tsx` |
| Reset Password | `/reset-password` | `src/pages/ResetPassword.tsx` |

> **DEV TIP:** Go to `/login` and click **"DEV BYPASS"** to skip auth and get into the app instantly.

---

## 🎓 Student Portal (Protected — inside DashboardLayout)

### LMS

| Page | URL | File | Notes |
|------|-----|------|-------|
| Dashboard | `/` | `src/pages/Dashboard.tsx` | Streak calendar, active courses, pending assignments |
| Course Catalog | `/discover` | `src/pages/Discover.tsx` | Search, filter, course cards |
| My Courses | `/courses` | `src/pages/Courses.tsx` | Enrolled courses list |
| Course Detail | `/courses/:courseId` | `src/pages/CourseLanding.tsx` | Hero, curriculum accordion, enroll CTA |
| Assignment Submit | `/courses/:courseId/assignments/:assignmentId` | `src/pages/AssignmentSubmit.tsx` | Drag-drop file upload |
| Component Showcase | `/showcase` | `src/pages/Showcase.tsx` | Design system preview |

### Placements & Community

| Page | URL | File | Notes |
|------|-----|------|-------|
| Placements Hub | `/placements` | `src/pages/PlacementsHub.tsx` | Kanban + Grid view, application status |
| Company Detail | `/placements/:driveId` | `src/pages/CompanyDetail.tsx` | Drive info, selection rounds, apply CTA |
| Interview Prep | `/placements/prep` | `src/pages/InterviewPrep.tsx` | Schedule mock, join GD |
| Readiness Analytics | `/placements/analytics` | `src/pages/ReadinessAnalytics.tsx` | Radar chart, skill gaps |
| Community | `/community` | `src/pages/Community.tsx` | Post feed, compose, like/reply, tag filters |

### Exams & Live Features

| Page | URL | File | Notes |
|------|-----|------|-------|
| Exam List | `/exams` | `src/pages/Exams.tsx` | Scheduled, live, completed, missed tabs |
| Leaderboards | `/leaderboards` | `src/pages/Leaderboards.tsx` | Top performers, podium, My Rank card |
| Live Group Discussion | `/live-gd` | `src/pages/LiveGD.tsx` | Video tiles, raise hand, AI notes sidebar |

---

## 🖥️ Fullscreen Routes (Protected — no sidebar/navbar)

| Page | URL | File | Notes |
|------|-----|------|-------|
| Video Player | `/courses/:courseId/player` | `src/pages/VideoPlayer.tsx` | 70/30 split, tabs: overview/Q&A/notes |
| Video Player (lecture) | `/courses/:courseId/player/:lectureId` | `src/pages/VideoPlayer.tsx` | Same player, specific lecture |
| Exam Pre-flight | `/exams/:examId/pre-flight` | `src/pages/ExamPreFlight.tsx` | Webcam check, rules acknowledgment |
| Live Exam | `/exams/:examId` | `src/pages/ExamInterface.tsx` | Countdown, palette, anti-cheat, auto-submit |

---

## 🛠️ Admin Panel (Protected — inside DashboardLayout)

### General Management

| Page | URL | File | Notes |
|------|-----|------|-------|
| Admin Dashboard | `/admin/analytics` | `src/pages/admin/AdminDashboard.tsx` | KPI widgets, recharts radar chart |
| User Directory | `/admin/users` | `src/pages/admin/UserDirectory.tsx` | Sortable table, role badges, bulk actions |
| Batch Management | `/admin/batches` | `src/pages/admin/BatchManagement.tsx` | Cohort creation, course access windows |

### Creator Tools

| Page | URL | File | Notes |
|------|-----|------|-------|
| Course Builder | `/admin/courses/builder` | `src/pages/admin/CourseBuilder.tsx` | 3-step stepper: metadata → curriculum → media |
| Quiz Builder | `/admin/quizzes/builder` | `src/pages/admin/QuizBuilder.tsx` | MCQ authoring, answer key, explanations |

### Operations

| Page | URL | File | Notes |
|------|-----|------|-------|
| Placements Config | `/admin/placements` | `src/pages/admin/PlacementsConfig.tsx` | Drive configurator + live preview card |
| Exam Ops | `/admin/exams` | `src/pages/admin/ExamOps.tsx` | Live proctoring command center, incident log |

---

## 🌐 Global Components (Appear on every authenticated page)

| Component | Where | File |
|-----------|-------|------|
| AI Chatbot | Bottom-right floating button → slide-in sidebar | `src/components/ui/AIChatbot.tsx` |
| Notifications | Header bell icon → dropdown | `src/components/ui/GlobalNotifications.tsx` |

---

## 🗺️ Route Tree Summary

```
/login                              → Login (public)
/register                           → Signup (public)
/forgot-password                    → ForgotPassword (public)
/reset-password                     → ResetPassword (public)

/ (DashboardLayout, protected)
├── /                               → Dashboard
├── /discover                       → Course Catalog
├── /courses                        → My Courses
├── /courses/:courseId              → Course Landing
├── /courses/:courseId/assignments/:assignmentId → Assignment Submit
├── /placements                     → Placements Hub
├── /placements/prep                → Interview Prep
├── /placements/analytics           → Readiness Analytics
├── /placements/:driveId            → Company Detail
├── /community                      → Community Board
├── /exams                          → Exam List
├── /leaderboards                   → Leaderboards
├── /live-gd                        → Live Group Discussion
├── /showcase                       → UI Showcase
├── /admin/analytics                → Admin Dashboard (KPI)
├── /admin/users                    → User Directory
├── /admin/batches                  → Batch Management
├── /admin/placements               → Placements Config
├── /admin/exams                    → Exam Ops
├── /admin/courses/builder          → Course Builder
└── /admin/quizzes/builder          → Quiz Builder

(Fullscreen, no layout, protected)
├── /courses/:courseId/player           → Video Player
├── /courses/:courseId/player/:lectureId → Video Player (specific lecture)
├── /exams/:examId/pre-flight           → Exam Pre-flight
└── /exams/:examId                      → Live Exam Interface
```

---

## 📊 Stats

| Category | Count |
|----------|-------|
| Public pages | 4 |
| Student pages (in layout) | 14 |
| Fullscreen pages | 4 |
| Admin/Creator pages | 7 |
| Global components | 2 |
| **Total routes** | **29** |

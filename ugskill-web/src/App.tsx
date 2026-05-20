import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { Discover } from './pages/Discover';
import { Courses } from './pages/Courses';
import { Showcase } from './pages/Showcase';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { AdminLogin } from './pages/AdminLogin';
import { HRLogin } from './pages/HRLogin';
import { LandingPage } from './pages/LandingPage';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { CourseLanding } from './pages/CourseLanding';
const VideoPlayer = lazy(() => import('./pages/VideoPlayer').then(m => ({ default: m.VideoPlayer })));
import { AssignmentSubmit } from './pages/AssignmentSubmit';
import { PlacementsHub } from './pages/PlacementsHub';
import { CompanyDetail } from './pages/CompanyDetail';
import { Community } from './pages/Community';
import { PeerGroups } from './pages/PeerGroups';
import { Exams } from './pages/Exams';
import { ExamResults } from './pages/ExamResults';
const ExamInterface = lazy(() => import('./pages/ExamInterface').then(m => ({ default: m.ExamInterface })));
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { InterviewPrep } from './pages/InterviewPrep';
import { ReadinessAnalytics } from './pages/ReadinessAnalytics';
import { ExamPreFlight } from './pages/ExamPreFlight';
import { LiveGD } from './pages/LiveGD';
import { LiveInterview } from './pages/LiveInterview';
import InterviewRoom from './pages/InterviewRoom';
import { Leaderboards } from './pages/Leaderboards';
import { ResumeBuilder } from './pages/ResumeBuilder';
import { HRDashboard } from './pages/hr/HRDashboard';
import { Notifications } from './pages/Notifications';
import { Profile } from './pages/Profile';
import { CertificateViewer } from './pages/CertificateViewer';

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
import { UserDirectory } from './pages/admin/UserDirectory';
import { BatchManagement } from './pages/admin/BatchManagement';
import { Feedback } from './pages/Feedback';
const CourseBuilder = lazy(() => import('./pages/admin/CourseBuilder').then(m => ({ default: m.CourseBuilder })));
const QuizBuilder = lazy(() => import('./pages/admin/QuizBuilder').then(m => ({ default: m.QuizBuilder })));
import { AdminCourses } from './pages/admin/AdminCourses';
import { PlacementsConfig } from './pages/admin/PlacementsConfig';
import { ExamOps } from './pages/admin/ExamOps';
import { ProctoringReport } from './pages/admin/ProctoringReport';
import { DriveConfig } from './pages/admin/DriveConfig';
import { PlacementApplicants } from './pages/admin/PlacementApplicants';
import { ExamBuilder } from './pages/admin/ExamBuilder';
import { AdminExams } from './pages/admin/AdminExams';

const PageFallback = () => (
  <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width: 40, height: 40, border: '3px solid var(--surface-highest)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <Toaster position="top-right" toastOptions={{ style: { background: 'var(--surface-well)', color: 'var(--text-high)', border: '1px solid var(--surface-highest)' } }} />
      <BrowserRouter>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* ── Public Marketing Routes ─────────────────────────────── */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* ── Admin Portal ─────────────────────────────────────────── */}
            <Route path="/admin" element={<AdminLogin />} />

            {/* ── HR / Recruiter Portal ────────────────────────────────── */}
            <Route path="/hr" element={<HRLogin />} />
            <Route
              path="/hr/dashboard"
              element={
                <ProtectedRoute allowedRoles={['hr', 'admin']}>
                  <HRDashboard />
                </ProtectedRoute>
              }
            />

            {/* ── Student / App Routes ─────────────────────────────────── */}
            <Route path="/app" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="discover" element={<Discover />} />
              <Route path="showcase" element={<Showcase />} />
              <Route path="courses" element={<Courses />} />
              <Route path="courses/:courseId" element={<CourseLanding />} />
              <Route path="courses/:courseId/assignments/:assignmentId" element={<AssignmentSubmit />} />
              <Route path="placements" element={<PlacementsHub />} />
              <Route path="placements/prep" element={<InterviewPrep />} />
              <Route path="placements/analytics" element={<ReadinessAnalytics />} />
              <Route path="placements/resume-builder" element={<ResumeBuilder />} />
              <Route path="placements/interview/:sessionId" element={<InterviewRoom />} />
              <Route path="placements/gd/:sessionId" element={<LiveGD />} />
              <Route path="placements/live/:sessionId" element={<LiveInterview />} />
              <Route path="placements/:companyId" element={<CompanyDetail />} />
              <Route path="feedback" element={<Feedback />} />
              <Route path="community" element={<Community />} />
              <Route path="peer-groups" element={<PeerGroups />} />
              <Route path="exams" element={<Exams />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="profile" element={<Profile />} />
              <Route path="certificates/:id" element={<CertificateViewer />} />
              <Route path="live-gd" element={<LiveGD />} />
              <Route path="live-gd/:sessionId" element={<LiveGD />} />
              <Route path="leaderboards" element={<Leaderboards />} />

              {/* Admin Routes */}
              <Route path="admin" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'hr', 'creator', 'faculty']}><Outlet /></ProtectedRoute>}>
                <Route path="analytics" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminDashboard /></ProtectedRoute>} />
                <Route path="users" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><UserDirectory /></ProtectedRoute>} />
                <Route path="batches" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><BatchManagement /></ProtectedRoute>} />
                <Route path="placements" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'hr']}><PlacementsConfig /></ProtectedRoute>} />
                <Route path="placements/:driveId" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'hr']}><DriveConfig /></ProtectedRoute>} />
                <Route path="placements/:driveId/applicants" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><PlacementApplicants /></ProtectedRoute>} />
                <Route path="exams" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'creator']}><AdminExams /></ProtectedRoute>} />
                <Route path="exams/ops" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><ExamOps /></ProtectedRoute>} />
                <Route path="exams/builder" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'creator']}><ExamBuilder /></ProtectedRoute>} />
                <Route path="exams/:examId/builder" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'creator']}><ExamBuilder /></ProtectedRoute>} />
                <Route path="proctoring-report/:examId" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><ProctoringReport /></ProtectedRoute>} />
                <Route path="courses" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'creator']}><AdminCourses /></ProtectedRoute>} />
                <Route path="courses/builder" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'creator']}><CourseBuilder /></ProtectedRoute>} />
                <Route path="courses/:courseId/builder" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'creator']}><CourseBuilder /></ProtectedRoute>} />
                <Route path="quizzes/builder" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'creator']}><QuizBuilder /></ProtectedRoute>} />
              </Route>

              <Route path="*" element={<Navigate to="/app" replace />} />
            </Route>

            {/* ── Full-screen Routes (must be before the wildcard catch-all) ── */}
            <Route path="/app/courses/:courseId/player" element={<ProtectedRoute><VideoPlayer /></ProtectedRoute>} />
            <Route path="/app/courses/:courseId/player/:lectureId" element={<ProtectedRoute><VideoPlayer /></ProtectedRoute>} />
            <Route path="/app/exams/:examId/pre-flight" element={<ProtectedRoute><ExamPreFlight /></ProtectedRoute>} />
            <Route path="/app/exams/:examId" element={<ProtectedRoute><ExamInterface /></ProtectedRoute>} />
            <Route path="/app/exams/results/:attemptId" element={<ProtectedRoute><ExamResults /></ProtectedRoute>} />
            <Route path="/app/live-interview/:sessionId" element={<ProtectedRoute><LiveInterview /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

import { create } from 'zustand';
import api from '../lib/api';

export interface Course {
  id: string;
  title: string;
  progress: number;
  instructor: string;
  thumbnail?: string;
  lastAccessed: string;
  lecturesCompleted?: number;
  totalLectures?: number;
}

export interface Activity {
  id: string;
  type: 'assessment' | 'course' | 'community' | 'system';
  title: string;
  timestamp: string;
  description: string;
}

export interface Assessment {
  id: string;
  title: string;
  closingDate: string;
  courseId: string;
  status: 'pending' | 'submitted' | 'graded';
}

export interface LeaderEntry {
  studentId: string;
  name: string;
  score: number;
  rank?: number;
}

interface DashboardState {
  courses: Course[];
  activities: Activity[];
  assessments: Assessment[];
  topLeaders: LeaderEntry[];
  examCount: number;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchDashboardData: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  courses: [],
  activities: [],
  assessments: [],
  topLeaders: [],
  examCount: 0,
  isLoading: false,
  error: null,

  fetchDashboardData: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Fetch enrollments, exams, and leaderboard in parallel
      const [enrollmentsRes, examsRes, leaderRes] = await Promise.allSettled([
        api.get('/lms/enrollments/mine?limit=6'),
        api.get('/exams'),
        api.get('/leaderboards?scope=global&limit=3'),
      ]);

      // ── Courses ─────────────────────────────────────────────
      const enrollments = enrollmentsRes.status === 'fulfilled'
        ? (enrollmentsRes.value.data.data ?? enrollmentsRes.value.data ?? [])
        : [];

      const courseEnrollments = (Array.isArray(enrollments) ? enrollments : [])
        .filter((enrollment: any) => enrollment.enrollableType === 'course');

      const courseResults = await Promise.allSettled(
        courseEnrollments.map(async (enrollment: any) => {
          const courseId = enrollment.enrollableId;
          const [courseRes, progressRes] = await Promise.allSettled([
            api.get(`/lms/courses/${courseId}`),
            api.get(`/lms/courses/${courseId}/progress`),
          ]);

          if (courseRes.status === 'rejected') return null;

          const course = courseRes.value.data.data ?? courseRes.value.data;
          const progressPayload = progressRes.status === 'fulfilled'
            ? progressRes.value.data.data ?? progressRes.value.data ?? {}
            : {};

          return {
            id: course._id ?? course.id ?? courseId,
            title: course.title ?? 'Untitled Course',
            progress: progressPayload.progressPercent ?? 0,
            lecturesCompleted: progressPayload.lecturesCompleted ?? 0,
            totalLectures: progressPayload.totalLectures ?? 0,
            instructor: typeof course.instructor === 'string'
              ? course.instructor
              : course.instructor?.fullName ?? 'UGSkill Faculty',
            thumbnail: course.thumbnail_url ?? course.thumbnailUrl,
            lastAccessed: progressPayload.lastAccessedAt ?? enrollment.updatedAt ?? enrollment.enrolledAt ?? new Date().toISOString(),
          };
        })
      );

      const courses = courseResults
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value !== null)
        .map(r => r.value);

      // ── Exams → Assessments ──────────────────────────────────
      let assessments: Assessment[] = [];
      let examCount = 0;
      if (examsRes.status === 'fulfilled') {
        const rawExams = examsRes.value.data.data?.exams ?? examsRes.value.data.data ?? examsRes.value.data ?? [];
        const examsArr = Array.isArray(rawExams) ? rawExams : [];
        examCount = examsArr.length;
        assessments = examsArr
          .filter((e: any) => e.status === 'upcoming' || e.status === 'live')
          .slice(0, 5)
          .map((e: any) => ({
            id: e.id ?? e._id,
            title: e.title,
            closingDate: e.scheduledAt,
            courseId: e.courseId ?? '',
            status: 'pending' as const,
          }));
      }

      // ── Leaderboard ──────────────────────────────────────────
      let topLeaders: LeaderEntry[] = [];
      if (leaderRes.status === 'fulfilled') {
        const rawLeaders = leaderRes.value.data.data ?? leaderRes.value.data ?? [];
        const leadersArr = Array.isArray(rawLeaders) ? rawLeaders : [];
        topLeaders = leadersArr.slice(0, 3).map((l: any, i: number) => ({
          studentId: l.studentId,
          name: l.name ?? 'Anonymous',
          score: l.score ?? l.totalScore ?? l.percentage ?? 0,
          rank: i + 1,
        }));
      }

      set({
        courses,
        assessments,
        activities: [],
        topLeaders,
        examCount,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({ 
        courses: [],
        assessments: [],
        activities: [],
        topLeaders: [],
        examCount: 0,
        isLoading: false,
        error: null,
      });
    }
  }
}));

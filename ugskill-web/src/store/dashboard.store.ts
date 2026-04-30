import { create } from 'zustand';
import api from '../lib/api';

export interface Course {
  id: string;
  title: string;
  progress: number;
  instructor: string;
  thumbnail?: string;
  lastAccessed: string;
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

interface DashboardState {
  courses: Course[];
  activities: Activity[];
  assessments: Assessment[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchDashboardData: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  courses: [],
  activities: [],
  assessments: [],
  isLoading: false,
  error: null,

  fetchDashboardData: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Fetch enrollments — the only confirmed endpoint
      const enrollmentsRes = await api.get('/lms/enrollments/mine?limit=5');
      const enrollments = enrollmentsRes.data.data ?? enrollmentsRes.data ?? [];
      const courseEnrollments = (Array.isArray(enrollments) ? enrollments : [])
        .filter((enrollment: any) => enrollment.enrollableType === 'course');

      const courses = await Promise.all(courseEnrollments.map(async (enrollment: any) => {
        const courseId = enrollment.enrollableId;
        const [courseRes, progressRes] = await Promise.allSettled([
          api.get(`/lms/courses/${courseId}`),
          api.get(`/progress/summary/${courseId}`),
        ]);

        const course = courseRes.status === 'fulfilled'
          ? courseRes.value.data.data ?? courseRes.value.data
          : {};
        const progressPayload = progressRes.status === 'fulfilled'
          ? progressRes.value.data.data ?? progressRes.value.data.meta ?? {}
          : {};

        return {
          id: course._id ?? course.id ?? courseId,
          title: course.title ?? 'Untitled Course',
          progress: progressPayload.progressPercent ?? course.progress ?? 0,
          instructor: typeof course.instructor === 'string'
            ? course.instructor
            : course.instructor?.fullName ?? 'UGSkill Faculty',
          thumbnail: course.thumbnail_url ?? course.thumbnailUrl,
          lastAccessed: progressPayload.lastAccessedAt ?? enrollment.updatedAt ?? enrollment.enrolledAt ?? new Date().toISOString(),
        };
      }));

      set({
        courses,
        assessments: [], // populated when assignment list endpoint is added
        activities: [],  // populated when activity feed endpoint is added
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      // Don't block the dashboard — just show empty state
      set({ 
        courses: [],
        assessments: [],
        activities: [],
        isLoading: false,
        error: null, // silently fail so the UI renders
      });
    }
  }
}));

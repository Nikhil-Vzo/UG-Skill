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
      const enrollmentsRes = await api.get('/enrollments/my-enrollments?limit=5');
      const courses = enrollmentsRes.data.data || enrollmentsRes.data || [];

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


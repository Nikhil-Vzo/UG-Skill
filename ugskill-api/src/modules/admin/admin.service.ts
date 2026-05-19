import { db } from '../../config/postgres';
import { users, batches } from '../../db/pg/schema/core';
import { courseCatalog } from '../../db/pg/schema/lms';
import { exams } from '../../db/pg/schema/exam';
import { companyDrives } from '../../db/pg/schema/placement';
import { eq, sql } from 'drizzle-orm';

export const adminService = {
  getStats: async () => {
    try {
      const [totalStudents] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(sql`'student' = ANY(${users.roles})`);

      const [activeCourses] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(courseCatalog)
        .where(eq(courseCatalog.status, 'published'));

      const [upcomingExams] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(exams)
        .where(eq(exams.status, 'published'));

      const [ongoingPlacements] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(companyDrives)
        .where(eq(companyDrives.status, 'active'));

      // Mock revenue and recent activity since there's no payment/activity schema yet
      return {
        totalStudents: totalStudents?.count || 0,
        activeCourses: activeCourses?.count || 0,
        upcomingExams: upcomingExams?.count || 0,
        ongoingPlacements: ongoingPlacements?.count || 0,
        revenueData: [
          { month: 'Jan', revenue: 45000 },
          { month: 'Feb', revenue: 52000 },
          { month: 'Mar', revenue: 48000 },
          { month: 'Apr', revenue: 61000 },
        ],
        recentActivity: [
          { id: 1, action: 'New User Registered', time: '5 mins ago' },
          { id: 2, action: 'Course "React Mastery" updated', time: '2 hours ago' },
          { id: 3, action: 'TCS Placement Drive created', time: '1 day ago' },
        ],
      };
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      throw error;
    }
  },
};

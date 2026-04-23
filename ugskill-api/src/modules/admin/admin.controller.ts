import { Request, Response } from 'express';

export const adminController = {
  getStats: async (req: Request, res: Response) => {
    try {
      // Mock stats for the dashboard to prevent 404 errors during development
      const stats = {
        totalStudents: 12450,
        activeCourses: 32,
        ongoingPlacements: 14,
        upcomingExams: 3,
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
        ]
      };

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Admin stats error:', error);
      res.status(500).json({ success: false, message: 'Server error retrieving stats' });
    }
  }
};

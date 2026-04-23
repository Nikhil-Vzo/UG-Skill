import EventEmitter from 'events';

// Create a globally accessible Event Emitter
class AppEmitter extends EventEmitter {}

export const events = new AppEmitter();

// Centralized Event Name Constants
export const APP_EVENTS = {
  // Course/Catalog CDC Events
  COURSE_CREATED: 'course.created',
  COURSE_UPDATED: 'course.updated',
  COURSE_DELETED: 'course.deleted',
  ROADMAP_CREATED: 'roadmap.created',
  ROADMAP_UPDATED: 'roadmap.updated',
  
  // Placement/Jobs Events
  JOB_POSTED: 'job.posted',
  
  // Assessment Events
  EXAM_SUBMITTED: 'exam.submitted',
  QUIZ_COMPLETED: 'quiz.completed',

  // Auth/User Events
  USER_REGISTERED: 'user.registered',
  USER_UPDATED: 'user.updated',

  // Activity/Progress CDC Events
  ACTIVITY_COMPLETED: 'activity.completed',

  // Scoring CDC Events
  MOCK_SCORED: 'mock.scored',
  GD_SCORED: 'gd.scored',
} as const;

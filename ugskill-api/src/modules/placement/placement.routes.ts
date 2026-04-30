import { Router } from 'express';
import * as placementController from './placement.controller';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { 
  createCompanySchema, 
  updateCompanySchema, 
  companyQuerySchema, 
  createDriveSchema, 
  driveQuerySchema,
  registerForDriveSchema,
  updateRegistrationSchema,
  registrationQuerySchema,
  createQuestionSchema,
  updateQuestionSchema,
  questionQuerySchema,
  createInterviewFlowSchema,
  updateInterviewFlowSchema,
  interviewFlowQuerySchema,
  createPlacementSessionSchema,
  updatePlacementSessionStatusSchema,
  placementSessionQuerySchema,
  createMockAttemptSchema,
  updateMockAttemptSchema,
  mockAttemptQuerySchema,
  createGDSessionSchema,
  updateGDSessionSchema,
  gdSessionQuerySchema,
  addGDParticipantSchema,
  updateGDParticipantSchema,
  createLiveInterviewSlotSchema,
  updateLiveInterviewSlotSchema,
  liveSlotQuerySchema,
  bookLiveInterviewSchema,
  updateBookingStatusSchema,
  createPeerGroupSchema,
  updatePeerGroupSchema,
  peerGroupQuerySchema,
  addPeerGroupMemberSchema,
  createPeerSessionSchema,
  updatePeerSessionSchema,
  readinessScoreQuerySchema,
  ingestProctoringEventSchema,
  proctoringEventQuerySchema
} from './placement.schemas';

const router = Router();

// --- COMPANIES ---

router.post(
  '/companies',
  requireAuth,
  requireRole(['admin', 'creator']),
  validate(createCompanySchema),
  placementController.createCompany
);

router.get(
  '/companies',
  requireAuth,
  validate(companyQuerySchema),
  placementController.listCompanies
);

router.get(
  '/companies/:id',
  requireAuth,
  placementController.getCompany
);

router.patch(
  '/companies/:id',
  requireAuth,
  requireRole(['admin', 'creator']),
  validate(updateCompanySchema),
  placementController.updateCompany
);

// --- DRIVES ---

router.post(
  '/drives',
  requireAuth,
  requireRole(['admin', 'creator', 'hr']),
  validate(createDriveSchema),
  placementController.createDrive
);

router.get(
  '/drives',
  requireAuth,
  validate(driveQuerySchema),
  placementController.listDrives
);

router.get(
  '/drives/:id',
  requireAuth,
  placementController.getDrive
);

// --- DRIVE REGISTRATIONS ---
router.post(
  '/drives/:id/apply',
  requireAuth,
  requireRole(['student']),
  placementController.registerForDrive
);

router.post(
  '/registrations',
  requireAuth,
  requireRole(['student']),
  validate(registerForDriveSchema),
  placementController.registerForDrive
);

router.get(
  '/registrations',
  requireAuth,
  requireRole(['admin', 'creator', 'hr', 'student']),
  validate(registrationQuerySchema),
  placementController.listRegistrations
);

router.get(
  '/registrations/:id',
  requireAuth,
  requireRole(['admin', 'creator', 'student']),
  placementController.getRegistration
);

router.patch(
  '/registrations/:id',
  requireAuth,
  requireRole(['admin', 'creator', 'hr']),
  validate(updateRegistrationSchema),
  placementController.updateRegistrationStatus
);

// --- QUESTION BANK ---

router.post(
  '/questions',
  requireAuth,
  requireRole(['admin', 'creator']),
  validate(createQuestionSchema),
  placementController.createQuestion
);

router.get(
  '/questions',
  requireAuth,
  requireRole(['admin', 'creator', 'student']),
  validate(questionQuerySchema),
  placementController.listQuestions
);

router.get(
  '/questions/:id',
  requireAuth,
  requireRole(['admin', 'creator', 'student']),
  placementController.getQuestion
);

router.patch(
  '/questions/:id',
  requireAuth,
  requireRole(['admin', 'creator']),
  validate(updateQuestionSchema),
  placementController.updateQuestion
);

router.delete(
  '/questions/:id',
  requireAuth,
  requireRole(['admin', 'creator']),
  placementController.deleteQuestion
);

// --- INTERVIEW FLOWS (5.5) ---

router.post(
  '/flows',
  requireAuth,
  requireRole(['admin']),
  validate(createInterviewFlowSchema),
  placementController.createInterviewFlow
);

router.get(
  '/flows',
  requireAuth,
  validate(interviewFlowQuerySchema),
  placementController.listInterviewFlows
);

router.get(
  '/flows/:id',
  requireAuth,
  placementController.getInterviewFlow
);

router.patch(
  '/flows/:id',
  requireAuth,
  requireRole(['admin']),
  validate(updateInterviewFlowSchema),
  placementController.updateInterviewFlow
);

router.delete(
  '/flows/:id',
  requireAuth,
  requireRole(['admin']),
  placementController.deleteInterviewFlow
);

// --- PLACEMENT SESSIONS (5.6) ---

router.post(
  '/sessions',
  requireAuth,
  requireRole(['admin', 'placement_coordinator', 'hr']),
  validate(createPlacementSessionSchema),
  placementController.createPlacementSession
);

router.get(
  '/sessions',
  requireAuth,
  validate(placementSessionQuerySchema),
  placementController.listPlacementSessions
);

router.post(
  '/sessions/mock',
  requireAuth,
  requireRole(['student', 'admin']),
  placementController.scheduleMockSession
);

router.get(
  '/sessions/:id',
  requireAuth,
  placementController.getPlacementSession
);

router.post(
  '/sessions/:id/end',
  requireAuth,
  placementController.endPlacementSession
);

router.patch(
  '/sessions/:id/status',
  requireAuth,
  requireRole(['admin', 'placement_coordinator', 'hr', 'student']),
  validate(updatePlacementSessionStatusSchema),
  placementController.updatePlacementSessionStatus
);

// ==========================================
// 5.7 - MOCK INTERVIEW ATTEMPTS
// ==========================================

router.post(
  '/mock-attempts',
  requireAuth,
  validate(createMockAttemptSchema),
  placementController.createMockAttempt
);

router.patch(
  '/mock-attempts/:id',
  requireAuth,
  validate(updateMockAttemptSchema),
  placementController.updateMockAttempt
);

router.get(
  '/mock-attempts/:id',
  requireAuth,
  placementController.getMockAttempt
);

router.get(
  '/mock-attempts',
  requireAuth,
  validate(mockAttemptQuerySchema),
  placementController.listMockAttempts
);

// ==========================================
// 5.8 - GROUP DISCUSSION (GD) SESSIONS
// ==========================================

router.post(
  '/gd-sessions',
  requireAuth,
  requireRole(['admin', 'placement_coordinator', 'expert']),
  validate(createGDSessionSchema),
  placementController.createGDSession
);

router.patch(
  '/gd-sessions/:id',
  requireAuth,
  requireRole(['admin', 'placement_coordinator', 'expert']),
  validate(updateGDSessionSchema),
  placementController.updateGDSession
);

router.get(
  '/gd-sessions/:id',
  requireAuth,
  placementController.getGDSession
);

router.post(
  '/gd-sessions/:id/leave',
  requireAuth,
  placementController.leaveGDSession
);

router.get(
  '/gd-sessions',
  requireAuth,
  validate(gdSessionQuerySchema),
  placementController.listGDSessions
);

// GD Participants actions
router.post(
  '/gd-sessions/:sessionId/participants',
  requireAuth,
  requireRole(['admin', 'placement_coordinator', 'expert']),
  validate(addGDParticipantSchema),
  placementController.addGDParticipant
);

router.patch(
  '/gd-participants/:participantId',
  requireAuth,
  requireRole(['admin', 'placement_coordinator', 'expert']),
  validate(updateGDParticipantSchema),
  placementController.updateGDParticipant
);

router.delete(
  '/gd-participants/:participantId',
  requireAuth,
  requireRole(['admin', 'placement_coordinator']),
  placementController.removeGDParticipant
);

// ==========================================
// 5.9 - LIVE INTERVIEW SLOTS / BOOKINGS
// ==========================================

router.post(
  '/live-slots',
  requireAuth,
  requireRole(['admin', 'placement_coordinator']),
  validate(createLiveInterviewSlotSchema),
  placementController.createLiveSlot
);

router.patch(
  '/live-slots/:id',
  requireAuth,
  requireRole(['admin', 'placement_coordinator']),
  validate(updateLiveInterviewSlotSchema),
  placementController.updateLiveSlot
);

router.get(
  '/live-slots/:id',
  requireAuth,
  placementController.getLiveSlot
);

router.get(
  '/live-slots',
  requireAuth,
  validate(liveSlotQuerySchema),
  placementController.listLiveSlots
);

router.post(
  '/live-bookings',
  requireAuth,
  requireRole(['student']),
  validate(bookLiveInterviewSchema),
  placementController.bookLiveInterview
);

router.patch(
  '/live-bookings/:id',
  requireAuth,
  requireRole(['admin', 'placement_coordinator', 'expert']),
  validate(updateBookingStatusSchema),
  placementController.updateBookingStatus
);

// ==========================================
// 5.10 - PEER GROUPS
// ==========================================

router.post(
  '/peer-groups',
  requireAuth,
  validate(createPeerGroupSchema),
  placementController.createPeerGroup
);

router.patch(
  '/peer-groups/:id',
  requireAuth,
  validate(updatePeerGroupSchema),
  placementController.updatePeerGroup
);

router.get(
  '/peer-groups/:id',
  requireAuth,
  placementController.getPeerGroup
);

router.get(
  '/peer-groups',
  requireAuth,
  validate(peerGroupQuerySchema),
  placementController.listPeerGroups
);

router.post(
  '/peer-groups/:groupId/members',
  requireAuth,
  validate(addPeerGroupMemberSchema),
  placementController.addPeerGroupMember
);

router.post(
  '/peer-sessions',
  requireAuth,
  validate(createPeerSessionSchema),
  placementController.createPeerSession
);

router.patch(
  '/peer-sessions/:id',
  requireAuth,
  validate(updatePeerSessionSchema),
  placementController.updatePeerSession
);

// ==========================================
// 5.11 - READINESS SCORES
// ==========================================

router.post(
  '/readiness-scores/compute',
  requireAuth,
  placementController.computeReadinessScore
);

router.get(
  '/readiness-scores',
  requireAuth,
  validate(readinessScoreQuerySchema),
  placementController.listReadinessScores
);

// Frontend-friendly alias: GET /placements/readiness/me
router.get(
  '/readiness/me',
  requireAuth,
  placementController.getMyReadiness
);

// AI-generated insights for current student
router.get(
  '/readiness/me/insights',
  requireAuth,
  placementController.getMyReadinessInsights
);

// ==========================================
// 5.12 - PROCTORING EVENTS
// ==========================================

router.post(
  '/proctoring-events',
  requireAuth,
  validate(ingestProctoringEventSchema),
  placementController.ingestProctoringEvent
);

router.get(
  '/proctoring-events',
  requireAuth,
  validate(proctoringEventQuerySchema),
  placementController.listProctoringEvents
);

export default router;

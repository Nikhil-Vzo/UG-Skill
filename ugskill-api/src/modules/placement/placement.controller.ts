import { Request, Response, NextFunction } from 'express';
import * as placementService from './placement.service';
import { successResponse } from '../../lib/response';
import { logAction } from '../audit/audit.service';

export const createCompany = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Note: Assuming `req.user` is populated by auth middleware
    const result = await placementService.createCompany(req.body, req.user!.userId);
    res.status(201).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const updateCompany = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.updateCompany(req.params.id as string, req.body);
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const getCompany = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.getCompany(req.params.id as string);
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const listCompanies = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.listCompanies(req.query as any);
    res.status(200).json(successResponse(result.data, result.meta));
  } catch (error) {
    next(error);
  }
};

export const createDrive = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.createDrive(req.body, req.user!.userId);
    await logAction({
      actorId: req.user!.userId,
      action: 'PLACEMENT_DRIVE_CREATED',
      entityType: 'placement_drive',
      entityId: result.id,
      newValue: req.body,
      ipAddress: req.ip,
    });
    res.status(201).json(successResponse(result));
  } catch (error: any) {
    console.error('Create Drive Error:', error);
    next(error);
  }
};

export const getDrive = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.roles.includes('student') ? req.user.userId : undefined;
    const result = await placementService.getDrive(req.params.id as string, userId);
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const listDrives = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = { ...req.query };
    if (req.user?.roles.includes('student')) query.userId = req.user.userId;
    const result = await placementService.listDrives(query as any);
    console.log('List drives result:', result.data.length, 'drives found');
    res.status(200).json(successResponse(result.data, result.meta));
  } catch (error) {
    next(error);
  }
};

export const deleteDrive = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await placementService.deleteDrive(req.params.id as string, req.user!.userId, req.user!.roles);
    await logAction({
      actorId: req.user!.userId,
      action: 'PLACEMENT_DRIVE_DELETED',
      entityType: 'placement_drive',
      entityId: req.params.id as string,
      newValue: { id: req.params.id },
      ipAddress: req.ip,
    });
    res.status(200).json(successResponse({ message: 'Placement drive deleted successfully' }));
  } catch (error) {
    next(error);
  }
};

export const registerForDrive = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Registering for drive:', { params: req.params, body: req.body, user: req.user?.userId });
    const payload = { ...req.body };
    if (req.params.id) payload.driveId = req.params.id;
    const result = await placementService.registerForDrive(req.user!.userId, payload);
    await logAction({
      actorId: req.user!.userId,
      action: 'PLACEMENT_DRIVE_REGISTERED',
      entityType: 'placement_drive',
      entityId: result.id || payload.driveId,
      newValue: payload,
      ipAddress: req.ip,
    });
    res.status(201).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const updateRegistrationStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Updating registration status:', { id: req.params.id, body: req.body });
    const result = await placementService.updateRegistrationStatus(req.params.id as string, req.body);
    await logAction({
      actorId: req.user!.userId,
      action: 'PLACEMENT_REGISTRATION_STATUS_UPDATED',
      entityType: 'placement_registration',
      entityId: req.params.id as string,
      newValue: req.body,
      ipAddress: req.ip,
    });
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const getRegistration = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.getRegistration(req.params.id as string);
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const listRegistrations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = { ...req.query } as Record<string, any>;
    // BUG-001: Scope registrations for students — they may only see their own records.
    // Admins, HR, and creators retain unrestricted access.
    const isPrivileged = req.user?.roles.some((r) => ['admin', 'hr', 'creator'].includes(r));
    if (!isPrivileged) {
      query.studentId = req.user!.userId;
    }
    const result = await placementService.listRegistrations(query as any);
    res.status(200).json(successResponse(result.data, result.meta));
  } catch (error) {
    next(error);
  }
};

export const createQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.createQuestion(req.body, req.user!.userId);
    res.status(201).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const updateQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.updateQuestion(req.params.id as string, req.body);
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const getQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.getQuestion(req.params.id as string);
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const listQuestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.listQuestions(req.query as any);
    res.status(200).json(successResponse(result.data, result.meta));
  } catch (error) {
    next(error);
  }
};

export const deleteQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.deleteQuestion(req.params.id as string);
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

// --- INTERVIEW FLOWS (5.5) ---

export const createInterviewFlow = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.createInterviewFlow(req.body);
    res.status(201).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const updateInterviewFlow = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.updateInterviewFlow(req.params.id as string, req.body);
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const getInterviewFlow = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.getInterviewFlow(req.params.id as string);
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const listInterviewFlows = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.listInterviewFlows(req.query);
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const deleteInterviewFlow = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.deleteInterviewFlow(req.params.id as string);
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

// --- PLACEMENT SESSIONS (5.6) ---

export const createPlacementSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.createPlacementSession(req.body);
    res.status(201).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const updatePlacementSessionStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isStudent = req.user?.roles?.includes('student');
    const isPrivileged = req.user?.roles?.some(role =>
      ['admin', 'super_admin', 'placement_coordinator', 'hr'].includes(role)
    );

    // Students can only join (in_progress) — they cannot complete, pass, fail, or cancel
    if (isStudent && !isPrivileged && req.body.status && req.body.status !== 'in_progress') {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Students may only join a session (in_progress). Ending or cancelling requires HR/admin.',
        },
      });
      return;
    }

    const result = await placementService.updatePlacementSessionStatus(req.params.id as string, req.body);
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const getPlacementSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.getPlacementSession(req.params.id as string);
    const isStudent = req.user?.roles?.includes('student');
    const isPrivileged = req.user?.roles?.some(role => ['admin', 'super_admin', 'placement_coordinator', 'hr'].includes(role));

    if (isStudent && !isPrivileged && result.studentId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You cannot access another candidate interview session',
        },
      });
      return;
    }

    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const listPlacementSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = { ...req.query };
    const isStudent = req.user?.roles?.includes('student');
    const isPrivileged = req.user?.roles?.some(role => ['admin', 'super_admin', 'placement_coordinator', 'hr'].includes(role));

    if (query.studentId === 'me') query.studentId = req.user?.userId;
    if (isStudent && !isPrivileged) query.studentId = req.user?.userId;
    if (query.type === 'upcoming') query.status = 'scheduled';
    delete query.type;

    const result = await placementService.listPlacementSessions(query);
    res.status(200).json(successResponse(result.data, result.meta));
  } catch (error) {
    next(error);
  }
};

export const scheduleMockSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.scheduleMockSession(req.user!.userId);
    res.status(201).json(successResponse(result, { message: 'Mock interview scheduled' }));
  } catch (error) {
    next(error);
  }
};

export const endPlacementSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.updatePlacementSessionStatus(req.params.id as string, {
      status: 'completed',
      endedAt: new Date().toISOString(),
    });
    res.status(200).json(successResponse(result, { message: 'Placement session ended' }));
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 5.7 - MOCK INTERVIEW ATTEMPTS
// ==========================================

export const createMockAttempt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.createMockAttempt({
      ...req.body,
      pg_student_id: req.user?.userId || req.body.pg_student_id, // Default to logged in user if not provided
    });
    res.status(201).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const updateMockAttempt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.updateMockAttempt(req.params.id as string, req.body);
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const getMockAttempt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.getMockAttempt(req.params.id as string);
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const listMockAttempts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const queryParams = { ...req.query };
    // If not an admin, restrict query to their own mock attempts
    if (req.user && !req.user.roles.includes('admin')) {
      queryParams.pg_student_id = req.user.userId;
    }
    
    const result = await placementService.listMockAttempts(queryParams);
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 5.8 - GROUP DISCUSSION (GD) SESSIONS
// ==========================================

export const createGDSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.createGDSession(req.body, req.user?.userId as string);
    res.status(201).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const updateGDSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.updateGDSession(req.params.id as string, req.body);
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const getGDSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.getGDSession(req.params.id as string);
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const listGDSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.listGDSessions(req.query);
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const leaveGDSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.leaveGDSession(req.params.id as string, req.user!.userId);
    res.status(200).json(successResponse(result, { message: 'Left GD session' }));
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GD PARTICIPANTS
// ==========================================

export const addGDParticipant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.addGDParticipant(req.params.sessionId as string, req.body);
    res.status(201).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const updateGDParticipant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.updateGDParticipant(req.params.participantId as string, req.body);
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const removeGDParticipant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await placementService.removeGDParticipant(req.params.participantId as string);
    res.status(200).json(successResponse({ message: 'Participant removed successfully' }));
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 5.9 - LIVE INTERVIEW SLOTS / BOOKINGS
// ==========================================

export const createLiveSlot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.createLiveSlot(req.body);
    res.status(201).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const updateLiveSlot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.updateLiveSlot(req.params.id as string, req.body);
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const getLiveSlot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.getLiveSlot(req.params.id as string);
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const listLiveSlots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.listLiveSlots(req.query);
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const bookLiveInterview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.bookLiveInterview(req.body, req.user?.userId as string);
    res.status(201).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const updateBookingStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.updateBookingStatus(req.params.id as string, req.body);
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 5.10 - PEER GROUPS
// ==========================================

export const createPeerGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.createPeerGroup(req.body, req.user?.userId as string);
    res.status(201).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const updatePeerGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.updatePeerGroup(req.params.id as string, req.body);
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const getPeerGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.getPeerGroup(req.params.id as string);
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const listPeerGroups = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.listPeerGroups(req.query);
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const addPeerGroupMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.addPeerGroupMember(req.params.groupId as string, req.body);
    res.status(201).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const createPeerSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.createPeerSession(req.body, req.user?.userId as string);
    res.status(201).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const updatePeerSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.updatePeerSession(req.params.id as string, req.body);
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 5.11 - READINESS SCORES
// ==========================================

export const computeReadinessScore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = req.user?.userId as string; // or passed via body
    const { companyId } = req.body;
    const result = await placementService.computeReadinessScore(studentId, companyId);
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const listReadinessScores = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const queryParams = { ...req.query };
    // If not an admin, restrict query to their own scores
    if (req.user && !req.user.roles.includes('admin')) {
      queryParams.studentId = req.user.userId;
    }
    const result = await placementService.listReadinessScores(queryParams);
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 5.12 - PROCTORING EVENTS
// ==========================================

export const ingestProctoringEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = req.user?.userId as string;
    const result = await placementService.ingestProctoringEvent(req.body, studentId);
    res.status(201).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const listProctoringEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const queryParams = { ...req.query };
    // If not an admin, restrict query to their own events
    if (req.user && !req.user.roles.includes('admin')) {
      queryParams.studentId = req.user.userId;
    }
    const result = await placementService.listProctoringEvents(queryParams);
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

// ==========================================
// READINESS /me  (frontend alias)
// ==========================================

/** GET /api/v1/placements/readiness/me — returns student readiness as radar-chart skills array */
export const getMyReadiness = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = req.user!.userId;
    const result = await placementService.listReadinessScores({ studentId, limit: 1 });

    const score = result.data?.[0] || null;

    // Transform to radar-chart format the frontend expects
    const skills = score?.components
      ? Object.entries(score.components as Record<string, number>).map(([skill, value]) => ({
          skill,
          score: value,
        }))
      : [
          { skill: 'DSA', score: 0 },
          { skill: 'Mock Interview', score: 0 },
          { skill: 'Group Discussion', score: 0 },
          { skill: 'Aptitude', score: 0 },
        ];

    res.json(
      successResponse({
        studentId,
        overallScore: score ? Number(score.overallScore) : 0,
        skills,
        lastUpdated: score?.computedAt || null,
      })
    );
  } catch (error) {
    next(error);
  }
};

/** GET /api/v1/placements/readiness/me/insights — AI-generated coaching insights */
export const getMyReadinessInsights = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = req.user!.userId;
    const result = await placementService.listReadinessScores({ studentId, limit: 1 });
    const score = result.data?.[0] || null;
    const components = (score?.components as Record<string, number>) || {};

    // Determine weakest area
    const sorted = Object.entries(components).sort(([, a], [, b]) => a - b);
    const weakest = sorted[0]?.[0] || 'Mock Interview';
    const strongest = sorted[sorted.length - 1]?.[0] || 'DSA';
    const overall = score ? Number(score.overallScore) : 0;

    const insights = [
      {
        type: 'strength',
        area: strongest,
        message: `You're performing well in ${strongest}. Keep it up!`,
      },
      {
        type: 'improvement',
        area: weakest,
        message: `Focus on improving your ${weakest} skills — this is your biggest opportunity.`,
      },
      {
        type: 'recommendation',
        area: 'Next Steps',
        message:
          overall < 50
            ? 'Schedule a mock interview session to get feedback on your weak areas.'
            : overall < 75
            ? 'You are on track. Push harder on problem-solving and communication.'
            : 'Excellent readiness! Apply to top drives and keep practicing consistently.',
      },
    ];

    res.json(successResponse({ studentId, overallScore: overall, insights }));
  } catch (error) {
    next(error);
  }
};

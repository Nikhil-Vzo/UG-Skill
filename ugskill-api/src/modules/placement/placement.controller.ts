import { Request, Response, NextFunction } from 'express';
import * as placementService from './placement.service';
import { successResponse } from '../../lib/response';

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

export const registerForDrive = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Registering for drive:', { params: req.params, body: req.body, user: req.user?.userId });
    const payload = { ...req.body };
    if (req.params.id) payload.driveId = req.params.id;
    const result = await placementService.registerForDrive(req.user!.userId, payload);
    res.status(201).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const updateRegistrationStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Updating registration status:', { id: req.params.id, body: req.body });
    const result = await placementService.updateRegistrationStatus(req.params.id as string, req.body);
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
    const result = await placementService.listRegistrations(req.query as any);
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
    const result = await placementService.updatePlacementSessionStatus(req.params.id as string, req.body);
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const getPlacementSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await placementService.getPlacementSession(req.params.id as string);
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const listPlacementSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = { ...req.query };
    if (query.studentId === 'me') query.studentId = req.user?.userId;
    if (query.type === 'upcoming') query.status = 'scheduled';
    delete query.type;

    const result = await placementService.listPlacementSessions(query);
    res.status(200).json(successResponse(result));
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

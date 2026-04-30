import * as placementRepo from './placement.repository';
import { 
  CreateCompanyInput, UpdateCompanyInput, CompanyQuery, 
  CreateDriveInput, UpdateDriveInput, DriveQuery, 
  RegistrationQuery, RegisterForDriveInput, UpdateRegistrationInput, 
  CreateQuestionInput, UpdateQuestionInput, QuestionQuery,
  CreateInterviewFlowInput, UpdateInterviewFlowInput, InterviewFlowQuery,
  CreatePlacementSessionInput, UpdatePlacementSessionStatusInput, PlacementSessionQuery,
  CreateMockAttemptInput, UpdateMockAttemptInput, MockAttemptQuery,
  CreateGDSessionInput, UpdateGDSessionInput, GDSessionQuery,
  AddGDParticipantInput, UpdateGDParticipantInput,
  CreateLiveSlotInput, UpdateLiveSlotInput, LiveSlotQuery, BookLiveInterviewInput, UpdateBookingStatusInput,
  CreatePeerGroupInput, UpdatePeerGroupInput, PeerGroupQuery, AddPeerGroupMemberInput,
  CreatePeerSessionInput, UpdatePeerSessionInput, ReadinessScoreQuery,
  IngestProctoringEventInput, ProctoringEventQuery
} from './placement.schemas';
import { NotFoundError, AppError } from '../../lib/errors';
import { events, APP_EVENTS } from '../../lib/events';

export const createCompany = async (data: CreateCompanyInput, creatorId: string) => {
  // 1. Separate PG and Mongo data
  const { richBio, officeLocations, perks, interviewProcess, ...pgData } = data;

  // 2. Create PG record first to get the UUID
  const newCompany = await placementRepo.insertCompanyPg({
    ...pgData,
    createdBy: creatorId,
    ctcRangeLpa: pgData.ctcRangeLpa ? `[${pgData.ctcRangeLpa[0]},${pgData.ctcRangeLpa[1]})` as any : undefined
  });

  // 3. Create Mongo profile using the PG UUID
  const mongoData = {
    pg_company_id: newCompany.id,
    about: richBio,
    officeLocations,
    perks,
    interview_patterns: interviewProcess
  };

  const newProfile = await placementRepo.insertCompanyMongo(mongoData);

  // 4. Update PG record with Mongo reference
  await placementRepo.updateCompanyPg(newCompany.id, {
    mongoProfileId: newProfile.id
  });

  return { ...newCompany, mongoProfileId: newProfile.id, profile: newProfile };
};

export const updateCompany = async (id: string, data: UpdateCompanyInput) => {
  const existingCompany = await placementRepo.getCompanyById(id);
  if (!existingCompany) {
    throw new NotFoundError('Company not found');
  }

  const { richBio, officeLocations, perks, interviewProcess, ...pgData } = data;

  let updatedCompany = existingCompany;

  if (Object.keys(pgData).length > 0) {
    const formattedPgData = {
      ...pgData,
      ctcRangeLpa: pgData.ctcRangeLpa ? `[${pgData.ctcRangeLpa[0]},${pgData.ctcRangeLpa[1]})` as any : undefined
    };
    const updated = await placementRepo.updateCompanyPg(id, formattedPgData as any);
    if(updated) updatedCompany = { ...updatedCompany, ...updated };
  }

  let updatedProfile = existingCompany.profile;
  if (existingCompany.mongoProfileId && (richBio !== undefined || officeLocations !== undefined || perks !== undefined || interviewProcess !== undefined)) {
    const mongoUpdateData: any = {};
    if (richBio !== undefined) mongoUpdateData.about = richBio;
    if (officeLocations !== undefined) mongoUpdateData.officeLocations = officeLocations;
    if (perks !== undefined) mongoUpdateData.perks = perks;
    if (interviewProcess !== undefined) mongoUpdateData.interview_patterns = interviewProcess;

    updatedProfile = await placementRepo.updateCompanyMongo(existingCompany.mongoProfileId, mongoUpdateData);
  }

  return { ...updatedCompany, profile: updatedProfile };
};

export const getCompany = async (id: string) => {
  const company = await placementRepo.getCompanyById(id);
  if (!company) {
    throw new NotFoundError('Company not found');
  }
  return company;
};

export const listCompanies = async (query: CompanyQuery) => {
  return await placementRepo.listCompaniesPg(query);
};

export const createDrive = async (data: CreateDriveInput, creatorId: string) => {
  // 1. Verify company exists
  const company = await placementRepo.getCompanyById(data.companyId);
  if (!company) {
    throw new NotFoundError('Company not found');
  }

  const { flowSpec, eligibility, scheduledAt, registrationDeadline, ...pgData } = data;

  // 2. Create Interview Flow in Mongo
  const flow = await placementRepo.insertDriveFlowMongo(data.companyId, data.name, creatorId, flowSpec);

  // 3. Create Drive in PG
  const newDrive = await placementRepo.insertDrivePg({
    ...pgData,
    eligibility: eligibility || null,
    mongoFlowId: flow.id,
    scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
    createdBy: creatorId,
  });

  return { ...newDrive, flow };
};

export const getDrive = async (id: string, userId?: string) => {
  const drive = await placementRepo.getDriveById(id, userId);
  if (!drive) {
    throw new NotFoundError('Drive not found');
  }
  return drive;
};

export const listDrives = async (query: DriveQuery) => {
  return await placementRepo.listDrivesPg(query);
};

export const registerForDrive = async (studentId: string, data: RegisterForDriveInput) => {
  const drive = await placementRepo.getDriveById(data.driveId);
  if (!drive) {
    throw new NotFoundError('Drive not found');
  }

  const existing = await placementRepo.getRegistrationByStudentAndDrive(studentId, data.driveId);
  if (existing) {
    throw new AppError('Student already registered for this drive', 409);
  }

  const registration = await placementRepo.insertRegistrationPg({
    studentId,
    driveId: data.driveId,
    status: 'registered'
  });

  return registration;
};

export const updateRegistrationStatus = async (id: string, data: UpdateRegistrationInput) => {
  try {
    const existing = await placementRepo.getRegistrationById(id);
    if (!existing) {
      throw new NotFoundError('Registration not found');
    }

    const updated = await placementRepo.updateRegistrationPg(id, data);
    return updated;
  } catch (error) {
    console.error('Error updating registration status:', error);
    throw error;
  }
};

export const getRegistration = async (id: string) => {
  const registration = await placementRepo.getRegistrationById(id);
  if (!registration) {
    throw new NotFoundError('Registration not found');
  }
  return registration;
};

export const listRegistrations = async (query: RegistrationQuery) => {
  return await placementRepo.listRegistrationsPg(query);
};

export const createQuestion = async (data: CreateQuestionInput, creatorId: string) => {
  return await placementRepo.insertQuestionMongo(data, creatorId);
};

export const updateQuestion = async (id: string, data: UpdateQuestionInput) => {
  const question = await placementRepo.updateQuestionMongo(id, data);
  if (!question) {
    throw new NotFoundError('Question not found');
  }
  return question;
};

export const getQuestion = async (id: string) => {
  const question = await placementRepo.getQuestionByIdMongo(id);
  if (!question) {
    throw new NotFoundError('Question not found');
  }
  return question;
};

export const listQuestions = async (query: QuestionQuery) => {
  return await placementRepo.listQuestionsMongo(query);
};

export const deleteQuestion = async (id: string) => {
  const deleted = await placementRepo.deleteQuestionMongo(id);
  if (!deleted) {
    throw new NotFoundError('Question not found');
  }
};

// --- INTERVIEW FLOWS (5.5) ---

export const createInterviewFlow = async (data: CreateInterviewFlowInput) => {
  // Check if company exists first
  const company = await placementRepo.getCompanyById(data.pg_company_id);
  if (!company) {
    throw new NotFoundError('Company not found');
  }

  return await placementRepo.insertInterviewFlowMongo(data);
};

export const getInterviewFlow = async (id: string) => {
  const flow = await placementRepo.getInterviewFlowMongo(id);
  if (!flow) {
    throw new NotFoundError('Interview flow not found');
  }
  return flow;
};

export const updateInterviewFlow = async (id: string, data: Partial<UpdateInterviewFlowInput>) => {
  // Ensure the document exists before update
  const flow = await placementRepo.getInterviewFlowMongo(id);
  if (!flow) {
    throw new NotFoundError('Interview flow not found');
  }

  return await placementRepo.updateInterviewFlowMongo(id, data);
};

export const listInterviewFlows = async (query: InterviewFlowQuery) => {
  return await placementRepo.getInterviewFlowsMongo(query);
};

export const deleteInterviewFlow = async (id: string) => {
  const deleted = await placementRepo.deleteInterviewFlowMongo(id);
  if (!deleted) {
    throw new NotFoundError('Interview flow not found');
  }
  return deleted;
};

// --- PLACEMENT SESSIONS (5.6) ---

export const createPlacementSession = async (data: CreatePlacementSessionInput) => {
  // Normally we would verify studentId exists in users/profiles
  // We'd also verify companyId, driveId, flowId if provided.
  
  return await placementRepo.insertPlacementSessionPg({
    studentId: data.studentId,
    sessionType: data.sessionType,
    driveId: data.driveId,
    companyId: data.companyId,
    mongoFlowId: data.mongoFlowId,
    roundNumber: data.roundNumber,
    status: 'scheduled'
  });
};

export const getPlacementSession = async (id: string) => {
  const session = await placementRepo.getPlacementSessionPg(id);
  if (!session) {
    throw new NotFoundError('Placement session not found');
  }
  return session;
};

export const updatePlacementSessionStatus = async (id: string, data: UpdatePlacementSessionStatusInput) => {
  const session = await placementRepo.getPlacementSessionPg(id);
  if (!session) {
    throw new NotFoundError('Placement session not found');
  }

  // State Machine Validation Logic
  const currentStatus = session.status;
  const newStatus = data.status;

  const validTransitions: Record<string, string[]> = {
    'scheduled': ['in_progress', 'completed', 'cancelled'],
    'in_progress': ['completed', 'cancelled'],
    'completed': ['passed', 'failed'],
    'passed': [],
    'failed': [],
    'cancelled': []
  };

  if (newStatus && currentStatus !== newStatus) {
    const allowed = validTransitions[currentStatus || 'scheduled'];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new AppError(`Invalid state transition from ${currentStatus} to ${newStatus}`, 400);
    }
  }

  return await placementRepo.updatePlacementSessionPg(id, {
    status: newStatus,
    score: data.score ? String(data.score) : undefined,
    maxScore: data.maxScore ? String(data.maxScore) : undefined,
    percentile: data.percentile ? String(data.percentile) : undefined,
    mongoAttemptId: data.mongoAttemptId,
    recordingUrl: data.recordingUrl,
    proctoringVerdict: data.proctoringVerdict,
    startedAt: data.startedAt ? new Date(data.startedAt) : undefined,
    endedAt: data.endedAt ? new Date(data.endedAt) : undefined
  });
};

export const listPlacementSessions = async (query: PlacementSessionQuery) => {
  return await placementRepo.listPlacementSessionsPg(query);
};

export const scheduleMockSession = async (studentId: string) => {
  const session = await placementRepo.insertPlacementSessionPg({
    studentId,
    sessionType: 'mock_interview',
    status: 'scheduled',
  });

  const attempt = await placementRepo.insertMockAttemptMongo({
    pg_session_id: session.id,
    pg_student_id: studentId,
    session_type: 'mock_interview',
  });

  const updatedSession = await placementRepo.updatePlacementSessionPg(session.id, {
    mongoAttemptId: attempt._id.toString(),
  });

  return {
    session: updatedSession ?? session,
    attempt,
  };
};

// --- MOCK INTERVIEW ATTEMPTS (5.7) ---

export const createMockAttempt = async (data: CreateMockAttemptInput) => {
  return await placementRepo.insertMockAttemptMongo(data);
};

export const updateMockAttempt = async (id: string, data: UpdateMockAttemptInput) => {
  const attempt = await placementRepo.updateMockAttemptMongo(id, data);
  if (!attempt) {
    throw new NotFoundError('Mock attempt not found');
  }

  // CDC: if aggregate_scores are present, emit MOCK_SCORED to recompute readiness
  if (data.aggregate_scores !== undefined && attempt.pg_student_id && attempt.pg_company_id) {
    const scores = data.aggregate_scores as Record<string, any> || {};
    events.emit(APP_EVENTS.MOCK_SCORED, {
      studentId: attempt.pg_student_id,
      companyId: attempt.pg_company_id,
      score: scores.overall ?? scores.total ?? 0,
      maxScore: scores.max_score ?? 100,
      sessionType: 'mock_interview',
    });
  }

  return attempt;
};

export const getMockAttempt = async (id: string) => {
  const attempt = await placementRepo.getMockAttemptByIdMongo(id);
  if (!attempt) {
    throw new NotFoundError('Mock attempt not found');
  }
  return attempt;
};

export const listMockAttempts = async (query: MockAttemptQuery) => {
  return await placementRepo.getMockAttemptsMongo(query);
};

// --- GD SESSIONS (5.8) ---

export const createGDSession = async (data: CreateGDSessionInput, creatorId: string) => {
  return await placementRepo.insertGDSessionPg({
    ...data,
    scheduledAt: new Date(data.scheduledAt),
    createdBy: creatorId
  });
};

export const updateGDSession = async (id: string, data: UpdateGDSessionInput) => {
  const exists = await placementRepo.getGDSessionByIdPg(id);
  if (!exists) {
    throw new NotFoundError('GD session not found');
  }
  const updated = await placementRepo.updateGDSessionPg(id, {
    ...data,
    scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined
  } as any);
  return updated;
};

export const getGDSession = async (id: string) => {
  const session = await placementRepo.getGDSessionByIdPg(id);
  if (!session) {
    throw new NotFoundError('GD session not found');
  }
  return session;
};

export const listGDSessions = async (query: GDSessionQuery) => {
  return await placementRepo.listGDSessionsPg(query);
};

export const leaveGDSession = async (sessionId: string, studentId: string) => {
  const session = await placementRepo.getGDSessionByIdPg(sessionId);
  if (!session) {
    throw new NotFoundError('GD session not found');
  }

  const participant = await placementRepo.markGDParticipantLeft(sessionId, studentId);
  return {
    sessionId,
    studentId,
    left: true,
    participant,
  };
};

export const addGDParticipant = async (sessionId: string, data: AddGDParticipantInput) => {
  return await placementRepo.insertGDParticipantPg({
    gdSessionId: sessionId,
    ...data,
    joinedAt: new Date()
  });
};

export const updateGDParticipant = async (participantId: string, data: UpdateGDParticipantInput) => {
  const result = await placementRepo.updateGDParticipantPg(participantId, {
    ...data,
    joinedAt: data.joinedAt ? new Date(data.joinedAt) : undefined,
    leftAt: data.leftAt ? new Date(data.leftAt) : undefined
  } as any);

  // CDC: if contribution/evaluator score updated, emit GD_SCORED
  if ((data.contributionScore !== undefined || data.evaluatorScore !== undefined) && result?.studentId) {
    // We need the GD session to get the drive->company link.
    // For now, emit with available data; the CDC handler aggregates from PG.
    events.emit(APP_EVENTS.GD_SCORED, {
      studentId: result.studentId,
      companyId: result.gdSessionId, // CDC handler will resolve company from sessions
      score: Number(data.contributionScore ?? data.evaluatorScore ?? 0),
      sessionType: 'group_discussion',
    });
  }

  return result;
};

export const removeGDParticipant = async (participantId: string) => {
  return await placementRepo.removeGDParticipantPg(participantId);
};

// ==========================================
// 5.9 - LIVE INTERVIEW SLOTS / BOOKINGS
// ==========================================

export const createLiveSlot = async (data: CreateLiveSlotInput) => {
  return await placementRepo.insertLiveSlotPg({
    ...data,
    scheduledAt: new Date(data.scheduledAt)
  });
};

export const updateLiveSlot = async (id: string, data: UpdateLiveSlotInput) => {
  return await placementRepo.updateLiveSlotPg(id, {
    ...data,
    scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined
  });
};

export const getLiveSlot = async (id: string) => {
  const slot = await placementRepo.getLiveSlotByIdPg(id);
  if (!slot) {
    throw new NotFoundError('Live slot not found');
  }
  return slot;
};

export const listLiveSlots = async (query: LiveSlotQuery) => {
  return await placementRepo.listLiveSlotsPg(query);
};

export const bookLiveInterview = async (data: BookLiveInterviewInput, studentId: string) => {
  return await placementRepo.insertBookingPg({
    slotId: data.slotId,
    studentId
  });
};

export const updateBookingStatus = async (id: string, data: UpdateBookingStatusInput) => {
  return await placementRepo.updateBookingPg(id, { ...data });
};

// ==========================================
// 5.10 - PEER GROUPS
// ==========================================

export const createPeerGroup = async (data: CreatePeerGroupInput, creatorId: string) => {
  return await placementRepo.insertPeerGroupPg({
    ...data,
    createdBy: creatorId
  });
};

export const updatePeerGroup = async (id: string, data: UpdatePeerGroupInput) => {
  return await placementRepo.updatePeerGroupPg(id, data);
};

export const getPeerGroup = async (id: string) => {
  const group = await placementRepo.getPeerGroupByIdPg(id);
  if (!group) throw new NotFoundError('Peer group not found');
  return group;
};

export const listPeerGroups = async (query: PeerGroupQuery) => {
  return await placementRepo.listPeerGroupsPg(query);
};

export const addPeerGroupMember = async (groupId: string, data: AddPeerGroupMemberInput) => {
  return await placementRepo.insertPeerGroupMemberPg(groupId, data.userId);
};

export const createPeerSession = async (data: CreatePeerSessionInput, creatorId: string) => {
  return await placementRepo.insertPeerSessionPg({
    ...data,
    createdBy: creatorId,
    scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined
  });
};

export const updatePeerSession = async (id: string, data: UpdatePeerSessionInput) => {
  return await placementRepo.updatePeerSessionPg(id, data);
};

// ==========================================
// 5.11 - READINESS SCORES
// ==========================================

export const computeReadinessScore = async (studentId: string, companyId: string) => {
  // Logic to actually compute score goes here. 
  // Let's generate a mock score out of existing metrics.
  const randomScore = Math.floor(Math.random() * 40) + 60; // 60 to 100
  
  return await placementRepo.upsertReadinessScorePg(studentId, companyId, {
    overallScore: String(randomScore),
    components: { mock: 80, gd: 70, dsa: 90 }, // mock components structure
    sessionsCount: 5
  });
};

export const listReadinessScores = async (query: ReadinessScoreQuery) => {
  return await placementRepo.listReadinessScoresPg(query);
};

// --- PROCTORING EVENTS (5.12) ---

export const ingestProctoringEvent = async (data: IngestProctoringEventInput, studentId: string) => {
  return await placementRepo.insertProctoringEventMongo({ ...data, pg_student_id: studentId });
};

export const listProctoringEvents = async (query: ProctoringEventQuery) => {
  return await placementRepo.listProctoringEventsMongo(query);
};

import { eq, and, sql, desc, count, inArray } from 'drizzle-orm';
import { db } from '../../config/postgres';
import { 
  companies, companyDrives, driveRegistrations, placementSessions, 
  gdSessions, gdParticipants,
  liveInterviewSlots, liveInterviewBookings,
  peerGroups, peerGroupMembers, peerSessions,
  readinessScores
} from '../../db/pg/schema/placement';
import { CompanyProfileModel, InterviewFlowModel, QuestionBankModel, MockInterviewAttemptModel, GDRecordingModel } from '../../db/mongo/models/placement';
import { ProctoringEventModel } from '../../db/mongo/models/core';
import { users } from '../../db/pg/schema/core';
import { 
  CreateCompanyInput, UpdateCompanyInput, CompanyQuery, 
  CreateDriveInput, UpdateDriveInput, DriveQuery,
  RegistrationQuery, UpdateRegistrationInput,
  CreateQuestionInput, UpdateQuestionInput, QuestionQuery,
  CreateInterviewFlowInput, UpdateInterviewFlowInput, InterviewFlowQuery,
  CreatePlacementSessionInput, UpdatePlacementSessionStatusInput, PlacementSessionQuery,
  CreateMockAttemptInput, UpdateMockAttemptInput, MockAttemptQuery,
  CreateGDSessionInput, UpdateGDSessionInput, GDSessionQuery,
  AddGDParticipantInput, UpdateGDParticipantInput,
  LiveSlotQuery, PeerGroupQuery, ReadinessScoreQuery, IngestProctoringEventInput, ProctoringEventQuery
} from './placement.schemas';

// --- COMPANY REPOSITORY ---

export const insertCompanyPg = async (
  data: Partial<typeof companies.$inferInsert>
): Promise<typeof companies.$inferSelect> => {
  const [company] = await db.insert(companies).values(data as any).returning();
  return company;
};

export const insertCompanyMongo = async (
  data: Partial<CreateCompanyInput>
) => {
  const profile = new CompanyProfileModel(data);
  await profile.save();
  return profile;
};

export const updateCompanyPg = async (
  id: string,
  data: Partial<typeof companies.$inferInsert>
): Promise<typeof companies.$inferSelect | null> => {
  const [company] = await db
    .update(companies)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(companies.id, id))
    .returning();
  return company || null;
};

export const updateCompanyMongo = async (
  mongoId: string,
  data: Partial<UpdateCompanyInput>
) => {
  return await CompanyProfileModel.findByIdAndUpdate(mongoId, data, { new: true });
};

export const getCompanyById = async (id: string) => {
  const [company] = await db
    .select()
    .from(companies)
    .where(and(eq(companies.id, id), eq(companies.status, 'active')))
    .limit(1);

  if (!company) return null;

  let mongoProfile = null;
  if (company.mongoProfileId) {
    mongoProfile = await CompanyProfileModel.findById(company.mongoProfileId);
  }

  return { ...company, profile: mongoProfile };
};

export const listCompaniesPg = async (query: CompanyQuery) => {
  const { page = 1, limit = 10, industry, tier, status = 'active' } = query;
  const offset = (page - 1) * limit;

  let conditions = [];
  if (status) conditions.push(eq(companies.status, status));
  if (industry) conditions.push(eq(companies.industry, industry));
  if (tier) conditions.push(eq(companies.tier, tier));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db
    .select()
    .from(companies)
    .where(whereClause)
    .orderBy(desc(companies.createdAt))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: count() })
    .from(companies)
    .where(whereClause);

  return {
    data,
    meta: {
      total: countResult.count,
      page,
      limit,
      totalPages: Math.ceil(countResult.count / limit)
    }
  };
};

// --- DRIVE REPOSITORY ---

export const insertDrivePg = async (
  data: Partial<typeof companyDrives.$inferInsert>
): Promise<typeof companyDrives.$inferSelect> => {
  const [drive] = await db.insert(companyDrives).values(data as any).returning();
  return drive;
};

export const deleteDrivePg = async (id: string): Promise<void> => {
  await db.transaction(async (tx) => {
    // 1. Delete live interview bookings for the slots of this drive
    const slots = await tx
      .select({ id: liveInterviewSlots.id })
      .from(liveInterviewSlots)
      .where(eq(liveInterviewSlots.driveId, id));
    
    const slotIds = slots.map(s => s.id);
    if (slotIds.length > 0) {
      await tx
        .delete(liveInterviewBookings)
        .where(inArray(liveInterviewBookings.slotId, slotIds));
    }

    // 2. Delete live interview slots
    await tx
      .delete(liveInterviewSlots)
      .where(eq(liveInterviewSlots.driveId, id));

    // 3. Delete GD participants
    const gdSess = await tx
      .select({ id: gdSessions.id })
      .from(gdSessions)
      .where(eq(gdSessions.driveId, id));
      
    const gdSessionIds = gdSess.map(s => s.id);
    if (gdSessionIds.length > 0) {
      await tx
        .delete(gdParticipants)
        .where(inArray(gdParticipants.gdSessionId, gdSessionIds));
    }

    // 4. Delete GD sessions
    await tx
      .delete(gdSessions)
      .where(eq(gdSessions.driveId, id));

    // 5. Delete placement sessions
    await tx
      .delete(placementSessions)
      .where(eq(placementSessions.driveId, id));

    // 6. Delete drive registrations
    await tx
      .delete(driveRegistrations)
      .where(eq(driveRegistrations.driveId, id));

    // 7. Delete the company drive itself
    await tx
      .delete(companyDrives)
      .where(eq(companyDrives.id, id));
  });
};

// --- PROCTORING EVENTS (5.12) ---

export const insertProctoringEventMongo = async (payload: IngestProctoringEventInput & { pg_student_id: string }) => {
  const event = new ProctoringEventModel({
    pg_student_id: payload.pg_student_id,
    module: payload.session_type,
    session_id: payload.pg_session_id,
    event_type: payload.event_type,
    severity: payload.severity,
    metadata: payload.metadata,
    timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date()
  });
  return await event.save();
};

export const listProctoringEventsMongo = async (query: ProctoringEventQuery) => {
  const { studentId, sessionId, eventType, severity, page = 1, limit = 10 } = query || {};
  const filter: any = {};

  if (studentId) filter.pg_student_id = studentId;
  if (sessionId) filter.session_id = sessionId;
  if (eventType) filter.event_type = eventType;
  if (severity) filter.severity = severity;

  const skip = (page - 1) * limit;
  const data = await ProctoringEventModel.find(filter)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit);

  const total = await ProctoringEventModel.countDocuments(filter);

  return { data, total, page, limit };
};

export const insertDriveFlowMongo = async (
  companyId: string,
  name: string,
  creatorId: string,
  flowSpec: CreateDriveInput['flowSpec']
) => {
  const flow = new InterviewFlowModel({
    pg_company_id: companyId,
    name,
    pg_created_by: creatorId,
    rounds: flowSpec
  });
  await flow.save();
  return flow;
};

export const getDriveById = async (id: string, userId?: string) => {
  const [drive] = await db
    .select({
      id: companyDrives.id,
      name: companyDrives.name,
      companyId: companyDrives.companyId,
      companyName: companies.name,
      companyLogo: companies.logoUrl,
      companyDescription: companies.description,
      targetRoles: companyDrives.targetRoles,
      status: companyDrives.status,
      scheduledAt: companyDrives.scheduledAt,
      registrationDeadline: companyDrives.registrationDeadline,
      eligibility: companyDrives.eligibility,
      mongoFlowId: companyDrives.mongoFlowId,
      createdAt: companyDrives.createdAt,
      createdBy: companyDrives.createdBy,
      myStatus: userId ? driveRegistrations.status : sql<string | null>`NULL`,
    })
    .from(companyDrives)
    .leftJoin(companies, eq(companyDrives.companyId, companies.id))
    .leftJoin(
      driveRegistrations,
      userId 
        ? and(eq(driveRegistrations.driveId, companyDrives.id), eq(driveRegistrations.studentId, userId))
        : sql`FALSE`
    )
    .where(eq(companyDrives.id, id))
    .limit(1);

  if (!drive) return null;

  let driveStatus = drive.status;
  if (userId && drive.myStatus) {
    driveStatus = drive.myStatus === 'registered' ? 'applied' : drive.myStatus;
  }

  let interviewFlow = null;
  if (drive.mongoFlowId) {
    interviewFlow = await InterviewFlowModel.findById(drive.mongoFlowId).lean();
  }

  return { ...drive, status: driveStatus, flow: interviewFlow };
};

export const listDrivesPg = async (query: DriveQuery) => {
  const { page = 1, limit = 10, companyId, status, userId } = query;
  const offset = (page - 1) * limit;

  let conditions = [];
  if (companyId) conditions.push(eq(companyDrives.companyId, companyId));
  if (status) conditions.push(eq(companyDrives.status, status));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db
    .select({
      id: companyDrives.id,
      name: companyDrives.name,
      companyId: companyDrives.companyId,
      companyName: companies.name,
      companyLogo: companies.logoUrl,
      targetRoles: companyDrives.targetRoles,
      status: companyDrives.status,
      scheduledAt: companyDrives.scheduledAt,
      registrationDeadline: companyDrives.registrationDeadline,
      createdAt: companyDrives.createdAt,
      createdBy: companyDrives.createdBy,
      myStatus: userId ? driveRegistrations.status : sql<string | null>`NULL`,
    })
    .from(companyDrives)
    .leftJoin(companies, eq(companyDrives.companyId, companies.id))
    .leftJoin(
      driveRegistrations,
      userId 
        ? and(eq(driveRegistrations.driveId, companyDrives.id), eq(driveRegistrations.studentId, userId))
        : sql`FALSE`
    )
    .where(whereClause)
    .orderBy(desc(companyDrives.createdAt))
    .limit(limit)
    .offset(offset);

  const mappedData = data.map(drive => {
    let driveStatus = drive.status;
    if (userId && drive.myStatus) {
      driveStatus = drive.myStatus === 'registered' ? 'applied' : drive.myStatus;
    }
    return {
      ...drive,
      status: driveStatus,
    };
  });

  const [countResult] = await db
    .select({ count: count() })
    .from(companyDrives)
    .where(whereClause);

  return {
    data: mappedData,
    meta: {
      total: countResult.count,
      page,
      limit,
      totalPages: Math.ceil(countResult.count / limit)
    }
  };
};

// --- DRIVE REGISTRATION REPOSITORY ---

export const insertRegistrationPg = async (
  data: Partial<typeof driveRegistrations.$inferInsert>
): Promise<typeof driveRegistrations.$inferSelect> => {
  const [registration] = await db.insert(driveRegistrations).values(data as any).returning();
  return registration;
};

export const updateRegistrationPg = async (
  id: string,
  data: Partial<typeof driveRegistrations.$inferInsert>
): Promise<typeof driveRegistrations.$inferSelect | null> => {
  try {
    const [registration] = await db
      .update(driveRegistrations)
      .set(data)
      .where(eq(driveRegistrations.id, id))
      .returning();
    return registration || null;
  } catch (error) {
    console.error('Database error in updateRegistrationPg:', error);
    throw error;
  }
};

export const getRegistrationById = async (id: string) => {
  const [registration] = await db
    .select()
    .from(driveRegistrations)
    .where(eq(driveRegistrations.id, id))
    .limit(1);
  return registration || null;
};

export const getRegistrationByStudentAndDrive = async (studentId: string, driveId: string) => {
  const [registration] = await db
    .select()
    .from(driveRegistrations)
    .where(and(eq(driveRegistrations.studentId, studentId), eq(driveRegistrations.driveId, driveId)))
    .limit(1);
  return registration || null;
};

export const listRegistrationsPg = async (query: RegistrationQuery) => {
  const { page = 1, limit = 10, driveId, studentId, status } = query;
  const offset = (page - 1) * limit;

  let conditions = [];
  if (driveId) conditions.push(eq(driveRegistrations.driveId, driveId));
  if (studentId) conditions.push(eq(driveRegistrations.studentId, studentId));
  if (status) conditions.push(eq(driveRegistrations.status, status));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db
    .select({
      id: driveRegistrations.id,
      studentId: driveRegistrations.studentId,
      driveId: driveRegistrations.driveId,
      status: driveRegistrations.status,
      registeredAt: driveRegistrations.registeredAt,
      resumeUrl: users.resumeUrl,
      student: {
        fullName: users.fullName,
        email: users.email,
        resumeUrl: users.resumeUrl,
      },
      drive: {
        name: companyDrives.name,
        companyId: companyDrives.companyId,
      }
    })
    .from(driveRegistrations)
    .innerJoin(users, eq(driveRegistrations.studentId, users.id))
    .innerJoin(companyDrives, eq(driveRegistrations.driveId, companyDrives.id))
    .where(whereClause)
    .orderBy(desc(driveRegistrations.registeredAt))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: count() })
    .from(driveRegistrations)
    .where(whereClause);

  return {
    data,
    meta: {
      total: countResult.count,
      page,
      limit,
      totalPages: Math.ceil(countResult.count / limit)
    }
  };
};

// --- PLACEMENT SESSIONS REPOSITORY ---

export const insertPlacementSessionPg = async (
  data: Partial<typeof placementSessions.$inferInsert>
): Promise<typeof placementSessions.$inferSelect> => {
  const [session] = await db.insert(placementSessions).values(data as any).returning();
  return session;
};

export const findActivePlacementSessionPg = async (query: {
  studentId: string;
  sessionType: string;
  driveId?: string;
  roundNumber?: number;
}) => {
  const conditions: any[] = [
    eq(placementSessions.studentId, query.studentId),
    eq(placementSessions.sessionType, query.sessionType),
    inArray(placementSessions.status, ['scheduled', 'in_progress']),
  ];

  if (query.driveId) conditions.push(eq(placementSessions.driveId, query.driveId));
  if (query.roundNumber !== undefined) conditions.push(eq(placementSessions.roundNumber, query.roundNumber));

  const [session] = await db
    .select()
    .from(placementSessions)
    .where(and(...conditions))
    .orderBy(desc(placementSessions.createdAt))
    .limit(1);

  return session || null;
};

export const getPlacementSessionPg = async (id: string) => {
  const [session] = await db
    .select({
      id: placementSessions.id,
      studentId: placementSessions.studentId,
      sessionType: placementSessions.sessionType,
      driveId: placementSessions.driveId,
      companyId: placementSessions.companyId,
      mongoFlowId: placementSessions.mongoFlowId,
      roundNumber: placementSessions.roundNumber,
      roundLabel: placementSessions.roundLabel,
      scheduledAt: placementSessions.scheduledAt,
      status: placementSessions.status,
      score: placementSessions.score,
      maxScore: placementSessions.maxScore,
      percentile: placementSessions.percentile,
      mongoAttemptId: placementSessions.mongoAttemptId,
      recordingUrl: placementSessions.recordingUrl,
      proctoringVerdict: placementSessions.proctoringVerdict,
      feedbackNotes: placementSessions.feedbackNotes,
      startedAt: placementSessions.startedAt,
      endedAt: placementSessions.endedAt,
      createdAt: placementSessions.createdAt,
      updatedAt: placementSessions.updatedAt,
      // Enriched display fields
      driveName: companyDrives.name,
      companyName: companies.name,
      companyLogo: companies.logoUrl,
      candidateName: users.fullName,
      candidateEmail: users.email,
      candidateResumeUrl: users.resumeUrl,
      candidateCgpa: users.cgpa,
      candidateBranch: users.branch,
    })
    .from(placementSessions)
    .leftJoin(companyDrives, eq(placementSessions.driveId, companyDrives.id))
    .leftJoin(companies, eq(placementSessions.companyId, companies.id))
    .leftJoin(users, eq(placementSessions.studentId, users.id))
    .where(eq(placementSessions.id, id))
    .limit(1);
  return session || null;
};

export const updatePlacementSessionPg = async (
  id: string,
  data: Partial<typeof placementSessions.$inferInsert>
) => {
  const [session] = await db
    .update(placementSessions)
    .set(data)
    .where(eq(placementSessions.id, id))
    .returning();
  return session || null;
};

export const listPlacementSessionsPg = async (query: any) => {
  const { studentId, driveId, status, active, sessionType, page = 1, limit = 50 } = query || {};
  const offset = (Number(page) - 1) * Number(limit);
  let conditions: any[] = [];

  if (studentId) conditions.push(eq(placementSessions.studentId, studentId));
  if (driveId) conditions.push(eq(placementSessions.driveId, driveId));
  if (sessionType) conditions.push(eq(placementSessions.sessionType, sessionType));
  if (active === 'true') {
    conditions.push(inArray(placementSessions.status, ['scheduled', 'in_progress']));
  } else if (status?.includes(',')) {
    conditions.push(inArray(placementSessions.status, status.split(',').map((s: string) => s.trim()).filter(Boolean)));
  } else if (status) {
    conditions.push(eq(placementSessions.status, status));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db
    .select({
      id: placementSessions.id,
      studentId: placementSessions.studentId,
      sessionType: placementSessions.sessionType,
      driveId: placementSessions.driveId,
      companyId: placementSessions.companyId,
      roundNumber: placementSessions.roundNumber,
      status: placementSessions.status,
      startedAt: placementSessions.startedAt,
      endedAt: placementSessions.endedAt,
      createdAt: placementSessions.createdAt,
      // Enriched display fields
      driveName: companyDrives.name,
      companyName: companies.name,
      companyLogo: companies.logoUrl,
    })
    .from(placementSessions)
    .leftJoin(companyDrives, eq(placementSessions.driveId, companyDrives.id))
    .leftJoin(companies, eq(placementSessions.companyId, companies.id))
    .where(whereClause)
    .orderBy(desc(placementSessions.createdAt))
    .limit(Number(limit))
    .offset(offset);

  const [countResult] = await db
    .select({ count: count() })
    .from(placementSessions)
    .where(whereClause);

  return {
    data,
    meta: {
      total: countResult.count,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(countResult.count / Number(limit)),
    },
  };
};

// --- QUESTION BANK REPOSITORY ---

export const insertQuestionMongo = async (data: CreateQuestionInput, creatorId: string) => {
  const question = new QuestionBankModel({
    ...data,
    pg_created_by: creatorId
  });
  await question.save();
  return question;
};

export const updateQuestionMongo = async (id: string, data: Partial<UpdateQuestionInput>) => {
  return await QuestionBankModel.findByIdAndUpdate(id, data, { new: true });
};

export const getQuestionByIdMongo = async (id: string) => {
  return await QuestionBankModel.findById(id);
};

export const listQuestionsMongo = async (query: QuestionQuery) => {
  const { page = 1, limit = 10, type, difficulty, status, subject, topic } = query;

  const filter: any = {};
  if (type) filter.type = type;
  if (difficulty) filter.difficulty = difficulty;
  if (status) filter.status = status;
  if (subject) filter.subject = subject;
  if (topic) filter.topic = topic;

  const [data, total] = await Promise.all([
    QuestionBankModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    QuestionBankModel.countDocuments(filter)
  ]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const deleteQuestionMongo = async (id: string) => {
  return await QuestionBankModel.findByIdAndDelete(id);
};

// --- INTERVIEW FLOWS REPOSITORY ---
export const insertInterviewFlowMongo = async (data: CreateInterviewFlowInput) => {
  const flow = new InterviewFlowModel({
    ...data,
    created_at: new Date(),
    updated_at: new Date()
  });
  return await flow.save();
};

export const getInterviewFlowMongo = async (id: string) => {
  return await InterviewFlowModel.findById(id).lean();
};

export const updateInterviewFlowMongo = async (id: string, data: Partial<UpdateInterviewFlowInput>) => {
  return await InterviewFlowModel.findByIdAndUpdate(
    id,
    { ...data, updated_at: new Date() },
    { new: true }
  ).lean();
};

export const getInterviewFlowsMongo = async (queryParams: InterviewFlowQuery) => {
  const { page = 1, limit = 10, pg_company_id, status } = queryParams;
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (pg_company_id) filter.pg_company_id = pg_company_id;
  if (status) filter.status = status;

  const [data, total] = await Promise.all([
    InterviewFlowModel.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ created_at: -1 })
      .lean(),
    InterviewFlowModel.countDocuments(filter)
  ]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const deleteInterviewFlowMongo = async (id: string) => {
  return await InterviewFlowModel.findByIdAndDelete(id);
};

// --- MOCK INTERVIEW ATTEMPTS REPOSITORY (5.7) ---

export const insertMockAttemptMongo = async (data: CreateMockAttemptInput) => {
  const attempt = new MockInterviewAttemptModel({
    ...data,
    status: 'started'
  });
  return await attempt.save();
};

export const updateMockAttemptMongo = async (id: string, data: UpdateMockAttemptInput) => {
  return await MockInterviewAttemptModel.findByIdAndUpdate(id, data, { new: true }).lean();
};

export const getMockAttemptByIdMongo = async (id: string) => {
  return await MockInterviewAttemptModel.findById(id).lean();
};

export const getMockAttemptsMongo = async (queryParams: MockAttemptQuery) => {
  const { page = 1, limit = 10, pg_student_id, pg_session_id, status } = queryParams;
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (pg_student_id) filter.pg_student_id = pg_student_id;
  if (pg_session_id) filter.pg_session_id = pg_session_id;
  if (status) filter.status = status;

  const [data, total] = await Promise.all([
    MockInterviewAttemptModel.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean(),
    MockInterviewAttemptModel.countDocuments(filter)
  ]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

// --- GD SESSIONS REPOSITORY (5.8) ---

export const insertGDSessionPg = async (
  data: Partial<typeof gdSessions.$inferInsert>
): Promise<typeof gdSessions.$inferSelect> => {
  const [session] = await db.insert(gdSessions).values(data as any).returning();
  return session;
};

export const updateGDSessionPg = async (
  id: string,
  data: Partial<typeof gdSessions.$inferInsert>
): Promise<typeof gdSessions.$inferSelect | undefined> => {
  const [session] = await db
    .update(gdSessions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(gdSessions.id, id))
    .returning();
  return session;
};

export const getGDSessionByIdPg = async (id: string) => {
  const [session] = await db
    .select()
    .from(gdSessions)
    .where(eq(gdSessions.id, id))
    .limit(1);
    
  if (!session) return undefined;
  
  const participants = await db
    .select()
    .from(gdParticipants)
    .where(eq(gdParticipants.gdSessionId, id));

  let recording = null;
  if (session.mongoRecordingId) {
    recording = await GDRecordingModel.findById(session.mongoRecordingId).lean();
  }

  return { ...session, participants, recording };
};

export const listGDSessionsPg = async (query: GDSessionQuery) => {
  const { page = 1, limit = 10, driveId, status } = query;
  const offset = (page - 1) * limit;

  let conditions = [];
  if (driveId) conditions.push(eq(gdSessions.driveId, driveId));
  if (status) conditions.push(eq(gdSessions.status, status));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db
    .select()
    .from(gdSessions)
    .where(whereClause)
    .orderBy(desc(gdSessions.createdAt))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: count() })
    .from(gdSessions)
    .where(whereClause);

  return {
    data,
    meta: {
      total: countResult.count,
      page,
      limit,
      totalPages: Math.ceil(countResult.count / limit)
    }
  };
};

export const insertGDParticipantPg = async (
  data: Partial<typeof gdParticipants.$inferInsert>
) => {
  const [participant] = await db.insert(gdParticipants).values(data as any).returning();
  return participant;
};

export const updateGDParticipantPg = async (
  id: string,
  data: Partial<typeof gdParticipants.$inferInsert>
) => {
  const [participant] = await db
    .update(gdParticipants)
    .set({ ...data })
    .where(eq(gdParticipants.id, id))
    .returning();
  return participant;
};

export const removeGDParticipantPg = async (id: string) => {
  const [participant] = await db
    .delete(gdParticipants)
    .where(eq(gdParticipants.id, id))
    .returning();
  return participant;
};

export const markGDParticipantLeft = async (gdSessionId: string, studentId: string) => {
  const [participant] = await db
    .update(gdParticipants)
    .set({ leftAt: new Date() })
    .where(and(eq(gdParticipants.gdSessionId, gdSessionId), eq(gdParticipants.studentId, studentId)))
    .returning();
  return participant || null;
};

// ==========================================
// 5.9 - LIVE INTERVIEW SLOTS / BOOKINGS
// ==========================================

export const insertLiveSlotPg = async (data: Partial<typeof liveInterviewSlots.$inferInsert>) => {
  const [slot] = await db.insert(liveInterviewSlots).values(data as any).returning();
  return slot;
};

export const updateLiveSlotPg = async (id: string, data: Partial<typeof liveInterviewSlots.$inferInsert>) => {
  const [slot] = await db
    .update(liveInterviewSlots)
    .set({ ...data })
    .where(eq(liveInterviewSlots.id, id))
    .returning();
  return slot;
};

export const getLiveSlotByIdPg = async (id: string) => {
  const [slot] = await db
    .select()
    .from(liveInterviewSlots)
    .where(eq(liveInterviewSlots.id, id));
  return slot;
};

export const listLiveSlotsPg = async (query: LiveSlotQuery) => {
  const { driveId, status, page = 1, limit = 10 } = query || {};
  let filters: any[] = [];

  if (driveId) filters.push(eq(liveInterviewSlots.driveId, driveId));
  if (status) filters.push(eq(liveInterviewSlots.status, status));

  const offset = (page - 1) * limit;
  const whereClause = filters.length > 0 ? and(...filters) : undefined;

  const data = await db
    .select()
    .from(liveInterviewSlots)
    .where(whereClause)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(liveInterviewSlots.scheduledAt));

  const [{ count: total }] = await db
    .select({ count: count() })
    .from(liveInterviewSlots)
    .where(whereClause);

  return { data, total: Number(total), page, limit };
};

export const insertBookingPg = async (data: Partial<typeof liveInterviewBookings.$inferInsert>) => {
  const [booking] = await db.insert(liveInterviewBookings).values(data as any).returning();
  return booking;
};

export const updateBookingPg = async (id: string, data: Partial<typeof liveInterviewBookings.$inferInsert>) => {
  const [booking] = await db
    .update(liveInterviewBookings)
    .set({ ...data })
    .where(eq(liveInterviewBookings.id, id))
    .returning();
  return booking;
};

// ==========================================
// 5.10 - PEER GROUPS
// ==========================================

export const insertPeerGroupPg = async (data: Partial<typeof peerGroups.$inferInsert>) => {
  const [group] = await db.insert(peerGroups).values(data as any).returning();
  return group;
};

export const updatePeerGroupPg = async (id: string, data: Partial<typeof peerGroups.$inferInsert>) => {
  const [group] = await db
    .update(peerGroups)
    .set({ ...data })
    .where(eq(peerGroups.id, id))
    .returning();
  return group;
};

export const getPeerGroupByIdPg = async (id: string) => {
  const [group] = await db
    .select()
    .from(peerGroups)
    .where(eq(peerGroups.id, id));
  return group;
};

export const listPeerGroupsPg = async (query: PeerGroupQuery) => {
  const { userId, isPrivate, page = 1, limit = 10 } = query || {};
  let filters: any[] = [];

  if (isPrivate !== undefined) filters.push(eq(peerGroups.isPrivate, isPrivate));

  // If we need to filter by userId, we would likely do a join. Keeping simple for now
  // Assuming a direct approach or fetch all and filter if needed.
  // Proper mapping would be required in Drizzle to relationally filter

  const offset = (page - 1) * limit;
  const whereClause = filters.length > 0 ? and(...filters) : undefined;

  const data = await db
    .select()
    .from(peerGroups)
    .where(whereClause)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(peerGroups.createdAt));

  const [{ count: total }] = await db
    .select({ count: count() })
    .from(peerGroups)
    .where(whereClause);

  return { data, total: Number(total), page, limit };
};

export const insertPeerGroupMemberPg = async (groupId: string, userId: string) => {
  const [member] = await db.insert(peerGroupMembers).values({ groupId, userId }).returning();
  return member;
};

export const insertPeerSessionPg = async (data: Partial<typeof peerSessions.$inferInsert>) => {
  const [session] = await db.insert(peerSessions).values(data as any).returning();
  return session;
};

export const updatePeerSessionPg = async (id: string, data: Partial<typeof peerSessions.$inferInsert>) => {
  const [session] = await db
    .update(peerSessions)
    .set({ ...data })
    .where(eq(peerSessions.id, id))
    .returning();
  return session;
};

// ==========================================
// 5.11 - READINESS SCORES
// ==========================================

export const upsertReadinessScorePg = async (studentId: string, companyId: string, payload: Partial<typeof readinessScores.$inferInsert>) => {
  // Try to find if one exists
  const [existing] = await db
    .select()
    .from(readinessScores)
    .where(and(
      eq(readinessScores.studentId, studentId),
      eq(readinessScores.companyId, companyId)
    ));
    
  if (existing) {
    const [updated] = await db
      .update(readinessScores)
      .set({ ...payload, computedAt: sql`now()` })
      .where(eq(readinessScores.id, existing.id))
      .returning();
    return updated;
  }
  
  const [inserted] = await db
    .insert(readinessScores)
    .values({ ...payload, studentId, companyId } as any)
    .returning();
  return inserted;
};

export const listReadinessScoresPg = async (query: ReadinessScoreQuery) => {
  const { studentId, companyId, page = 1, limit = 10 } = query || {};
  let filters: any[] = [];

  if (studentId) filters.push(eq(readinessScores.studentId, studentId));
  if (companyId) filters.push(eq(readinessScores.companyId, companyId));

  const offset = (page - 1) * limit;
  const whereClause = filters.length > 0 ? and(...filters) : undefined;

  const data = await db
    .select()
    .from(readinessScores)
    .where(whereClause)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(readinessScores.computedAt));

  const [{ count: total }] = await db
    .select({ count: count() })
    .from(readinessScores)
    .where(whereClause);

  return { data, total: Number(total), page, limit };
};

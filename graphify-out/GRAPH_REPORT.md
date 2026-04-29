# Graph Report - .  (2026-04-29)

## Corpus Check
- Large corpus: 280 files · ~157,644 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 872 nodes · 811 edges · 45 communities detected
- Extraction: 82% EXTRACTED · 18% INFERRED · 0% AMBIGUOUS · INFERRED: 143 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 78|Community 78]]

## God Nodes (most connected - your core abstractions)
1. `successResponse()` - 103 edges
2. `ExamService` - 16 edges
3. `startServer()` - 11 edges
4. `ExamAttemptRepository` - 11 edges
5. `logAction()` - 10 edges
6. `CourseService` - 10 edges
7. `ExamRepository` - 10 edges
8. `login()` - 8 edges
9. `CourseRepository` - 8 edges
10. `AiService` - 7 edges

## Surprising Connections (you probably didn't know these)
- `getBatch()` --calls--> `successResponse()`  [INFERRED]
  ugskill-api\src\modules\batch\batch.controller.ts → ugskill-api\src\lib\response.ts
- `startServer()` --calls--> `seedAdmin()`  [INFERRED]
  ugskill-api\src\server.ts → ugskill-api\src\db\seed-admin.ts
- `startServer()` --calls--> `createSocketServer()`  [INFERRED]
  ugskill-api\src\server.ts → ugskill-api\src\sockets\socket.server.ts
- `startServer()` --calls--> `registerExamNamespace()`  [INFERRED]
  ugskill-api\src\server.ts → ugskill-api\src\sockets\exam.namespace.ts
- `startServer()` --calls--> `registerChatNamespace()`  [INFERRED]
  ugskill-api\src\server.ts → ugskill-api\src\sockets\chat.namespace.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (89): AssignmentController, forgotPassword(), login(), logout(), refresh(), register(), resetPassword(), CertificateController (+81 more)

### Community 3 - "Community 3"
Cohesion: 0.1
Nodes (16): hashToken(), login(), logout(), refreshTokens(), register(), sanitizeUser(), handleLogout(), acceptInvite() (+8 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (14): connectMongo(), seedAdmin(), registerChatNamespace(), clearTimer(), getRemaining(), registerExamNamespace(), setRemaining(), timerKey() (+6 more)

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (14): addMembers(), createBatch(), deleteBatch(), getBatch(), getIp(), listBatches(), removeMember(), updateBatch() (+6 more)

### Community 6 - "Community 6"
Cohesion: 0.16
Nodes (12): logAction(), resetPassword(), addMembers(), createBatch(), deleteBatch(), removeMember(), updateBatch(), deleteUser() (+4 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (1): ExamService

### Community 10 - "Community 10"
Cohesion: 0.17
Nodes (1): ExamAttemptRepository

### Community 11 - "Community 11"
Cohesion: 0.2
Nodes (1): CourseService

### Community 12 - "Community 12"
Cohesion: 0.2
Nodes (1): ExamRepository

### Community 13 - "Community 13"
Cohesion: 0.27
Nodes (4): AppError, AuthError, NotFoundError, ValidationError

### Community 14 - "Community 14"
Cohesion: 0.24
Nodes (4): connectSocket(), getSocket(), onContextMenu(), onVisibilityChange()

### Community 15 - "Community 15"
Cohesion: 0.29
Nodes (6): deleteOption(), makeOption(), makeQuestion(), setCorrect(), updateOption(), updateQ()

### Community 16 - "Community 16"
Cohesion: 0.22
Nodes (1): CourseRepository

### Community 17 - "Community 17"
Cohesion: 0.25
Nodes (1): AiService

### Community 18 - "Community 18"
Cohesion: 0.29
Nodes (1): ProgressRepository

### Community 19 - "Community 19"
Cohesion: 0.25
Nodes (1): RoadmapService

### Community 21 - "Community 21"
Cohesion: 0.29
Nodes (1): ExamQuestionRepository

### Community 22 - "Community 22"
Cohesion: 0.29
Nodes (1): RoadmapRepository

### Community 23 - "Community 23"
Cohesion: 0.38
Nodes (3): handleDrop(), handleFile(), handleFileInput()

### Community 24 - "Community 24"
Cohesion: 0.33
Nodes (1): CourseCatalogRepository

### Community 25 - "Community 25"
Cohesion: 0.33
Nodes (1): EnrollmentRepository

### Community 26 - "Community 26"
Cohesion: 0.33
Nodes (1): ExamResponseRepository

### Community 27 - "Community 27"
Cohesion: 0.53
Nodes (1): ProgressService

### Community 28 - "Community 28"
Cohesion: 0.33
Nodes (1): RoadmapCatalogRepository

### Community 31 - "Community 31"
Cohesion: 0.4
Nodes (2): getPgClient(), handleNotification()

### Community 32 - "Community 32"
Cohesion: 0.7
Nodes (4): handleActivityToProgress(), handleCdcSync(), handleScoreToReadiness(), handleUserToSnapshot()

### Community 33 - "Community 33"
Cohesion: 0.4
Nodes (4): AppError, AuthError, NotFoundError, ValidationError

### Community 34 - "Community 34"
Cohesion: 0.4
Nodes (1): AssignmentRepository

### Community 35 - "Community 35"
Cohesion: 0.4
Nodes (1): BatchAccessRepository

### Community 36 - "Community 36"
Cohesion: 0.4
Nodes (1): EnrollmentService

### Community 37 - "Community 37"
Cohesion: 0.4
Nodes (1): ExamDefinitionRepository

### Community 39 - "Community 39"
Cohesion: 0.4
Nodes (1): QuizDefinitionRepository

### Community 42 - "Community 42"
Cohesion: 0.5
Nodes (1): AssignmentService

### Community 43 - "Community 43"
Cohesion: 0.5
Nodes (1): CertificateRepository

### Community 44 - "Community 44"
Cohesion: 0.5
Nodes (1): CertificateService

### Community 45 - "Community 45"
Cohesion: 0.5
Nodes (1): QuizAttemptDetailRepository

### Community 46 - "Community 46"
Cohesion: 0.5
Nodes (1): QuizAttemptRepository

### Community 47 - "Community 47"
Cohesion: 0.5
Nodes (1): QuizService

### Community 48 - "Community 48"
Cohesion: 0.5
Nodes (1): ReviewRepository

### Community 49 - "Community 49"
Cohesion: 0.5
Nodes (1): ReviewService

### Community 56 - "Community 56"
Cohesion: 0.67
Nodes (1): parseEnv()

### Community 59 - "Community 59"
Cohesion: 0.67
Nodes (1): errorHandler()

### Community 60 - "Community 60"
Cohesion: 0.67
Nodes (1): requestIdMiddleware()

### Community 65 - "Community 65"
Cohesion: 1.0
Nodes (2): daysUntil(), deadlineLabel()

### Community 78 - "Community 78"
Cohesion: 1.0
Nodes (1): AppEmitter

## Knowledge Gaps
- **5 isolated node(s):** `AppError`, `NotFoundError`, `ValidationError`, `AuthError`, `AppEmitter`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 7`** (17 nodes): `ExamService`, `.addSection()`, `.computeScore()`, `.createExam()`, `.createQuestion()`, `.getExam()`, `.getResult()`, `.grantBatchAccess()`, `.ingestProctoringEvent()`, `.listExams()`, `.listProctoringEvents()`, `.listQuestions()`, `.saveIncrementalResponse()`, `.startAttempt()`, `.submitAttempt()`, `.updateExam()`, `exam.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 10`** (12 nodes): `ExamAttemptRepository`, `.createAttempt()`, `.createScore()`, `.findAttemptById()`, `.findManyAttempts()`, `.findRankings()`, `.getAttemptCount()`, `.getScoreByAttempt()`, `.incrementViolation()`, `.updateAttempt()`, `.upsertRanking()`, `exam-attempt.repository.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 11`** (11 nodes): `CourseService`, `.addLecture()`, `.addSection()`, `.createCourse()`, `.deleteCourse()`, `.getCourse()`, `.grantBatchAccess()`, `.replaceSections()`, `.searchCourses()`, `.updateCourse()`, `course.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (11 nodes): `ExamRepository`, `.create()`, `.createSection()`, `.findById()`, `.findMany()`, `.grantBatchAccess()`, `.hasBatchAccess()`, `.revokeBatchAccess()`, `.softDelete()`, `.update()`, `exam.repository.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (9 nodes): `CourseRepository`, `.addLectureToSection()`, `.addSection()`, `.createCourse()`, `.deleteCourse()`, `.getCourseById()`, `.searchCourses()`, `.updateCourse()`, `course.repository.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (8 nodes): `AiService`, `.forwardToExternalAi()`, `.generateContent()`, `.getChatHistory()`, `.logAssistantResponse()`, `.logUserMessage()`, `.updateContentStatus()`, `ai.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (8 nodes): `ProgressRepository`, `.getProgressSummary()`, `.getStudentStreak()`, `.markLectureComplete()`, `.updateStudentStreak()`, `.upsertProgressSummary()`, `.upsertStudentStreak()`, `progress.repository.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (8 nodes): `RoadmapService`, `.addStage()`, `.createRoadmap()`, `.deleteRoadmap()`, `.getRoadmap()`, `.searchRoadmaps()`, `.updateRoadmap()`, `roadmap.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (7 nodes): `ExamQuestionRepository`, `.archive()`, `.create()`, `.findById()`, `.findMany()`, `.update()`, `exam-question.repository.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (7 nodes): `RoadmapRepository`, `.addStage()`, `.createRoadmap()`, `.deleteRoadmap()`, `.getRoadmapById()`, `.updateRoadmap()`, `roadmap.repository.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (6 nodes): `CourseCatalogRepository`, `.deleteCatalog()`, `.getCatalogById()`, `.searchCourses()`, `.upsertCatalog()`, `course-catalog.repository.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (6 nodes): `EnrollmentRepository`, `.checkBatchAccess()`, `.enrollStudent()`, `.getEnrollment()`, `.getStudentEnrollments()`, `enrollment.repository.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (6 nodes): `ExamResponseRepository`, `.create()`, `.finalize()`, `.findByAttemptId()`, `.saveIncremental()`, `exam-response.repository.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (6 nodes): `ProgressService`, `.getProgressSummary()`, `.getStudentStreak()`, `.markLectureComplete()`, `.updateStreak()`, `progress.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (6 nodes): `RoadmapCatalogRepository`, `.deleteCatalog()`, `.getCatalogById()`, `.searchRoadmaps()`, `.upsertCatalog()`, `roadmap-catalog.repository.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (5 nodes): `getPgClient()`, `handleNotification()`, `postgres.js`, `postgres.ts`, `notification.job.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (5 nodes): `AssignmentRepository`, `.getSubmissionById()`, `.gradeSubmission()`, `.saveSubmission()`, `assignment.repository.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (5 nodes): `BatchAccessRepository`, `.checkAccess()`, `.grantAccess()`, `.revokeAccess()`, `batch-access.repository.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (5 nodes): `EnrollmentService`, `.checkAccess()`, `.enroll()`, `.getMyEnrollments()`, `enrollment.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (5 nodes): `ExamDefinitionRepository`, `.create()`, `.findByPgExamId()`, `.update()`, `exam-definition.repository.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (5 nodes): `QuizDefinitionRepository`, `.create()`, `.findByCourseAndAttachment()`, `.findById()`, `quiz-definition.repository.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (4 nodes): `AssignmentService`, `.gradeSubmission()`, `.submitAssignment()`, `assignment.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (4 nodes): `CertificateRepository`, `.issueCertificate()`, `.verifyCertificate()`, `certificate.repository.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (4 nodes): `CertificateService`, `.generateCertificate()`, `.verify()`, `certificate.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (4 nodes): `QuizAttemptDetailRepository`, `.getSummary()`, `.saveDetail()`, `quiz-attempt-detail.repository.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (4 nodes): `QuizAttemptRepository`, `.getLatestAttemptNumber()`, `.saveAttempt()`, `quiz-attempt.repository.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (4 nodes): `QuizService`, `.createDefinition()`, `.submitAttempt()`, `quiz.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (4 nodes): `ReviewRepository`, `.getReviewsByCourseId()`, `.saveReview()`, `review.repository.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (4 nodes): `ReviewService`, `.addReview()`, `.getReviews()`, `review.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (3 nodes): `parseEnv()`, `env.js`, `env.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (3 nodes): `errorHandler()`, `errorHandler.js`, `errorHandler.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (3 nodes): `requestIdMiddleware()`, `requestId.js`, `requestId.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 65`** (3 nodes): `daysUntil()`, `deadlineLabel()`, `Dashboard.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 78`** (2 nodes): `AppEmitter`, `events.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `successResponse()` connect `Community 0` to `Community 5`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `listBatches()` connect `Community 5` to `Community 0`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **Are the 101 inferred relationships involving `successResponse()` (e.g. with `.submit()` and `.grade()`) actually correct?**
  _`successResponse()` has 101 INFERRED edges - model-reasoned connections that need verification._
- **Are the 9 inferred relationships involving `startServer()` (e.g. with `connectMongo()` and `seedAdmin()`) actually correct?**
  _`startServer()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Are the 9 inferred relationships involving `logAction()` (e.g. with `register()` and `resetPassword()`) actually correct?**
  _`logAction()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **What connects `AppError`, `NotFoundError`, `ValidationError` to the rest of the system?**
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._
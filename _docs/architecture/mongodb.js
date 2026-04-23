// ============================================================
// UGSkill Platform — MongoDB Schema (Flexible / Event Layer)
// ============================================================
// Architecture: PostgreSQL is source of truth for relational data.
// MongoDB stores polymorphic content, event streams, and nested docs.
// Cross-reference convention:
//   pg_user_id     → PostgreSQL UUID stored in MongoDB as STRING
//   mongo_*_id     → MongoDB ObjectId stored in PostgreSQL as TEXT


// ╔══════════════════════════════════════════════════════════╗
// ║  MODULE 1 — LMS COLLECTIONS                             ║
// ╚══════════════════════════════════════════════════════════╝

// ── courses ─────────────────────────────────────────────────
// Full content tree. Sections & lectures are embedded (always read together).
db.createCollection("courses", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["title", "status", "pg_creator_id", "schema_version"],
      properties: {
        title:            { bsonType: "string" },
        status:           { enum: ["draft", "review", "published", "archived"] },
        pg_creator_id:    { bsonType: "string" },   // PostgreSQL UUID
        schema_version:   { bsonType: "int" }
      }
    }
  }
});

// Sample document:
{
  _id: ObjectId("..."),
  schema_version: 1,
  title: "React Masterclass",
  description: "...",
  pg_creator_id: "uuid-...",           // PostgreSQL users.id
  category: "Frontend Development",
  sub_category: "React",
  difficulty: "intermediate",
  language: "english",
  thumbnail_url: "...",
  is_free: false,
  price: 999,
  tags: ["react", "hooks", "typescript"],
  status: "published",

  sections: [
    {
      _id: ObjectId("..."),
      title: "Getting Started",
      order: 1,
      description: "...",
      lectures: [
        {
          _id: ObjectId("..."),
          title: "What is React?",
          order: 1,
          type: "video",                // video | document | external_link | text
          is_free_preview: true,
          difficulty: "beginner",
          duration_secs: 720,
          video_url: "https://cdn...",
          hls_manifest_url: "...",
          transcript_url: "...",
          resources: [
            { type: "pdf", title: "React Cheatsheet", url: "..." },
            { type: "link", title: "React Docs", url: "https://react.dev" }
          ],
          topic_tags: ["jsx", "components"],
          ai_summary: "React is a JavaScript library for building UIs...",
          key_takeaways: ["Virtual DOM", "Component-based", "Unidirectional data flow"]
        }
      ]
    }
  ],

  // Metadata synced back to PostgreSQL course_catalog
  avg_rating: 4.7,
  total_ratings: 283,
  enrollment_count: 1240,
  lecture_count: 48,
  total_duration_secs: 52740,

  version: 3,
  version_history: [
    { version: 2, changed_by: "uuid-...", changed_at: ISODate("..."), note: "Added section 3" }
  ],

  created_at: ISODate("..."),
  updated_at: ISODate("...")
}

db.courses.createIndex({ pg_creator_id: 1, status: 1 });
db.courses.createIndex({ status: 1, category: 1 });
db.courses.createIndex({ title: "text", description: "text" });
db.courses.createIndex({ tags: 1 });


// ── roadmaps ────────────────────────────────────────────────
{
  _id: ObjectId("..."),
  schema_version: 1,
  title: "Full Stack Developer Path",
  description: "...",
  goal_statement: "Become a job-ready full stack developer",
  target_role: "Full Stack Developer",
  pg_creator_id: "uuid-...",
  status: "published",
  is_restricted: false,
  difficulty: "intermediate",
  thumbnail_url: "...",

  stages: [
    {
      _id: ObjectId("..."),
      order: 1,
      name: "Fundamentals",
      description: "HTML, CSS, and JavaScript basics",
      prerequisite_stage_ids: [],
      sequence_type: "linear",           // linear | flexible
      courses: [
        { pg_course_id: "text-mongo-id", is_required: true, order: 1 },
        { pg_course_id: "text-mongo-id", is_required: false, order: 2 }
      ]
    },
    {
      order: 2,
      name: "Frontend",
      prerequisite_stage_ids: [ObjectId("...")]
    }
  ],

  created_at: ISODate("..."),
  updated_at: ISODate("...")
}

db.roadmaps.createIndex({ pg_creator_id: 1, status: 1 });
db.roadmaps.createIndex({ title: "text" });


// ── quiz_definitions ─────────────────────────────────────────
// Referenced by course sections/lectures. Embedded questions (count < 100).
{
  _id: ObjectId("..."),
  schema_version: 1,
  pg_course_id: "text-mongo-id",
  pg_creator_id: "uuid-...",
  title: "React Hooks Quiz",
  attach_to: { type: "lecture", id: ObjectId("...") },
  config: {
    attempt_limit: 3,
    pass_percent: 70,
    shuffle_questions: true,
    show_answers_after: "submission"     // submission | pass | never
  },
  questions: [
    {
      _id: ObjectId("..."),
      type: "mcq_single",
      stem: "Which hook is used for side effects?",
      options: [
        { key: "A", text: "useState",   is_correct: false },
        { key: "B", text: "useEffect",  is_correct: true  },
        { key: "C", text: "useContext", is_correct: false },
        { key: "D", text: "useRef",     is_correct: false }
      ],
      explanation: "useEffect runs after render and handles side effects...",
      topic_tag: "hooks",
      marks: 1
    }
  ],
  created_at: ISODate("..."),
  updated_at: ISODate("...")
}

db.quiz_definitions.createIndex({ pg_course_id: 1 });
db.quiz_definitions.createIndex({ "attach_to.id": 1 });


// ── quiz_attempt_details ─────────────────────────────────────
// Detail of each attempt (summary in PostgreSQL quiz_attempts)
{
  _id: ObjectId("..."),
  pg_attempt_id: "uuid-...",             // PostgreSQL quiz_attempts.id
  pg_student_id: "uuid-...",
  quiz_id: ObjectId("..."),
  responses: [
    {
      question_id: ObjectId("..."),
      selected_keys: ["B"],
      is_correct: true,
      time_taken_secs: 22
    }
  ],
  topic_accuracy: { hooks: 0.85, state: 0.60 },
  created_at: ISODate("...")
}

db.quiz_attempt_details.createIndex({ pg_student_id: 1, quiz_id: 1 });
db.quiz_attempt_details.createIndex({ pg_attempt_id: 1 }, { unique: true });


// ── ai_chat_sessions ─────────────────────────────────────────
// AI Tutor conversation history. Referenced by context.
{
  _id: ObjectId("..."),
  schema_version: 1,
  pg_student_id: "uuid-...",
  context: {
    course_id: "text-mongo-id",
    lecture_id: "text-mongo-id",
    lecture_timestamp_secs: 432
  },
  messages: [
    { role: "user",      content: "What is a closure?", timestamp: ISODate("...") },
    { role: "assistant", content: "A closure is...",    timestamp: ISODate("..."),
      referenced_timestamps: [432, 601] }
  ],
  session_type: "lecture_qa",            // lecture_qa | doubt_solving | semantic_search
  created_at: ISODate("..."),
  updated_at: ISODate("...")
}
// 16MB guard: if messages array could exceed limit, use bucket pattern
db.ai_chat_sessions.createIndex({ pg_student_id: 1, "context.course_id": 1 });
db.ai_chat_sessions.createIndex({ created_at: 1 }, { expireAfterSeconds: 31536000 }); // TTL 12 months


// ── activity_events ──────────────────────────────────────────
// High-write event stream. TTL 12 months.
{
  _id: ObjectId("..."),
  pg_student_id: "uuid-...",
  event_type: "lecture_watch",           // lecture_watch | quiz_submit | lecture_complete | login | etc.
  entity_type: "lecture",
  entity_id: "text-mongo-id",
  course_id: "text-mongo-id",
  metadata: {
    watch_secs: 180,
    playback_position: 720
  },
  session_id: "uuid-...",
  created_at: ISODate("...")
}

db.activity_events.createIndex({ pg_student_id: 1, created_at: -1 });
db.activity_events.createIndex({ created_at: 1 }, { expireAfterSeconds: 31536000 }); // TTL 12 months
sh.shardCollection("ugskill.activity_events", { pg_student_id: "hashed" });


// ╔══════════════════════════════════════════════════════════╗
// ║  MODULE 2 — PLACEMENT COLLECTIONS                       ║
// ╚══════════════════════════════════════════════════════════╝

// ── question_bank ─────────────────────────────────────────────
// Polymorphic: aptitude | coding | technical | hr | gd_topic
{
  _id: ObjectId("..."),
  schema_version: 1,
  type: "coding",                        // aptitude | coding | technical | hr | gd_topic
  status: "published",                   // draft | review | published | archived

  // Common fields
  difficulty: "medium",                  // easy | medium | hard | very_hard
  subject: "Data Structures",
  topic: "Hash Maps",
  tags: ["two-sum", "array"],
  company_tags: ["Google", "Amazon"],
  source: { type: "original", year: 2024 },
  bloom_level: "apply",
  estimated_solve_secs: 1800,
  pg_created_by: "uuid-...",
  stats: { times_used: 42, avg_accuracy: 0.61 },

  // Coding-specific
  stem: "Return two indices that add to the target.",
  constraints: "1 ≤ n ≤ 10⁵",
  sample_io: [{ input: "[2,7,11], target=9", output: "[0,1]" }],
  hidden_test_cases: [
    { input: "[3,2,4], target=6", output: "[1,2]", is_edge: false }
  ],
  supported_languages: ["python", "java", "cpp", "javascript"],
  time_limit_ms: 2000,
  memory_limit_mb: 256,
  reference_solution: { language: "python", code: "...", time_complexity: "O(n)" },

  // For HR type
  // stem: "Tell me about yourself.",
  // ideal_answer_framework: "STAR method...",

  version: 2,
  version_history: [],
  created_at: ISODate("..."),
  updated_at: ISODate("...")
}

db.question_bank.createIndex({ type: 1, difficulty: 1, status: 1 });
db.question_bank.createIndex({ company_tags: 1, type: 1 });
db.question_bank.createIndex({ subject: 1, topic: 1 }, { partialFilterExpression: { status: "published" } });
db.question_bank.createIndex({ stem: "text" });


// ── interview_flows ───────────────────────────────────────────
// Variable-structure round configs. Deeply nested → MongoDB.
{
  _id: ObjectId("..."),
  schema_version: 1,
  pg_company_id: "uuid-...",
  name: "Infosys SDE-1 2026",
  target_roles: ["SDE-1", "Junior Engineer"],
  status: "published",
  version: 2,
  dependency_mode: "sequential",         // sequential | parallel

  rounds: [
    {
      order: 1,
      type: "aptitude",
      name: "Aptitude Round",
      pass_cutoff_percent: 60,
      config: {
        sections: [
          { name: "Quantitative", count: 10, time_minutes: 15 },
          { name: "Logical",      count: 10, time_minutes: 15 }
        ],
        negative_marking: -0.25,
        shuffle: true,
        proctoring_enabled: true
      }
    },
    {
      order: 2,
      type: "coding",
      name: "Coding Round",
      pass_cutoff_percent: 50,
      config: {
        problem_count: 2,
        difficulty_mix: { easy: 0, medium: 1, hard: 1 },
        supported_languages: ["python", "java", "cpp"],
        time_limit_minutes: 60,
        execution_sandbox: "docker"
      }
    },
    {
      order: 3,
      type: "hr",
      name: "HR Interview",
      config: {
        mode: "ai_mock",
        question_count: 8,
        follow_up_depth: 1,
        voice_enabled: true,
        duration_minutes: 30,
        evaluation_criteria: ["communication", "confidence", "cultural_fit"]
      }
    }
  ],

  active_version_pinned: true,
  pg_created_by: "uuid-...",
  created_at: ISODate("..."),
  updated_at: ISODate("...")
}

db.interview_flows.createIndex({ pg_company_id: 1, status: 1 });


// ── company_profiles ──────────────────────────────────────────
// Extended company info: skills, patterns, GD topics. Referenced by companies table.
{
  _id: ObjectId("..."),
  pg_company_id: "uuid-...",
  schema_version: 1,
  about: "...",
  open_roles: ["SDE-1", "Business Analyst"],
  ctc_packages: [{ role: "SDE-1", ctc_lpa: 8.5, take_home: 65000 }],
  selection_process_overview: "...",
  past_hiring_stats: { year: 2025, selected: 42, applied: 1200 },

  required_skills: [
    { skill: "DSA", weight: 0.4, linked_topics: ["Arrays", "DP", "Graphs"] },
    { skill: "SQL", weight: 0.2 }
  ],

  interview_patterns: [
    {
      season: "2025 Off-Campus",
      rounds: ["Aptitude", "Coding (2 Qs)", "HR"],
      key_topics: ["Arrays", "String Manipulation", "OOPS"],
      notes: "Strong focus on time complexity explanation",
      source: "Alumni Report"
    }
  ],

  gd_topics_history: [
    { topic: "AI in education", year: 2025, difficulty: "medium" }
  ],

  created_at: ISODate("..."),
  updated_at: ISODate("...")
}

db.company_profiles.createIndex({ pg_company_id: 1 }, { unique: true });
db.company_profiles.createIndex({ "required_skills.skill": 1 });


// ── mock_interview_attempts ───────────────────────────────────
// Detailed per-question data for mock interviews.
{
  _id: ObjectId("..."),
  pg_session_id: "uuid-...",             // PostgreSQL placement_sessions.id
  pg_student_id: "uuid-...",
  pg_company_id: "uuid-...",
  flow_id: ObjectId("..."),
  round_number: 2,
  session_type: "mock_interview",
  status: "completed",

  responses: [
    {
      question_id: ObjectId("..."),
      question_type: "coding",
      answer_text: "def twoSum(nums, target): ...",
      answer_code: "...",
      language: "python",
      time_taken_secs: 840,
      ai_score: {
        semantic_score: 0.82,
        code_correctness: 0.90,
        code_quality: 0.75,
        communication: 0.80,
        confidence: 0.70
      },
      ai_feedback: "Good approach using a hash map. Consider edge cases...",
      test_case_results: [
        { case_id: "tc1", passed: true, runtime_ms: 12 },
        { case_id: "tc2", passed: false, expected: "[1,2]", got: "[0,1]" }
      ],
      evaluator_note: null
    }
  ],

  aggregate_scores: {
    technical: 82,
    communication: 76,
    confidence: 71,
    problem_solving: 79,
    overall: 77
  },

  proctoring_flags: [
    { event_type: "face_absent", timestamp: ISODate("..."), severity: "medium" }
  ],

  recording_url: "https://cdn.../session.mp4",
  transcript_url: "https://cdn.../transcript.json",

  created_at: ISODate("..."),
  updated_at: ISODate("...")
}

db.mock_interview_attempts.createIndex({ pg_student_id: 1, created_at: -1 });
db.mock_interview_attempts.createIndex({ pg_session_id: 1 }, { unique: true });


// ── proctoring_events ─────────────────────────────────────────
// High-write event stream. TTL 90 days. Shared by Placement + Exam modules.
{
  _id: ObjectId("..."),
  module: "placement",                   // placement | exam
  session_id: "uuid-...",                // placement_sessions.id or exam_attempts.id
  pg_student_id: "uuid-...",
  event_type: "face_absent",             // tab_switch | face_absent | multi_face | phone_detected | audio_detected | etc.
  severity: "high",                      // low | medium | high | critical
  confidence: 0.94,
  evidence_snapshot_url: "...",
  metadata: { duration_secs: 4 },
  timestamp: ISODate("..."),
  created_at: ISODate("...")
}

db.proctoring_events.createIndex({ session_id: 1, created_at: 1 });
db.proctoring_events.createIndex({ created_at: 1 }, { expireAfterSeconds: 7776000 }); // TTL 90 days
sh.shardCollection("ugskill.proctoring_events", { session_id: "hashed" });


// ── gd_recordings ─────────────────────────────────────────────
{
  _id: ObjectId("..."),
  pg_gd_session_id: "uuid-...",
  schema_version: 1,
  video_url: "...",
  duration_secs: 1800,
  participant_count: 6,
  transcript: [
    {
      pg_student_id: "uuid-...",
      speaker_label: "Speaker 1",
      text: "I believe AI in education can...",
      start_secs: 12.4,
      end_secs: 28.7
    }
  ],
  ai_analysis: {
    per_participant: [
      {
        pg_student_id: "uuid-...",
        speaking_time_secs: 280,
        turn_count: 8,
        contribution_score: 78,
        clarity_score: 82,
        leadership_signals: 3
      }
    ]
  },
  created_at: ISODate("...")
}

db.gd_recordings.createIndex({ pg_gd_session_id: 1 }, { unique: true });


// ╔══════════════════════════════════════════════════════════╗
// ║  MODULE 3 — EXAM COLLECTIONS                            ║
// ╚══════════════════════════════════════════════════════════╝

// ── exam_question_bank ───────────────────────────────────────
// Polymorphic: MCQ | coding | descriptive | numerical | fill_blank | matching
{
  _id: ObjectId("..."),
  schema_version: 1,
  type: "mcq_single",                    // mcq_single | mcq_multi | coding | descriptive | numerical | fill_blank | matching
  status: "published",                   // draft | review | published | archived
  stem: "What is the time complexity of binary search?",
  difficulty: "easy",
  subject: "Data Structures",
  topic: "Searching Algorithms",
  tags: ["binary-search", "time-complexity"],
  source_type: "original",               // original | pyq
  source_exam: null,                     // GATE | JEE | CAT etc.
  source_year: null,
  pg_created_by: "uuid-...",
  bloom_level: "understand",
  estimated_time_secs: 60,
  marks: 2,
  negative_marks: 0.67,
  media_attachments: [],

  // MCQ specific
  options: [
    { key: "A", text: "O(n)",      is_correct: false },
    { key: "B", text: "O(log n)",  is_correct: true  },
    { key: "C", text: "O(n²)",     is_correct: false },
    { key: "D", text: "O(1)",      is_correct: false }
  ],
  explanation: "Binary search halves the search space each iteration...",

  // Coding specific (when type = "coding")
  // stem, constraints, sample_io[], hidden_test_cases[], supported_languages[], etc.

  // Descriptive specific (when type = "descriptive")
  // model_answer, word_limit, evaluation_rubric{}, grading_mode

  // Numerical specific (when type = "numerical")
  // correct_value, tolerance, unit

  stats: { times_used: 1402, avg_accuracy: 0.73 },
  version: 1,
  version_history: [],
  created_at: ISODate("..."),
  updated_at: ISODate("...")
}

db.exam_question_bank.createIndex({ type: 1, difficulty: 1, status: 1 });
db.exam_question_bank.createIndex({ subject: 1, topic: 1 }, { partialFilterExpression: { status: "published" } });
db.exam_question_bank.createIndex({ stem: "text", explanation: "text" });
db.exam_question_bank.createIndex({ tags: 1 });
db.exam_question_bank.createIndex({ source_exam: 1, source_year: -1 });


// ── exam_definitions ──────────────────────────────────────────
// Full exam structure with question pools. Referenced by PostgreSQL exams.mongo_definition_id
{
  _id: ObjectId("..."),
  pg_exam_id: "uuid-...",
  schema_version: 1,
  sections: [
    {
      pg_section_id: "uuid-...",
      name: "Physics",
      order: 1,
      pool_config: {
        rules: [
          { subject: "Physics", topic: "Mechanics", difficulty: "medium", count: 5 },
          { subject: "Physics", topic: "Optics",    difficulty: "easy",   count: 3 }
        ],
        fallback_strategy: "relax_topic"   // if pool insufficient
      },
      selected_question_ids: [ObjectId("...")]  // deterministic selection per attempt generation
    }
  ],
  template_notes: "JEE Mains pattern — 90 questions, 3 hours",
  created_at: ISODate("..."),
  updated_at: ISODate("...")
}

db.exam_definitions.createIndex({ pg_exam_id: 1 }, { unique: true });


// ── exam_responses ────────────────────────────────────────────
// Per-question responses for each attempt.
{
  _id: ObjectId("..."),
  pg_attempt_id: "uuid-...",             // PostgreSQL exam_attempts.id
  pg_student_id: "uuid-...",
  pg_exam_id: "uuid-...",
  schema_version: 1,

  // Question order shown to this student (randomized)
  question_sequence: [ObjectId("..."), ObjectId("...")],

  responses: [
    {
      question_id: ObjectId("..."),
      question_type: "mcq_single",
      selected_keys: ["B"],
      is_marked_for_review: false,
      is_correct: true,
      marks_awarded: 2,
      time_taken_secs: 38,
      visited_at: ISODate("..."),
      answered_at: ISODate("...")
    },
    {
      question_id: ObjectId("..."),
      question_type: "coding",
      code: "def solve(n): ...",
      language: "python",
      test_results: [
        { case_id: "tc1", passed: true, runtime_ms: 8, memory_mb: 12 }
      ],
      code_quality_score: 0.78
    }
  ],

  topic_summary: [
    { topic: "Mechanics", correct: 4, total: 5, accuracy: 0.80 }
  ],

  submitted_at: ISODate("..."),
  created_at: ISODate("...")
}

db.exam_responses.createIndex({ pg_student_id: 1, pg_exam_id: 1 });
db.exam_responses.createIndex({ pg_attempt_id: 1 }, { unique: true });


// ── exam_proctoring_events ────────────────────────────────────
// Same structure as proctoring_events but module = "exam".
// Can use the shared proctoring_events collection with module discriminator,
// or a separate collection for independent TTL/shard config.
db.exam_proctoring_events.createIndex({ session_id: 1, timestamp: 1 });
db.exam_proctoring_events.createIndex({ created_at: 1 }, { expireAfterSeconds: 31536000 }); // TTL 12 months
sh.shardCollection("ugskill.exam_proctoring_events", { session_id: "hashed" });


// ── user_snapshots ────────────────────────────────────────────
// Materialized from PostgreSQL for fast AI context reads.
{
  _id: ObjectId("..."),
  pg_user_id: "uuid-...",
  full_name: "Rohit Sharma",
  institution: "IIT Indore",
  branch: "CSE",
  cgpa: 8.4,
  graduation_year: 2026,
  roles: ["student"],
  skill_profile: {
    dsa: 78,
    sql: 65,
    system_design: 42,
    communication: 81
  },
  enrolled_course_ids: ["text-mongo-id"],
  target_companies: ["uuid-...", "uuid-..."],
  synced_at: ISODate("...")
}

db.user_snapshots.createIndex({ pg_user_id: 1 }, { unique: true });


// ── ai_generated_content ─────────────────────────────────────
// AI outputs: feedback, recommendations, quiz generation results, outlines.
{
  _id: ObjectId("..."),
  schema_version: 1,
  content_type: "quiz_generation",       // quiz_generation | course_outline | lecture_summary | feedback | recommendation
  generator_model: "claude-sonnet-4-6",
  pg_created_by: "uuid-...",
  input_context: { course_id: "...", lecture_id: "...", prompt: "Generate 5 MCQs on React hooks" },
  output: { questions: [] },
  review_status: "pending",              // pending | approved | rejected
  reviewed_by: null,
  created_at: ISODate("...")
}

db.ai_generated_content.createIndex({ content_type: 1, review_status: 1 });
db.ai_generated_content.createIndex({ pg_created_by: 1, created_at: -1 });
db.ai_generated_content.createIndex({ created_at: 1 }, { expireAfterSeconds: 7776000 }); // TTL 90 days (non-approved)

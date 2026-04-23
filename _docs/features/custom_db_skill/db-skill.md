#ignore 

---
ignore skill already use no need to read it

---
name: "ugskill-database-architect"
description: "Use when the user asks to design database schemas, plan data migrations, optimize queries, choose between SQL and NoSQL, model data relationships, design MongoDB document schemas, plan hybrid PostgreSQL+MongoDB architectures, or model UGSkill platform entities (LMS, Placement, Exam modules)."
---

# UGSkill Hybrid Database Architect — POWERFUL Tier Skill

## Overview

A comprehensive hybrid database architecture skill purpose-built for the **UGSkill platform** — an education-tech system spanning LMS (Learning Management), Placement (Interview & Readiness), and Exam (Test & Assessment) modules. This skill provides expert-level guidance for designing, optimizing, and operating a **PostgreSQL + MongoDB hybrid** database layer.

**Architecture Philosophy:** PostgreSQL is the **source of truth** for relational, transactional, and analytical data. MongoDB is the **flexible store** for polymorphic content, event streams, and deeply nested documents. Both systems are synchronized via Change Data Capture and event-driven patterns.

---

## PART 1 — POSTGRESQL (Relational / Source of Truth)

### Core Competencies

#### Schema Design & Analysis
- **Normalization Analysis**: Automated detection of normalization levels (1NF through BCNF)
- **Denormalization Strategy**: Smart recommendations for performance optimization
- **Data Type Optimization**: Identification of inappropriate types and size issues
- **Constraint Analysis**: Missing foreign keys, unique constraints, and null checks
- **Naming Convention Validation**: Consistent table and column naming patterns
- **ERD Generation**: Automatic Mermaid diagram creation from DDL

#### Index Optimization
- **Index Gap Analysis**: Identification of missing indexes on foreign keys and query patterns
- **Composite Index Strategy**: Optimal column ordering for multi-column indexes
- **Index Redundancy Detection**: Elimination of overlapping and unused indexes
- **Performance Impact Modeling**: Selectivity estimation and query cost analysis
- **Index Type Selection**: B-tree, hash, partial, covering, and specialized indexes

#### Migration Management
- **Zero-Downtime Migrations**: Expand-contract pattern implementation
- **Schema Evolution**: Safe column additions, deletions, and type changes
- **Data Migration Scripts**: Automated data transformation and validation
- **Rollback Strategy**: Complete reversal capabilities with validation
- **Execution Planning**: Ordered migration steps with dependency resolution

### PostgreSQL Best Practices

#### Schema Design
1. **Use meaningful names**: `snake_case` for tables and columns. Table names are plural (`users`, `enrollments`).
2. **Choose appropriate data types**: Use `UUID` for primary keys, `TIMESTAMPTZ` for all timestamps, `TEXT` over `VARCHAR` when no max is needed, `JSONB` for semi-structured metadata.
3. **Define proper constraints**: Foreign keys with `ON DELETE` actions, `CHECK` constraints for enums and ranges, `UNIQUE` indexes for natural keys.
4. **Consider future growth**: Plan for partitioning large tables (enrollments, progress_records, audit_logs) from the start.
5. **Document relationships**: Clear foreign key relationships and business rules via comments.
6. **Always add `created_at` and `updated_at`**: Every table gets `created_at TIMESTAMPTZ DEFAULT NOW()` and `updated_at TIMESTAMPTZ DEFAULT NOW()` with a trigger.
7. **Soft delete by default**: Add `deleted_at TIMESTAMPTZ NULL` instead of hard-deleting rows.
8. **Use enums via CHECK constraints or ENUM types**: For status fields (`draft`, `published`, `archived`), role fields (`student`, `creator`, `admin`).

#### PostgreSQL Indexing Strategies

| Index Type | Use Case | Example |
|------------|----------|---------|
| **B-tree** (default) | Equality, range, ORDER BY | `CREATE INDEX idx_users_email ON users(email);` |
| **GIN** | Full-text search, JSONB, arrays | `CREATE INDEX idx_docs_body ON docs USING gin(to_tsvector('english', body));` |
| **GiST** | Geometry, range types, nearest-neighbor | `CREATE INDEX idx_locations ON places USING gist(coords);` |
| **Partial** | Subset of rows (reduce size) | `CREATE INDEX idx_active ON users(email) WHERE active = true;` |
| **Covering** | Index-only scans | `CREATE INDEX idx_cov ON orders(customer_id) INCLUDE (total, created_at);` |
| **BRIN** | Large append-only tables (time-series) | `CREATE INDEX idx_logs_ts ON audit_logs USING brin(created_at);` |

### SQL Query Patterns

#### SELECT with JOINs

```sql
-- INNER JOIN: only matching rows
SELECT o.id, c.name, o.total
FROM orders o
INNER JOIN customers c ON c.id = o.customer_id;

-- LEFT JOIN: all left rows, NULLs for non-matches
SELECT c.name, COUNT(o.id) AS order_count
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.name;

-- Self-join: hierarchical data (employees/managers)
SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON m.id = e.manager_id;
```

#### Common Table Expressions (CTEs)

```sql
-- Recursive CTE for org chart or roadmap prerequisite chains
WITH RECURSIVE org AS (
  SELECT id, name, manager_id, 1 AS depth
  FROM employees WHERE manager_id IS NULL
  UNION ALL
  SELECT e.id, e.name, e.manager_id, o.depth + 1
  FROM employees e INNER JOIN org o ON o.id = e.manager_id
)
SELECT * FROM org ORDER BY depth, name;
```

#### Window Functions

```sql
-- ROW_NUMBER for pagination / dedup
SELECT *, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at DESC) AS rn
FROM orders;

-- RANK for leaderboards with gaps, DENSE_RANK without gaps
SELECT name, score, RANK() OVER (ORDER BY score DESC) AS rank FROM leaderboard;

-- Percentile calculation for exam scores
SELECT student_id, score,
  PERCENT_RANK() OVER (ORDER BY score) AS percentile
FROM exam_attempts WHERE exam_id = $1;

-- LAG/LEAD for comparing adjacent rows (score trends)
SELECT attempt_date, score,
  score - LAG(score) OVER (ORDER BY attempt_date) AS score_change
FROM exam_attempts WHERE student_id = $1;
```

#### Aggregation Patterns

```sql
-- FILTER clause (PostgreSQL) for conditional aggregation
SELECT
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE status = 'active') AS active,
  AVG(score) FILTER (WHERE score > 0) AS avg_passing
FROM exam_attempts;

-- GROUPING SETS for multi-level rollups (batch + topic analytics)
SELECT batch_id, topic, AVG(accuracy) AS avg_accuracy
FROM topic_scores
GROUP BY GROUPING SETS ((batch_id, topic), (batch_id), ());
```

### Migration Patterns

#### Up/Down Migration Scripts

Every migration must have a reversible counterpart. Name files with a timestamp prefix:

```
migrations/
├── 20260101_000001_create_users.up.sql
├── 20260101_000001_create_users.down.sql
├── 20260115_000002_add_users_email_index.up.sql
└── 20260115_000002_add_users_email_index.down.sql
```

#### Zero-Downtime Migrations (Expand/Contract)

1. **Expand** — add the new column/table (nullable, with default)
2. **Migrate data** — backfill in batches; dual-write from application
3. **Transition** — application reads from new column; stop writing to old
4. **Contract** — drop old column in a follow-up migration

#### Data Backfill Strategies

```sql
-- Batch update to avoid long-running locks
UPDATE users SET email_normalized = LOWER(email)
WHERE id IN (SELECT id FROM users WHERE email_normalized IS NULL LIMIT 5000);
-- Repeat in a loop until 0 rows affected
```

### Performance Optimization

#### EXPLAIN Plan Reading

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) SELECT ...;
```

Key signals:
- **Seq Scan** on large tables → missing index
- **Nested Loop** with high row estimates → consider hash/merge join or index
- **Buffers shared read** >> **hit** → working set exceeds memory

#### N+1 Query Detection

Symptoms: application issues one query per row.

Fixes:
- Use `JOIN` or subquery to fetch in one round-trip
- ORM eager loading (`select_related` / `includes` / `with` / Mongoose `populate`)
- DataLoader pattern for GraphQL resolvers

#### Connection Pooling

| Tool | Protocol | Best For |
|------|----------|----------|
| **PgBouncer** | PostgreSQL | Transaction/statement pooling, low overhead |
| **Built-in pool** (HikariCP, Prisma, Drizzle pool) | Any | Application-level pooling |

**Rule of thumb:** Pool size = `(2 * CPU cores) + disk spindles`. For cloud SSDs, start with `2 * vCPUs`.

#### Read Replicas and Query Routing

- Route all `SELECT` queries to replicas; writes to primary
- Account for replication lag (typically <1s for async, 0 for sync)
- Use `pg_last_wal_replay_lsn()` to detect lag before reading critical data

#### Table Partitioning (for UGSkill scale)

```sql
-- Partition audit_logs by month
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  actor_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (created_at);

CREATE TABLE audit_logs_2026_01 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

**Partition candidates in UGSkill:**
- `audit_logs` → by month
- `proctoring_events` → by month
- `exam_attempts` → by month or by exam_id (list)
- `activity_events` → by month
- `notification_logs` → by month

---

## PART 2 — MONGODB (Document Store / Flexible Layer)

### Core Competencies

#### Document Schema Design
- **Embedding vs. Referencing**: When to nest subdocuments vs. use foreign references
- **Polymorphic Patterns**: Single collection with discriminator field for varied shapes
- **Bucket Pattern**: Grouping time-series data into fixed-size documents
- **Attribute Pattern**: Handling variable attributes across document instances
- **Schema Versioning**: `schema_version` field for evolution without migrations
- **Outlier Pattern**: Handling documents that exceed normal size boundaries

#### MongoDB Indexing
- **Single-field indexes**: Standard B-tree indexes on frequently queried fields
- **Compound indexes**: Multi-field indexes following ESR rule (Equality, Sort, Range)
- **Text indexes**: Full-text search across string fields
- **TTL indexes**: Auto-expire documents after a duration (proctoring events, sessions)
- **Wildcard indexes**: Index all fields in a flexible subdocument
- **Partial indexes**: Index only documents matching a filter expression
- **Unique indexes**: Enforce uniqueness within the collection

#### Aggregation Pipeline
- **$match / $group / $sort / $project**: Core pipeline stages
- **$lookup**: Cross-collection joins (use sparingly)
- **$unwind**: Flatten arrays for per-element processing
- **$facet**: Multiple aggregation pipelines in a single pass
- **$bucket / $bucketAuto**: Histogram-style grouping
- **$graphLookup**: Recursive graph traversal (prerequisite chains)

### MongoDB Best Practices

#### Schema Design Rules

1. **Embed when**: Data is always read together, child has no independent identity, 1:few relationship, subdocument count < 100.
2. **Reference when**: Data has independent lifecycle, many:many relationship, subdocument count is unbounded, data is shared across contexts.
3. **Always include `_id`**: MongoDB auto-generates; use custom `_id` only when a natural key exists.
4. **Add `createdAt` and `updatedAt`**: Use Mongoose `timestamps: true` or manual fields.
5. **Use `schemaVersion` field**: Every collection should have `schemaVersion: 1` for future evolution.
6. **Set `maxDocumentSize` awareness**: MongoDB limit is 16MB. If a document can grow unbounded (e.g., chat history), use the bucket pattern.
7. **Validate with JSON Schema**: Apply MongoDB's built-in JSON Schema validation on collections to prevent garbage data.

#### Embedding vs. Referencing Decision Matrix

| Criteria | Embed | Reference |
|----------|-------|-----------|
| Read together 90%+ of the time | ✅ | |
| Child has independent lifecycle | | ✅ |
| 1:1 or 1:few relationship | ✅ | |
| 1:many (unbounded) relationship | | ✅ |
| Many:many relationship | | ✅ |
| Child shared across parents | | ✅ |
| Need atomic updates across parent+child | ✅ | |
| Document size could exceed 16MB | | ✅ |
| Child updated much more frequently than parent | | ✅ |

#### MongoDB Index Patterns

```javascript
// Compound index following ESR rule: Equality → Sort → Range
db.questions.createIndex({ type: 1, difficulty: 1, created_at: -1 });

// Text index for full-text search across question content
db.questions.createIndex({ stem: "text", explanation: "text" });

// TTL index to auto-expire proctoring sessions after 90 days
db.proctoring_events.createIndex({ created_at: 1 }, { expireAfterSeconds: 7776000 });

// Partial index: only index published questions
db.questions.createIndex(
  { topic: 1, difficulty: 1 },
  { partialFilterExpression: { status: "published" } }
);

// Wildcard index for flexible metadata
db.company_profiles.createIndex({ "skills.$**": 1 });

// Unique compound index
db.exam_attempts.createIndex(
  { student_id: 1, exam_id: 1, attempt_number: 1 },
  { unique: true }
);
```

#### Aggregation Pipeline Examples

```javascript
// Topic-wise accuracy across all attempts for a student
db.exam_responses.aggregate([
  { $match: { student_id: ObjectId("...") } },
  { $group: {
      _id: "$topic",
      total: { $sum: 1 },
      correct: { $sum: { $cond: ["$is_correct", 1, 0] } }
  }},
  { $project: {
      topic: "$_id",
      accuracy: { $multiply: [{ $divide: ["$correct", "$total"] }, 100] }
  }},
  { $sort: { accuracy: 1 } } // weakest topics first
]);

// Proctoring violation summary grouped by type
db.proctoring_events.aggregate([
  { $match: { session_id: ObjectId("...") } },
  { $group: {
      _id: "$event_type",
      count: { $sum: 1 },
      max_severity: { $max: "$severity" },
      first_at: { $min: "$timestamp" },
      last_at: { $max: "$timestamp" }
  }},
  { $sort: { count: -1 } }
]);

// Prerequisite chain traversal using $graphLookup
db.roadmap_stages.aggregate([
  { $match: { roadmap_id: ObjectId("...") } },
  { $graphLookup: {
      from: "roadmap_stages",
      startWith: "$prerequisite_stage_ids",
      connectFromField: "prerequisite_stage_ids",
      connectToField: "_id",
      as: "prerequisite_chain",
      maxDepth: 10
  }}
]);
```

#### MongoDB Schema Validation

```javascript
db.createCollection("questions", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["type", "stem", "difficulty", "status", "schema_version"],
      properties: {
        type: { enum: ["mcq_single", "mcq_multi", "coding", "descriptive", "numerical", "fill_blank", "matching"] },
        stem: { bsonType: "string", minLength: 10 },
        difficulty: { enum: ["easy", "medium", "hard", "very_hard"] },
        status: { enum: ["draft", "review", "published", "archived"] },
        schema_version: { bsonType: "int" },
        options: { bsonType: "array" },
        test_cases: { bsonType: "array" },
        correct_answer: {}
      }
    }
  }
});
```

#### MongoDB Transactions (When Needed)

```javascript
// Multi-document transaction for exam attempt submission
const session = client.startSession();
try {
  session.startTransaction();

  // 1. Lock and update the attempt
  await db.exam_attempts.updateOne(
    { _id: attemptId },
    { $set: { status: "submitted", submitted_at: new Date() } },
    { session }
  );

  // 2. Write the computed score
  await db.exam_scores.insertOne({
    attempt_id: attemptId,
    student_id: studentId,
    total_score: computedScore,
    section_scores: sectionBreakdown
  }, { session });

  await session.commitTransaction();
} catch (e) {
  await session.abortTransaction();
  throw e;
} finally {
  session.endSession();
}
```

---

## PART 3 — HYBRID ARCHITECTURE PATTERNS

### Data Ownership Matrix

The most critical decision in a hybrid architecture is **which database owns which entity**. An entity has exactly ONE owner. Other systems may have read replicas or materialized copies, but writes always go to the owner.

#### PostgreSQL-Owned Entities (Source of Truth)

| Entity | Why PostgreSQL | Key Access Patterns |
|--------|---------------|-------------------|
| **Users & Profiles** | RBAC joins, session management, strong consistency | Auth lookups, role checks, profile reads |
| **Roles & Permissions** | Many-to-many joins, cascading rules | Permission validation on every request |
| **Enrollments** | Transactional integrity (enroll → unlock → auto-enroll) | FK to user + course, access validation |
| **Batches & Groups** | Many-to-many with cascading access rules | Batch → users, batch → courses, batch → exams |
| **Computed Scores & Rankings** | Window functions, percentile calculations | Leaderboard queries, ranking, percentiles |
| **Certificates** | Unique verification IDs, audit trail | Verification lookups, PDF generation |
| **Scheduling & Slots** | Time-range queries, conflict detection | Availability queries, double-booking prevention |
| **Billing / Subscriptions** | ACID transactions, financial integrity | Payment processing, plan management |
| **Audit Logs** | Append-only, immutable, compliance | Compliance queries, forensics |
| **Notification Records** | Delivery tracking, retry logic | Status queries, deduplication |

#### MongoDB-Owned Entities (Flexible Store)

| Entity | Why MongoDB | Key Access Patterns |
|--------|------------|-------------------|
| **Question Bank** | 6+ polymorphic types (MCQ, coding, descriptive, numerical, fill-blank, matching) | Type-filtered queries, random selection, bulk import |
| **Course Content Tree** | Deep nesting (Course → Sections → Lectures → Resources) | Full document reads, nested updates |
| **Roadmap Definitions** | Prerequisite graphs, nested stage structures | Graph traversal, stage lookups |
| **Interview Flow Configs** | Variable round types (aptitude ≠ coding ≠ HR ≠ GD) | Full config load per flow |
| **Company Profiles** | Semi-structured (skills, patterns, CTC, process versions) | Profile reads, pattern matching |
| **Exam Attempt State** | Complex real-time state (answers, flags, timestamps per question) | High-frequency writes during exams, resume on reconnect |
| **Proctoring Events** | High-write event stream, variable event shapes | Append-only writes, time-range queries, violation aggregation |
| **AI Chat History** | Conversational threads, variable response formats | Thread reads, context window loading |
| **Activity & Engagement Events** | High-write event stream, flexible event schema | Append, daily/weekly aggregation, heatmaps |
| **AI-Generated Content** | Unpredictable output shapes (summaries, questions, feedback) | Write-once, read-many |
| **Recording Metadata** | Complex nested data (timestamps, speakers, transcript segments) | Full document reads, segment search |
| **Session State (Live)** | WebSocket-synced ephemeral state | High-frequency reads/writes during live sessions |

### Change Data Capture (CDC) — Syncing Between Databases

When data from one database is needed in the other, **never dual-write**. Use CDC or event-driven sync instead.

#### Pattern: PostgreSQL → MongoDB (User Data Materialization)

```
PostgreSQL (users table)
    ↓ [Debezium / pg_logical / LISTEN/NOTIFY]
    ↓
  Event Bus (Redis Streams / Kafka / BullMQ)
    ↓
  Worker: Upsert user snapshot into MongoDB
    ↓
MongoDB (user_snapshots collection — read-only replica)
```

**Use case:** MongoDB question bank needs to display creator names. Instead of cross-DB joins, materialize a read-only `user_snapshots` collection in MongoDB.

#### Pattern: MongoDB → PostgreSQL (Score Materialization)

```
MongoDB (exam_attempts collection)
    ↓ [Change Streams]
    ↓
  Worker: Compute score, percentile
    ↓
  INSERT/UPSERT into PostgreSQL scores table
    ↓
PostgreSQL (exam_scores table — materialized for analytics)
```

**Use case:** Exam attempt raw data lives in MongoDB (flexible state), but computed scores are materialized to PostgreSQL for leaderboard/ranking queries using window functions.

#### CDC Implementation Options

| Tool | Source | Target | Best For |
|------|--------|--------|----------|
| **Debezium** | PostgreSQL WAL | Kafka → MongoDB | Production-grade, exactly-once semantics |
| **MongoDB Change Streams** | MongoDB oplog | PostgreSQL via worker | Real-time MongoDB → SQL sync |
| **pg_logical + LISTEN/NOTIFY** | PostgreSQL | App-level handler | Lightweight, no Kafka dependency |
| **Application-level events** | Either | Either | Simple setups, BullMQ/Redis queue |

### CQRS Pattern (Command Query Responsibility Segregation)

For UGSkill, apply CQRS where the write model and read model have different shapes:

```
WRITES (Commands)                      READS (Queries)
─────────────────                      ─────────────────
Student answers question →             Leaderboard query →
  MongoDB: exam_attempts                 PostgreSQL: exam_scores
  (flexible, fast writes)                (window functions, ranking)

Creator saves course →                 Student browses catalog →
  MongoDB: courses                       PostgreSQL: course_catalog
  (nested sections/lectures)             (search, filter, sort, paginate)

Proctor event fires →                  Admin reviews violations →
  MongoDB: proctoring_events             MongoDB: proctoring_events
  (append-only, variable shape)          (aggregation pipeline)

Student enrolls →                      Progress dashboard →
  PostgreSQL: enrollments                PostgreSQL: progress_view
  (transactional, FK validated)          (materialized view with JOINs)
```

### Event Sourcing (for Audit-Critical Domains)

Use event sourcing for domains where the full history matters:

```javascript
// Proctoring event store (MongoDB)
{
  _id: ObjectId("..."),
  session_id: ObjectId("..."),
  student_id: "pg_user_uuid_ref",
  event_type: "face_absent",           // discriminator
  timestamp: ISODate("2026-04-11T10:30:45Z"),
  payload: {
    confidence: 0.92,
    duration_seconds: 8,
    snapshot_url: "s3://bucket/snap_123.jpg"
  },
  severity: "medium",
  cumulative_score: 15,
  schema_version: 1
}

// Exam attempt event store (MongoDB)
{
  _id: ObjectId("..."),
  attempt_id: ObjectId("..."),
  event_type: "answer_selected",       // discriminator
  timestamp: ISODate("2026-04-11T10:31:02Z"),
  payload: {
    question_index: 14,
    section: "quantitative",
    selected_option: "B",
    previous_option: "A",              // for change tracking
    time_spent_ms: 42300
  },
  schema_version: 1
}
```

### Consistency Guarantees Across Databases

| Scenario | Pattern | Consistency |
|----------|---------|-------------|
| Student enrolls → courses unlocked | PostgreSQL transaction | Strong (ACID) |
| Exam submitted → score computed → leaderboard updated | Saga pattern (MongoDB write → worker → PostgreSQL write) | Eventual (seconds) |
| Proctoring violation → student warned | MongoDB write + WebSocket push | Real-time, best-effort |
| New course created → appears in catalog | MongoDB write → CDC → PostgreSQL catalog upsert | Eventual (seconds) |
| Score computed → certificate generated | PostgreSQL trigger → job queue → PDF generation | Eventual (minutes) |

### Error Handling in Cross-DB Operations

```javascript
// Saga pattern with compensation
async function submitExamAttempt(attemptId) {
  // Step 1: Write to MongoDB (primary store)
  const attempt = await mongoDb.exam_attempts.findOneAndUpdate(
    { _id: attemptId },
    { $set: { status: "submitted", submitted_at: new Date() } },
    { returnDocument: "after" }
  );

  try {
    // Step 2: Compute and write score to PostgreSQL
    const score = computeScore(attempt);
    await pgPool.query(
      `INSERT INTO exam_scores (attempt_id, student_id, exam_id, score, percentile)
       VALUES ($1, $2, $3, $4, NULL)
       ON CONFLICT (attempt_id) DO UPDATE SET score = $4`,
      [attemptId, attempt.student_id, attempt.exam_id, score]
    );
  } catch (error) {
    // Compensation: queue for retry, don't rollback MongoDB
    await retryQueue.add("compute_score", { attemptId }, {
      attempts: 5,
      backoff: { type: "exponential", delay: 1000 }
    });
    logger.error("Score computation failed, queued for retry", { attemptId, error });
  }
}
```

---

## PART 4 — UGSKILL DOMAIN DATA MODEL

### Entity-to-Database Assignment Map

```
┌─────────────────────────────────────────────────────────┐
│                    POSTGRESQL                            │
│                                                         │
│  users ─── roles ─── permissions                        │
│    │                                                    │
│  batches ──── batch_members                             │
│    │                                                    │
│  enrollments ─── course_ref(id only)                    │
│    │                                                    │
│  exam_scores ─── rankings ─── leaderboards              │
│    │                                                    │
│  certificates ─── verification_links                    │
│    │                                                    │
│  schedule_slots ─── bookings                            │
│    │                                                    │
│  notifications_log ─── delivery_status                  │
│    │                                                    │
│  audit_logs (partitioned by month)                      │
│    │                                                    │
│  progress_summary (materialized from MongoDB events)    │
│    │                                                    │
│  course_catalog (materialized from MongoDB courses)     │
│    │                                                    │
│  readiness_scores (computed from MongoDB raw data)      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                     MONGODB                              │
│                                                         │
│  questions ─── (polymorphic: mcq, coding, descriptive)  │
│    │                                                    │
│  courses ─── sections[] ─── lectures[] ─── resources[]  │
│    │                                                    │
│  roadmaps ─── stages[] ─── course_refs[]                │
│    │                                                    │
│  interview_flows ─── rounds[] (polymorphic configs)     │
│    │                                                    │
│  company_profiles ─── skills[] ─── patterns[]           │
│    │                                                    │
│  exam_attempts ─── responses[] ─── flags[]              │
│    │                                                    │
│  proctoring_events (TTL: 90 days)                       │
│    │                                                    │
│  activity_events (TTL: 12 months)                       │
│    │                                                    │
│  ai_chat_sessions ─── messages[]                        │
│    │                                                    │
│  ai_generated_content                                   │
│    │                                                    │
│  recording_metadata ─── segments[] ─── transcript[]     │
│    │                                                    │
│  gd_sessions ─── participants[] ─── evaluations[]       │
│    │                                                    │
│  user_snapshots (materialized from PostgreSQL)           │
└─────────────────────────────────────────────────────────┘
```

### Example: Question Bank (MongoDB — Polymorphic Collection)

```javascript
// MCQ Single-Correct
{
  _id: ObjectId("..."),
  type: "mcq_single",
  schema_version: 1,
  stem: "What is the time complexity of binary search?",
  options: [
    { key: "A", text: "O(n)", is_correct: false },
    { key: "B", text: "O(log n)", is_correct: true },
    { key: "C", text: "O(n²)", is_correct: false },
    { key: "D", text: "O(1)", is_correct: false }
  ],
  explanation: "Binary search divides the search space in half each step...",
  difficulty: "easy",
  subject: "Data Structures",
  topic: "Searching Algorithms",
  tags: ["binary-search", "time-complexity", "arrays"],
  bloom_level: "understand",
  source: { type: "original", created_by: "pg_user_uuid" },
  company_tags: ["TCS", "Infosys"],
  estimated_time_seconds: 60,
  status: "published",
  media: [],
  version: 3,
  version_history: [
    { version: 2, changed_by: "pg_user_uuid", changed_at: ISODate("..."), diff: "Updated explanation" }
  ],
  stats: { times_used: 142, avg_accuracy: 0.73 },
  created_at: ISODate("..."),
  updated_at: ISODate("...")
}

// Coding Problem
{
  _id: ObjectId("..."),
  type: "coding",
  schema_version: 1,
  stem: "Given an array of integers, return two numbers that add up to the target.",
  constraints: "1 ≤ n ≤ 10⁵, -10⁹ ≤ nums[i] ≤ 10⁹",
  sample_io: [
    { input: "[2,7,11,15], target=9", output: "[0,1]" },
    { input: "[3,2,4], target=6", output: "[1,2]" }
  ],
  hidden_test_cases: [
    { input: "[1,1], target=2", output: "[0,1]", is_edge: true },
    // ... more hidden cases
  ],
  supported_languages: ["python", "java", "cpp", "javascript"],
  time_limit_ms: 2000,
  memory_limit_mb: 256,
  reference_solution: {
    language: "python",
    code: "def twoSum(nums, target): ...",
    time_complexity: "O(n)",
    space_complexity: "O(n)"
  },
  difficulty: "medium",
  subject: "Data Structures",
  topic: "Hash Maps",
  tags: ["two-sum", "hash-map", "array"],
  status: "published",
  // ... common fields
}

// Descriptive / Short Answer
{
  _id: ObjectId("..."),
  type: "descriptive",
  schema_version: 1,
  stem: "Explain the difference between a process and a thread with real-world examples.",
  model_answer: "A process is an independent program in execution with its own memory space...",
  word_limit: { min: 100, max: 500 },
  evaluation_rubric: {
    accuracy: { weight: 0.4, criteria: "Correct definition and distinction" },
    completeness: { weight: 0.3, criteria: "Covers key differences" },
    examples: { weight: 0.2, criteria: "Relevant real-world examples" },
    clarity: { weight: 0.1, criteria: "Well-structured response" }
  },
  grading_mode: "ai_assisted",  // or "manual"
  difficulty: "medium",
  subject: "Operating Systems",
  topic: "Process Management",
  status: "published",
  // ... common fields
}
```

### Example: Interview Flow (MongoDB — Variable Round Configs)

```javascript
{
  _id: ObjectId("..."),
  company_id: ObjectId("..."),
  name: "Infosys SDE-1 2026 Flow",
  status: "published",
  version: 2,
  schema_version: 1,
  rounds: [
    {
      order: 1,
      type: "aptitude",
      name: "Aptitude Round",
      config: {
        sections: [
          { name: "Quantitative", question_count: 10, time_limit_minutes: 15 },
          { name: "Logical Reasoning", question_count: 10, time_limit_minutes: 15 },
          { name: "Verbal", question_count: 5, time_limit_minutes: 10 }
        ],
        negative_marking: -0.25,
        pass_cutoff_percent: 60,
        proctoring_enabled: true
      }
    },
    {
      order: 2,
      type: "coding",
      name: "Coding Round",
      config: {
        problem_count: 2,
        difficulty_mix: { easy: 0, medium: 1, hard: 1 },
        supported_languages: ["python", "java", "cpp"],
        time_limit_minutes: 60,
        execution_sandbox: "docker",
        pass_cutoff_percent: 50
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
  dependency_mode: "sequential",  // or "parallel"
  created_by: "pg_user_uuid",
  created_at: ISODate("..."),
  updated_at: ISODate("...")
}
```

### Example: Users Table (PostgreSQL — Source of Truth)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  email_verified BOOLEAN DEFAULT FALSE,
  password_hash TEXT,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  
  -- Role management
  roles TEXT[] DEFAULT ARRAY['student']::TEXT[],
  
  -- Profile metadata
  institution TEXT,
  branch TEXT,
  cgpa NUMERIC(4,2),
  graduation_year INTEGER,
  
  -- Account state
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'disabled')),
  suspension_reason TEXT,
  last_login_at TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,
  
  -- OAuth
  oauth_provider TEXT,
  oauth_provider_id TEXT,
  
  -- Soft delete + timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_roles ON users USING gin(roles);
CREATE INDEX idx_users_institution ON users(institution) WHERE deleted_at IS NULL;
```

### Example: Enrollments Table (PostgreSQL — Transactional)

```sql
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),
  
  -- Polymorphic: course or roadmap
  enrollable_type TEXT NOT NULL CHECK (enrollable_type IN ('course', 'roadmap')),
  enrollable_id TEXT NOT NULL,  -- References MongoDB ObjectId as string
  
  -- State
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped', 'expired')),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Progress cache (materialized from MongoDB events)
  progress_percent NUMERIC(5,2) DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  
  -- Source tracking
  source TEXT DEFAULT 'self' CHECK (source IN ('self', 'batch_assign', 'roadmap_auto', 'admin')),
  batch_id UUID REFERENCES batches(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (student_id, enrollable_type, enrollable_id)
);

CREATE INDEX idx_enrollments_student ON enrollments(student_id, status);
CREATE INDEX idx_enrollments_enrollable ON enrollments(enrollable_type, enrollable_id);
CREATE INDEX idx_enrollments_batch ON enrollments(batch_id) WHERE batch_id IS NOT NULL;
```

### Cross-Reference ID Pattern

Since entities span two databases, use this consistent pattern:

```
PostgreSQL → MongoDB reference:  Store MongoDB ObjectId as TEXT
MongoDB → PostgreSQL reference:  Store PostgreSQL UUID as STRING

Field naming convention:
  pg_user_id     — a PostgreSQL UUID stored in MongoDB
  mongo_course_id — a MongoDB ObjectId stored in PostgreSQL as TEXT
```

```javascript
// MongoDB document referencing a PostgreSQL user
{
  _id: ObjectId("..."),
  pg_creator_id: "550e8400-e29b-41d4-a716-446655440000",  // PostgreSQL UUID
  title: "React Masterclass",
  // ...
}
```

```sql
-- PostgreSQL row referencing a MongoDB course
INSERT INTO enrollments (student_id, enrollable_type, enrollable_id)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',  -- PostgreSQL UUID
  'course',
  '507f1f77bcf86cd799439011'                -- MongoDB ObjectId as TEXT
);
```

---

## PART 5 — SECURITY & OPERATIONAL CONSIDERATIONS

### Security

1. **Principle of least privilege**: Separate DB users for app reads, app writes, migrations, and admin.
2. **Encrypt sensitive data**: AES-256 at rest for both PostgreSQL (TDE) and MongoDB (encrypted storage engine). TLS 1.3 in transit.
3. **Row-Level Security (PostgreSQL)**: Enable RLS for multi-tenancy isolation.
4. **MongoDB Field-Level Encryption**: Encrypt PII fields (CGPA, phone, scores) using client-side field-level encryption.
5. **Audit access patterns**: Log all database access via `pgaudit` extension and MongoDB's built-in audit log.
6. **Validate inputs**: Parameterized queries only. No string interpolation in SQL or MongoDB queries.
7. **Connection security**: Use connection strings with TLS, rotate credentials via secrets manager.

### Backup Strategy

| Database | Method | Frequency | Retention |
|----------|--------|-----------|-----------|
| **PostgreSQL** | `pg_dump` (logical) + WAL archiving (PITR) | Hourly WAL, Daily full | 30 days |
| **MongoDB** | `mongodump` + oplog-based PITR | Continuous oplog, Daily full | 30 days |

**Critical:** Backup both databases before any cross-DB migration or schema change. Test restores monthly.

### Monitoring

| Metric | PostgreSQL | MongoDB |
|--------|-----------|---------|
| **Connection pool** | `pg_stat_activity` | `db.serverStatus().connections` |
| **Slow queries** | `pg_stat_statements` | MongoDB Profiler (level 1) |
| **Index usage** | `pg_stat_user_indexes` | `db.collection.aggregate([{$indexStats:{}}])` |
| **Replication lag** | `pg_stat_replication` | `rs.status()` |
| **Disk usage** | `pg_database_size()` | `db.stats()` |

---

## PART 6 — SHARDING & REPLICATION

### Horizontal vs Vertical Partitioning

- **Vertical partitioning**: Split columns across tables (e.g., separate BLOB columns). Reduces I/O for narrow queries.
- **Horizontal partitioning (sharding)**: Split rows across databases/servers. Required when a single node cannot hold the dataset or handle the throughput.

### Sharding Strategies

| Strategy | How It Works | Pros | Cons |
|----------|-------------|------|------|
| **Hash** | `shard = hash(key) % N` | Even distribution | Resharding is expensive |
| **Range** | Shard by date or ID range | Simple, good for time-series | Hot spots on latest shard |
| **Geographic** | Shard by user region | Data locality, compliance | Cross-region queries are hard |

### MongoDB Sharding for UGSkill

```javascript
// Shard proctoring_events by session_id (hash) — even distribution
sh.shardCollection("ugskill.proctoring_events", { session_id: "hashed" });

// Shard activity_events by student_id (hash) — co-locate per student
sh.shardCollection("ugskill.activity_events", { student_id: "hashed" });

// Shard questions by compound key — enables targeted queries
sh.shardCollection("ugskill.questions", { subject: 1, _id: 1 });
```

### Replication Patterns

| Pattern | Consistency | Latency | Use Case |
|---------|------------|---------|----------|
| **Synchronous** | Strong | Higher write latency | Financial transactions, enrollment writes |
| **Asynchronous** | Eventual | Low write latency | Proctoring events, activity logs |
| **Semi-synchronous** | At-least-one confirmed | Moderate | Exam attempt persistence |

---

## Cross-References

- **sql-database-assistant** — query writing, optimization, and debugging for day-to-day SQL work
- **database-schema-designer** — ERD modeling, normalization analysis, and schema generation
- **migration-architect** — large-scale migration planning across database engines or major schema overhauls
- **senior-backend** — application-layer patterns (connection pooling, ORM best practices, Mongoose/Prisma/Drizzle)
- **senior-devops** — infrastructure provisioning for database clusters and replicas

---

## Quick Decision Checklist

When adding a NEW entity to UGSkill, answer these:

```
1. Does it have a FIXED schema known at design time?
   YES → PostgreSQL    NO → MongoDB

2. Does it participate in TRANSACTIONS with other entities?
   YES → PostgreSQL    NO → MongoDB is fine

3. Does it need WINDOW FUNCTIONS or complex JOINs for queries?
   YES → PostgreSQL (or materialize there)

4. Is it POLYMORPHIC (multiple shapes in same collection)?
   YES → MongoDB

5. Is it deeply NESTED (3+ levels)?
   YES → MongoDB

6. Is it a HIGH-WRITE EVENT STREAM?
   YES → MongoDB (with TTL index if ephemeral)

7. Is it AI-GENERATED with unpredictable shape?
   YES → MongoDB

8. Does it need FULL-TEXT SEARCH?
   SIMPLE → MongoDB text index    ADVANCED → PostgreSQL with pg_trgm or Elasticsearch

9. Will it be used for LEADERBOARDS or RANKINGS?
   YES → PostgreSQL (window functions)

10. Is it AUDIT / COMPLIANCE data?
    YES → PostgreSQL (append-only, partitioned, immutable)
```

---

## Conclusion

UGSkill's hybrid PostgreSQL + MongoDB architecture is driven by the platform's diverse data patterns: relational/transactional workloads (users, enrollments, scores) coexist with polymorphic content (question banks), deeply nested documents (courses, interview flows), and high-write event streams (proctoring, activity). This skill provides the complete toolkit for designing, synchronizing, and operating both database systems as a unified data layer under one application.

# UGSkill Backend Infrastructure Documentation

This document outlines the core cross-cutting internal systems installed in Chunk 7 that facilitate asynchronous work, file storage, notifications, and telemetry.

## 1. Asynchronous Job Processing (BullMQ & Redis)

### Overview
To ensure fast API response times without hanging on I/O-heavy operations (like sending emails or syncing DB catalogs), we utilize **BullMQ** backed by **Redis**.

### Components
- **`src/config/queue.ts`**: Defines standard queue configurations (exponential backoffs, attempt limits). Includes three main queues: `cdc-sync`, `notifications`, and `scoring`.
- **`src/jobs/worker.ts`**: The worker entrypoint that continuously listens for Redis events and spins up handler functions when a new job drops.
- **CDC Syncing (`src/jobs/cdcSync.job.ts`)**: The orchestrator for Change Data Capture.

## 2. Event Emitter Framework

### Overview
The app uses a lightweight Node `EventEmitter` instance (`src/lib/events.ts`) acting as an internal message bus.

### Workflow
When an entity state changes in the Application tier (e.g. `course.created`), the service emits an event natively.
Listeners (`src/lib/eventListeners.ts`) intercept these events and immediately push them onto the BullMQ `cdc-sync` queue, letting the API respond to the client instantly.

## 3. Notification Service

### Overview
A centralized email and notification dispatcher built on top of **Resend**.

### Workflow
- Triggered by calling `notificationService.sendEmail()`.
- Automatically offloads to BullMQ.
- The dedicated worker `src/jobs/notification.job.ts` pulls the job, formats it, and transmits it via `resend.emails.send()`.
- The system logs identical event success/failures into the PostgreSQL `notification_logs` table (complete with external API IDs for tracking tracing).

## 4. File Storage (AWS S3)

### Overview
We use AWS S3 standard configurations handled by the official `@aws-sdk/client-s3`. 

### Security via Pre-Signed URLs
Instead of proxying multi-megabyte video files through our Node.js server (which causes severe memory bottlenecks and ingress costs), the server provides a **Pre-Signed Upload URL** via `storage.getUploadUrl()`. The client browser then uploads directly to bucket servers, maximizing speed.

## 5. Event Telemetry & AI Passthrough

### Activity Logs
- Configured as stateless high-volume ingestion routes in MongoDB (`activity_events`) for analytics.

### AI Endpoints
- AI Chat logs act as simple passthrough proxies (`src/modules/ai/ai.controller.ts`). The Node app authenticates the student, logs their query context in MongoDB (`ai_chat_sessions`), and securely forwards the HTTP traffic to the isolated external AI Python/Go endpoints.

# UGSkill — Explicit Manual Setup Guide

This document lists all the **explicit, manual actions** you (the developer/admin) must take to wire up the external cloud services, infrastructure, and third-party APIs required for the UGSkill backend to function in a production or local environment. 

> **Yes, this is all you need to do.** WebSockets, BullMQ (Task Queues), and Cron Jobs do not require manual external setup because we self-host them directly inside our Node.js server and they inherently run on top of our Redis container.

---

## What Does Everything Do?

Here is a breakdown of the exact role each piece of technology plays in UGSkill:

### 1. The Core Databases
- **PostgreSQL (Supabase)**: Our source of absolute truth. It handles highly structured logic: user identities, rigid exam ranks, certificates, calculated analytics, payment/billing states, and security access.
- **MongoDB**: Our flexible content repository. It handles massive, nested document dumps: the heavily nested course curriculums, question banks of varying shapes, proctoring events, and the infinite streams of AI conversational chat logs.

### 2. The Internal Infrastructure (No API keys needed)
- **Redis (via Docker)**: The high-speed memory layer. It allows us to: 
  - Manage live countdown timers for exams so a student resuming on a different browser gets the exact same remaining time.
  - Temporarily cache API queries (like course leaderboards) so our database doesn't crash under load.
  - Act as the engine for BullMQ.
- **BullMQ (via Redis)**: The background worker system. If an exam consists of 1,000 students clicking "Submit" at the same time, we don't calculate scores instantly. We throw those 1,000 events into BullMQ, and it quietly processes them in the background so the server doesn't freeze.
- **WebSockets (Socket.io)**: Fully internalized within Express. Enables live features without external APIs. It binds to our HTTP Port and powers the real-time group discussion timers, chat systems, live proctoring alerts, and interviewer presence features.

### 3. The External Services (Manual API setup required)
- **AWS S3**: Cloud storage. Instead of routing 2GB course video uploads through our Node server (which would crash it), we generate "pre-signed URLs" using the AWS SDK. The browser directly uploads the file to Amazon.
- **Resend**: Transactional emails. Required to reliably land PDF certificates, password reset emails, and placement interview invites into a user's inbox without going to spam.
- **Sentry**: Critical error monitoring. If a backend route crashes in production, it sends the full stack-trace to Sentry so we know exactly why it failed.

---

## 1. Cloud Services & API Keys

Before running the application, you must manually create accounts and grab API keys for the following services.

### A. AWS S3 (For File Uploads)
Since we are using AWS SDK v3 for features like pre-signed URLs (for resumes, course videos, profile pictures), you need an AWS Account.
1. **Create an S3 Bucket**: Log into the AWS Console, search for S3, and create a new bucket (e.g., `ugskill-assets-prod`).
2. **Configure CORS**: Go to the bucket's *Permissions* tab and set a CORS policy allowing `GET` and `PUT` from your frontend's domain (or `http://localhost:3000` for dev) so users can directly upload to S3.
3. **Create an IAM User**: Go to IAM -> Users -> Add User.
4. **Assign Permissions**: Attach the `AmazonS3FullAccess` policy (or restrict it to just your specific bucket).
5. **Generate Keys**: Create an Access Key for this user. Copy the **Access Key ID** and **Secret Access Key**.
6. **Env Vars**: Set `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, and `AWS_S3_BUCKET` in your `.env`.

### B. Supabase (PostgreSQL) — ⚡ AUTOMATED via MCP
1. **Schema & Tables (Already Done)**: Since I am connected to the Supabase MCP, I have *already* deployed all 30 tables, triggers, and Row-Level Security policies to your existing project:
   - **Project Name**: `ugskill92@gmail.com's Project` 
   - **Ref ID**: `oemnltyocalaqeccagkk`
2. **Setup Required**: Due to strict security protocols, the MCP cannot retrieve your raw Database Password. You must supply your password to form the connection string.
3. **Env Vars**: Set `PG_DATABASE_URL` in your `.env` like this:
   `postgres://postgres.oemnltyocalaqeccagkk:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`

### C. Resend (Transactional Emails)
1. Log into [Resend.com](https://resend.com) and create an account.
2. Navigate to **API Keys** and generate a new key.
3. **Domain Verification**: Add and verify your actual sending domain (e.g., `ugskill.io`) in the Domains tab. (Without this, you can only send to your own email address).
4. **Env Vars**: Set `RESEND_API_KEY` and `EMAIL_FROM` (e.g., `noreply@ugskill.io`) in your `.env`.

### D. Sentry (Error Tracking)
1. Log into [Sentry.io](https://sentry.io) and create a new Project.
2. Select **Express** / **Node.js** as your platform.
3. Copy the Data Source Name (DSN) URL provided on the setup screen.
4. **Env Vars**: Set this as `SENTRY_DSN` in your `.env`.

---

## 2. Local Infrastructure & Docker Setup

To run MongoDB and Redis locally without polluting your host machine, we use Docker. 

1. **Install Docker Desktop**: Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/Mac) or Docker Engine (Linux).
2. **Start Docker**: Ensure the Docker daemon is running (you should see the whale icon in your system tray).
3. **Spin up Local Databases**: In your terminal, navigate to the `ugskill-api` directory and run:
   ```bash
   docker-compose up -d mongo redis
   ```
   > **Note**: This runs *only* Mongo and Redis in the background (`-d`). We rely on the cloud Supabase for PostgreSQL, and we will run the API locally using Node.
4. **Verify Containers**: Run `docker ps` to ensure `ugskill-mongo` (Port 27017) and `ugskill-redis` (Port 6379) are active and healthy.

---

## 3. Environment Variables Configuration

1. In the `ugskill-api` folder, duplicate the `.env.example` file and rename it to `.env`.
2. Fill in the blanks with the keys you generated from Step 1:
   ```env
   # Database (Cloud & Local Docker)
   PG_DATABASE_URL="postgres://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-REGION.pooler.supabase.com:6543/postgres"
   MONGO_URI="mongodb://localhost:27017/ugskill"
   REDIS_URL="redis://localhost:6379"

   # App Secrets
   PORT=4000
   JWT_SECRET="generate_a_long_random_string_here"
   JWT_REFRESH_SECRET="generate_another_long_random_string_here"

   # External APIs
   RESEND_API_KEY="re_..."
   SENTRY_DSN="https://..."
   AWS_ACCESS_KEY_ID="..."
   AWS_SECRET_ACCESS_KEY="..."
   AWS_REGION="..."
   AWS_S3_BUCKET="..."
   ```

---

## 4. Run & Verification

Once all external accounts are created, Docker is running, and your `.env` is populated:

1. **Install Dependencies**:
   ```bash
   cd ugskill-api
   npm install
   ```
2. **Start the API Server**:
   ```bash
   npm run dev
   ```
3. **Verify Everything is Working**:
   Open a browser and navigate to the Swagger Documentation UI:
   `http://localhost:4000/api/v1/docs`

   If this page loads, your backend is successfully connected to the Local Docker instances and Cloud APIs, and is ready to process requests from the upcoming Frontend phase.

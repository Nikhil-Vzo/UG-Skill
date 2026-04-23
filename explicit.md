# explicit.md — UGSkill Launch Readiness (Honest Breakdown)

---

## 🟢 What Is Fully Built & Working

| Feature | Status | Notes |
|---|---|---|
| Student auth (register, login, JWT refresh) | ✅ Done | |
| Admin auth & role-based access | ✅ Done | |
| Course creation + S3 video uploads | ✅ Done | |
| Lecture playback (VideoPlayer) | ✅ Done | |
| Assignments + file upload with validation | ✅ Done | |
| Exams (MCQ, timer, proctoring) | ✅ Done | Socket-driven |
| Real-time proctoring alerts (tab switch, right-click) | ✅ Done | |
| Leaderboards | ✅ Done | |
| Placement Drives (create, apply, shortlist) | ✅ Done | |
| Community forum + post sanitization | ✅ Done | |
| Certificate generation | ✅ Done | |
| Readiness Analytics dashboard | ✅ Done | |
| Admin analytics (Charts.js — students, revenue, exams) | ✅ Done | |
| Live Interview room (WebRTC UI + Socket.io) | ✅ Done | Human-to-human |
| Live Group Discussion room | ✅ Done | Human-to-human |
| JWT in-memory, no XSS risk | ✅ Done | |
| Unit tests — 12/12 passing | ✅ Done | Vitest |
| Vercel config (SPA routing, security headers, caching) | ✅ Done | |
| Rate limiting, Sentry hooks, Helmet | ✅ Done | |

---

## 🔴 What Is NOT Done Yet (Before You Can Launch)

### 1. Infrastructure Provisioning (You Set These Up)

You need accounts and credentials from these services. All free tiers work:

| Service | Purpose | Get it at | Time |
|---|---|---|---|
| **Supabase** | PostgreSQL database | supabase.com | 5 min |
| **MongoDB Atlas** | NoSQL (community, activity, AI logs) | cloud.mongodb.com | 5 min |
| **Upstash** | Redis (rate limits, BullMQ queues) | upstash.com | 3 min |
| **AWS S3** | File storage (videos, uploads) | aws.amazon.com/s3 | 10 min |
| **Resend** | Transactional email (verification/password reset) | resend.com | 5 min |
| **Railway or Render** | Host the backend (ugskill-api) | railway.app | 10 min |
| **Vercel** | Host the frontend (ugskill-web) | vercel.com | 5 min |

---

### 2. Backend `.env` File (You Fill This In)

Create `ugskill-api/.env`:

```
NODE_ENV=production
PORT=4000

# PostgreSQL — from Supabase "Connection String" tab
PG_DATABASE_URL=postgresql://postgres:[password]@[host].supabase.co:5432/postgres

# MongoDB — from Atlas "Connect" → "Drivers"
MONGO_URI=mongodb+srv://[user]:[password]@cluster0.xxxxx.mongodb.net/ugskill

# Redis — from Upstash dashboard (use redis:// format)
REDIS_URL=redis://:[password]@[host].upstash.io:6379

# JWT — generate strong secrets (run command below)
JWT_SECRET=[64-char random hex]
JWT_REFRESH_SECRET=[64-char random hex]
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Email — from resend.com → API Keys
RESEND_API_KEY=re_xxxxxxxxxxxx

# AWS S3 — from IAM user with S3 permissions
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
AWS_S3_BUCKET=ugskill-storage-bucket

# AI Interview endpoint (see section below)
AI_EXTERNAL_URL=https://your-ai-endpoint/v1/chat

# Sentry (optional but recommended)
SENTRY_DSN=https://xxxxx@o0.ingest.sentry.io/0
```

**To generate JWT secrets, run:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Run it twice — one for JWT_SECRET, one for JWT_REFRESH_SECRET.

---

### 3. Frontend Env Variables (Set in Vercel Dashboard)

Go to Vercel → Project → Settings → Environment Variables:

```
VITE_API_URL=https://api.ugskill.com
VITE_SOCKET_URL=https://api.ugskill.com
```

---

## 🤖 The "AI Interviewer" — What It Actually Is Right Now

> **Important clarification: There is no AI bot asking interview questions.**

Here is exactly what the interview feature does today:

| What exists | What it does |
|---|---|
| `LiveInterview.tsx` | A **human-to-human** live room. The interviewer is a real person (admin/HR) who joins and conducts the session. |
| `InterviewPrep.tsx` | Student schedules a mock → backend creates a session → a human interviewer gets matched. |
| `ai.service.ts` | A **proxy stub**. It logs chats to MongoDB and forwards requests to `AI_EXTERNAL_URL`. No AI is built in. |

### To answer your question directly:

**"Will the AI interviewer only ask questions I set up?"**

→ Right now there is **no AI interviewer**. Interviews are conducted by a **real human** (whoever you assign as an interviewer).

→ If you want an AI bot to ask questions from a bank you define — that feature **is not built yet**.

---

## 🔧 If You Want an AI Interview Bot (Optional, ~2–3 hours)

### What needs to be built:
1. **Admin Question Bank UI** — Admin adds questions by topic/role (e.g. "React", "System Design")
2. **Prompt construction in `ai.service.ts`** — Build a system prompt like:
   > "You are a technical interviewer. Topics: React, Node.js. Use this question bank: [list]. Ask one question at a time."
3. **Wire Gemini API directly:**
   ```bash
   npm install @google/generative-ai
   ```
   Get your free key at: **aistudio.google.com/app/apikey**

Just say **"build the AI interview bot"** and I'll implement it in one session.

---

## ✅ Launch Checklist (In Dependency Order)

```
[ ] 1. Create Supabase project → copy PG_DATABASE_URL
[ ] 2. Create MongoDB Atlas cluster → copy MONGO_URI
[ ] 3. Create Upstash Redis → copy REDIS_URL
[ ] 4. Create AWS S3 bucket + IAM user → copy AWS keys
[ ] 5. Create Resend account → copy RESEND_API_KEY
[ ] 6. Generate 2x JWT secrets using node command above
[ ] 7. Create ugskill-api/.env with all values above
[ ] 8. Push ugskill-api to GitHub
[ ] 9. Deploy backend to Railway (connect repo, paste env vars in Railway dashboard)
[ ] 10. Set VITE_API_URL and VITE_SOCKET_URL in Vercel dashboard
[ ] 11. Push ugskill-web to GitHub → Vercel auto-deploys
[ ] 12. Test: Register a student account on the live URL
[ ] 13. Test: Login as admin, create a course, create an exam
[ ] 14. Test: Student enrolls, takes exam, sees leaderboard
[ ] 15. Set UptimeRobot monitor on GET /api/v1/health
[ ] 16. (Optional) Set up Sentry DSN for error tracking
[ ] 17. (Optional) Build AI interview bot if you want question-bank-driven AI interviews
```

---

## 📋 Features That Work WITHOUT AI Setup

Everything listed in the "fully built" section above works regardless of AI:
- The AI chat endpoint (`POST /api/v1/ai/chat`) returns a `502` if `AI_EXTERNAL_URL` is not set — nothing else breaks
- Live Interview still works — it is human-to-human via Socket.io
- All exam, course, placement, and leaderboard features are completely independent of AI

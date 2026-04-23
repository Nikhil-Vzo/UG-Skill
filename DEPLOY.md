# ──────────────────────────────────────────────────────────────
#  UGSkill — Complete Deployment Guide
#  Targets: Vercel (Web) · Railway (API) · Docker (Local/Self-host)
# ──────────────────────────────────────────────────────────────

# Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  PRODUCTION                                          │
│                                                      │
│  [Vercel]          [Railway]                         │
│  ugskill-web  ───▶ ugskill-api                       │
│  (React/Vite)      (Node/Express)                    │
│                        │                             │
│                    [Railway]    [Railway]             │
│                    MongoDB      Redis                 │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  LOCAL (Docker)                                      │
│                                                      │
│  localhost:3000  ──▶  localhost:4000  ──▶  mongo     │
│  (web / nginx)        (api)               (compass)  │
└─────────────────────────────────────────────────────┘
```

---

## Part 1 — Deploy Frontend on Vercel

### Step 1: Push to GitHub
Make sure `ugskill-web/` is in your GitHub repo.

### Step 2: Import Project on Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository** → select your repo
3. Set **Root Directory** → `ugskill-web`
4. Framework will auto-detect as **Vite**

### Step 3: Set Environment Variables on Vercel
In Vercel dashboard → Project → **Settings → Environment Variables**:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://your-api.up.railway.app/api/v1` |
| `VITE_SOCKET_URL` | `https://your-api.up.railway.app` |

> ⚠️ **Get the Railway URL first** (Part 2 below), then come back and set these.

### Step 4: Deploy
Click **Deploy**. Vercel auto-deploys on every push to `main`.

---

## Part 2 — Deploy API on Railway

### Step 1: Create a Railway Project
1. Go to [railway.app](https://railway.app) → **New Project**
2. Click **Deploy from GitHub repo** → select your repo
3. Set **Root Directory** → `ugskill-api`

Railway will detect the `Dockerfile` automatically via `railway.toml`.

### Step 2: Add MongoDB on Railway
1. In your Railway project → click **+ New** → **Database** → **MongoDB**
2. Copy the `MONGO_URL` from the MongoDB service variables

### Step 3: Add Redis on Railway
1. Click **+ New** → **Database** → **Redis**
2. Copy the `REDIS_URL` from the Redis service variables

### Step 4: Set Environment Variables on Railway
In your API service → **Variables** tab, add:

```env
NODE_ENV=production
PORT=4000

# From Railway MongoDB service
MONGO_URI=<MONGO_URL from Railway MongoDB>

# From Railway Redis service
REDIS_URL=<REDIS_URL from Railway Redis>

# From your Supabase dashboard
PG_DATABASE_URL=postgresql://postgres:<password>@<host>.supabase.co:5432/postgres

# Generate: openssl rand -hex 64
JWT_SECRET=<64-char hex string>
JWT_REFRESH_SECRET=<different 64-char hex string>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
BCRYPT_ROUNDS=12

# AWS S3
AWS_ACCESS_KEY_ID=<your key>
AWS_SECRET_ACCESS_KEY=<your secret>
AWS_REGION=ap-south-1
AWS_S3_BUCKET=ugskill-media

# Resend Email
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@ugskill.in

# CORS — add your Vercel URL here
CORS_ORIGINS=https://ugskill.vercel.app,https://ugskill.in
```

### Step 5: Deploy
Railway auto-deploys on push. Check **Deployments** tab for logs.

Your API URL will be: `https://ugskill-api-<hash>.up.railway.app`

---

## Part 3 — Local Development with Docker

### Option A: Full Stack (API + Web + DB in Docker)

```bash
# From project root (ugskill/)
docker compose up -d

# Access:
#   Web  → http://localhost:3000
#   API  → http://localhost:4000
#   DB   → mongodb://localhost:27017 (Compass-ready)
```

### Option B: DB Only (API runs with npm run dev)

This is the **recommended daily dev workflow** — fastest hot-reload.

```bash
# Start just MongoDB + Redis in Docker
cd ugskill-api
docker compose -f docker-compose.dev.yml up -d

# Your .env already has:
#   MONGO_URI=mongodb://localhost:27017/ugskill
#   REDIS_URL=redis://localhost:6379

# Then run API natively
npm run dev

# And in another terminal, run frontend
cd ../ugskill-web
npm run dev
```

### MongoDB Compass Connection
After starting Docker containers:

```
Connection URI: mongodb://localhost:27017
Database:       ugskill
```

### Useful Docker Commands

```bash
# View logs
docker compose logs -f api
docker compose logs -f mongo

# Rebuild after code changes
docker compose up -d --build api

# Stop everything and remove volumes
docker compose down -v

# Shell into API container
docker exec -it ugskill-api sh

# Shell into MongoDB
docker exec -it ugskill-mongo mongosh
```

---

## Part 4 — Seed the Database

After the API is running (local or Railway):

```bash
# Seed admin user (run once)
cd ugskill-api
npm run seed:admin

# Seed dev data (optional)
npm run seed:dev
```

---

## Part 5 — Environment Variable Checklist

### ugskill-api (.env for local / Railway Variables for prod)

- [ ] `NODE_ENV`
- [ ] `PORT` (4000)
- [ ] `PG_DATABASE_URL` (Supabase)
- [ ] `MONGO_URI` (Railway MongoDB or Atlas)
- [ ] `REDIS_URL` (Railway Redis)
- [ ] `JWT_SECRET` (64-char hex)
- [ ] `JWT_REFRESH_SECRET` (64-char hex, different)
- [ ] `JWT_ACCESS_EXPIRY` (15m)
- [ ] `JWT_REFRESH_EXPIRY` (7d)
- [ ] `BCRYPT_ROUNDS` (12)
- [ ] `AWS_ACCESS_KEY_ID`
- [ ] `AWS_SECRET_ACCESS_KEY`
- [ ] `AWS_REGION`
- [ ] `AWS_S3_BUCKET`
- [ ] `RESEND_API_KEY`
- [ ] `EMAIL_FROM`
- [ ] `CORS_ORIGINS` (include your Vercel URL)

### ugskill-web (Vercel Environment Variables)

- [ ] `VITE_API_URL` (your Railway API URL + `/api/v1`)
- [ ] `VITE_SOCKET_URL` (your Railway API URL)

---

## Part 6 — Generate JWT Secrets

Run this command to generate secure secrets:

```bash
# On Linux/Mac
openssl rand -hex 64

# On Windows PowerShell
-join ((1..64) | ForEach-Object { '{0:x}' -f (Get-Random -Max 16) })
```

Generate two different values — one for `JWT_SECRET`, one for `JWT_REFRESH_SECRET`.

---

## Files Created / Modified

| File | Purpose |
|---|---|
| `ugskill-api/Dockerfile` | Multi-stage API build for Railway |
| `ugskill-api/railway.toml` | Railway build + deploy config |
| `ugskill-api/docker-compose.dev.yml` | DB-only Docker for daily dev |
| `ugskill-api/.dockerignore` | Keep API image lean |
| `ugskill-web/Dockerfile` | Vite → nginx build for Docker |
| `ugskill-web/nginx.conf` | nginx SPA config with caching |
| `ugskill-web/vercel.json` | Vercel deploy + headers config |
| `ugskill-web/.dockerignore` | Keep web image lean |
| `docker-compose.yml` | Full-stack local Docker compose |
| `DEPLOY.md` | This guide |

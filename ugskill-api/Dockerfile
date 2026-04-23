# ──────────────────────────────────────────────────────────────
#  UGSkill API — Production Dockerfile
#  Multi-stage build: builder → runner
#  Optimized for Railway deployment
# ──────────────────────────────────────────────────────────────

# ── Stage 1: Install dependencies (includes devDeps for build) ──
FROM node:22-alpine AS builder
WORKDIR /app

# Copy manifests first for layer caching
COPY package*.json tsconfig.json ./
RUN npm ci

# Copy source and build TypeScript → JavaScript
COPY src ./src
RUN npm run build

# ── Stage 2: Production deps only ─────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ── Stage 3: Final lean image ─────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Security: run as non-root user
RUN addgroup -S ugskill && adduser -S api -G ugskill
USER api

# Copy only production artifacts
COPY --from=deps   /app/node_modules ./node_modules
COPY --from=builder /app/dist        ./dist
COPY package.json ./

EXPOSE 4000

# Lightweight health check (no curl needed on alpine)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4000/api/v1/health || exit 1

CMD ["node", "dist/server.js"]

# ──────────────────────────────────────────────────────────────
#  UGSkill API — Production Dockerfile
#  Multi-stage build: builder → deps → runner
#  Optimized for Railway deployment
# ──────────────────────────────────────────────────────────────

# ── Stage 1: Build TypeScript ──────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Copy manifests first for better layer caching
COPY package*.json tsconfig.json ./
RUN npm ci

# Copy source and compile
COPY src ./src
RUN npm run build

# ── Stage 2: Install production-only dependencies ─────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# ── Stage 3: Lean production image ────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Security: run as non-root user
RUN addgroup -S ugskill && adduser -S api -G ugskill
USER api

# Copy only what's needed
COPY --from=deps    /app/node_modules ./node_modules
COPY --from=builder /app/dist         ./dist
COPY package.json ./

EXPOSE 4000

# Healthcheck (no curl needed on alpine)
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:4000/api/v1/health || exit 1

CMD ["node", "dist/server.js"]

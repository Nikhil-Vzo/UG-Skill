# ──────────────────────────────────────────────────────────────
#  UGSkill Web — Production Dockerfile
#  Multi-stage: builder (Vite) → runner (nginx)
# ──────────────────────────────────────────────────────────────

# ── Stage 1: Build Vite app ────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Inject build-time env vars if needed (set via --build-arg)
ARG VITE_API_URL
ARG VITE_SOCKET_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

RUN npm run build

# ── Stage 2: Serve with nginx ──────────────────────────────────
FROM nginx:stable-alpine AS runner

# Remove default nginx config
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/ugskill.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/index.html || exit 1

CMD ["nginx", "-g", "daemon off;"]

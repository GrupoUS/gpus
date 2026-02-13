# ── Stage 1: Pruner ── (extracts minimal workspace tree)
FROM oven/bun:1.2-alpine AS pruner
WORKDIR /app
RUN bun add -g turbo@2
COPY . .
RUN turbo prune @repo/api @repo/web --docker

# ── Stage 2: Builder ── (full deps + build both API & Web)
FROM oven/bun:1.2-alpine AS builder
WORKDIR /app

# Install deps from pruned lockfile
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/bun.lock ./bun.lock
RUN bun install --frozen-lockfile

# Copy source and build
COPY --from=pruner /app/out/full/ .

ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_META_APP_ID
ARG VITE_META_CONFIG_ID

ENV NODE_ENV=production

# Build web (Vite) then API (bun build)
RUN cd apps/web && bunx vite build --outDir ../../apps/api/dist/public
RUN cd apps/api && bun build src/_core/index.ts --outdir=dist --target=bun

# ── Stage 3: Production Runtime ──
FROM oven/bun:1.2-alpine AS runtime
WORKDIR /app

# Non-root user
RUN addgroup -g 1001 -S bunuser && \
    adduser -u 1001 -S bunuser -G bunuser

# Copy only production deps (re-install without devDeps)
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bun.lock ./bun.lock
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
RUN bun install --frozen-lockfile --production

# Copy build output (API bundle + frontend static files)
COPY --from=builder /app/apps/api/dist ./dist

# Set ownership
RUN chown -R bunuser:bunuser /app
USER bunuser

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

# Docker health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/health/live || exit 1

CMD ["bun", "dist/index.js"]

# Dockerfile Optimization Guide

## 3-Stage Multi-Stage Build

### Stage 1 — Dependencies (production only)

```dockerfile
FROM oven/bun:1.2-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
```

- Uses Alpine for smaller footprint
- Installs only production deps (no devDependencies)
- Cached independently — only re-runs when `package.json`/`bun.lock` change

### Stage 2 — Builder (full deps + build)

```dockerfile
FROM oven/bun:1.2-alpine AS builder
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_META_APP_ID
ARG VITE_META_CONFIG_ID

ENV NODE_ENV=production
RUN bun run build
```

- Full deps needed for TypeScript compilation and Vite build
- `ARG` for Vite env vars (embedded at build time)
- Output: `dist/public/` (frontend) + `dist/index.js` (backend)

### Stage 3 — Production Runtime

```dockerfile
FROM oven/bun:1.2-alpine AS runtime
WORKDIR /app

# Non-root user
RUN addgroup -g 1001 -S bunuser && \
    adduser -u 1001 -S bunuser -G bunuser

# Copy production deps from stage 1
COPY --from=deps /app/node_modules ./node_modules

# Copy build output and package.json from stage 2
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Set ownership
RUN chown -R bunuser:bunuser /app
USER bunuser

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

# Docker health check (used by docker-compose depends_on: condition)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/health/live || exit 1

CMD ["bun", "dist/index.js"]
```

## Key Decisions

| Decision | Rationale |
|---|---|
| Alpine base | Reduces image ~200MB → ~80MB |
| Non-root user (UID 1001) | Prevents privilege escalation in container |
| 3-stage (deps separate from builder) | Avoids devDependencies in final image |
| `--frozen-lockfile` | Deterministic builds |
| `wget` healthcheck (not `curl`) | `curl` not available in Alpine by default |
| `127.0.0.1` in healthcheck | Avoids `localhost` fallback to `::1` on Alpine/BusyBox |
| No `--smol` flag | Trades CPU for memory — not beneficial with 4GB+ RAM |

## .dockerignore

Ensure build context is minimal:

```
node_modules
dist
.git
.github
.gitignore
.agent
.gemini
.kilocode
.cursor
.vscode
.idea
docs
*.md
!README.md
**/*.test.ts
**/*.spec.ts
**/__tests__
attached_assets
Dockerfile
docker-compose*.yml
.dockerignore
railway.json
.env
.env.*
!.env.example
*.log
.DS_Store
coverage
```

## Image Size Targets

| Base | Expected Size |
|---|---|
| `oven/bun:1.2` (Debian) | ~180-200MB |
| `oven/bun:1.2-alpine` | ~80-100MB |

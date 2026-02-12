# Stage 1: Pruner
FROM oven/bun:1 AS pruner
WORKDIR /app
RUN bun add -g turbo
COPY . .
RUN turbo prune @repo/api --docker

# Stage 2: Builder
FROM oven/bun:1 AS builder
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/bun.lock ./bun.lock
RUN bun install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN turbo run build --filter=@repo/api

# Stage 3: Runner
FROM oven/bun:1-slim AS runner
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3001
CMD ["bun", "run", "dist/index.js"]

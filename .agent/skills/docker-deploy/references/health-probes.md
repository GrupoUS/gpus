# Health Probes & Metrics

## Endpoints

| Endpoint | Purpose | Used By |
|---|---|---|
| `GET /health/live` | Process alive check | Docker HEALTHCHECK, Traefik LB |
| `GET /health/ready` | App ready + deps healthy | Traefik routing decisions |
| `GET /metrics` | Prometheus-compatible metrics | Monitoring stack |

## Implementation

### Prerequisites

Export Redis client from `server/_core/sessionCache.ts`:

```typescript
/**
 * Get Redis client instance for health checks.
 * Returns null if Redis is not initialized.
 */
export function getRedisClient(): Redis | null {
  return redis;
}
```

### State Variables

Add to `server/_core/index.ts` (inside `startServer()`, after `createServer`):

```typescript
let isReady = false;
let isShuttingDown = false;
```

### Health Check Helpers

```typescript
async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const { getDb } = await import("../db");
    const { sql } = await import("drizzle-orm");
    const db = getDb();
    const result = await db.execute(sql`SELECT 1 as health`);
    return result.rows.length > 0;
  } catch (error) {
    console.error("Database health check failed:", error);
    return false;
  }
}

async function checkRedisHealth(): Promise<boolean> {
  try {
    const { getRedisClient } = await import("./sessionCache");
    const redis = getRedisClient();
    if (!redis) return false;
    await redis.ping();
    return true;
  } catch (error) {
    console.error("Redis health check failed:", error);
    return false;
  }
}
```

### Liveness Probe

Fast, no dependency checks. Returns 503 during shutdown.

```typescript
app.get("/health/live", (_req, res) => {
  if (isShuttingDown) {
    return res.status(503).send("Shutting down");
  }
  res.status(200).send("OK");
});
```

### Readiness Probe

Checks critical dependencies. Redis failure is a warning (fallback mode exists).

```typescript
app.get("/health/ready", async (_req, res) => {
  if (!isReady || isShuttingDown) {
    return res.status(503).send("Not ready");
  }

  const dbHealthy = await checkDatabaseHealth();
  const redisHealthy = await checkRedisHealth();

  if (!dbHealthy) {
    return res.status(503).send("Database unavailable");
  }

  if (!redisHealthy) {
    console.warn("Redis unavailable, using in-memory fallback");
  }

  res.status(200).send("Ready");
});
```

### Metrics Endpoint

Prometheus exposition format. Basic memory + uptime metrics.

```typescript
app.get("/metrics", (_req, res) => {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();

  const metrics = `
# HELP neondash_memory_heap_used_bytes Heap memory used
# TYPE neondash_memory_heap_used_bytes gauge
neondash_memory_heap_used_bytes ${memUsage.heapUsed}

# HELP neondash_memory_rss_bytes Resident set size
# TYPE neondash_memory_rss_bytes gauge
neondash_memory_rss_bytes ${memUsage.rss}

# HELP neondash_uptime_seconds Process uptime in seconds
# TYPE neondash_uptime_seconds counter
neondash_uptime_seconds ${uptime}
  `.trim();

  res.set("Content-Type", "text/plain");
  res.send(metrics);
});
```

### Initialization

Set `isReady = true` after server starts and schedulers are initialized:

```typescript
async function initialize() {
  console.log("Initializing Neondash application...");

  initSchedulers().catch((error) => {
    console.error("[scheduler] Failed to initialize schedulers:", error);
  });

  isReady = true;
  console.log(`Server ready at http://${host}:${port}`);
}

initialize().catch((error) => {
  console.error("Failed to initialize application:", error);
  process.exit(1);
});
```

## Endpoint Placement

Health probes MUST be registered **before** Clerk middleware and body parsers to avoid auth overhead on health checks.

Register order in `index.ts`:
1. Health probes (`/health/live`, `/health/ready`, `/metrics`)
2. Stripe webhook (raw body)
3. Clerk webhook (raw body)
4. Body parsers (JSON, URL-encoded)
5. Clerk middleware
6. tRPC routes

## Testing

```bash
# Liveness
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health/live
# Expected: 200

# Readiness
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health/ready
# Expected: 200 (when DB is up)

# Metrics
curl -s http://localhost:3000/metrics | head -10
# Expected: Prometheus format with neondash_* metrics
```

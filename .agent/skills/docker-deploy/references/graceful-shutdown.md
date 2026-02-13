# Graceful Shutdown

## Shutdown Sequence

```
SIGTERM received
  ↓
1. Set isShuttingDown = true  (health probes → 503)
  ↓
2. server.close()             (stop accepting new connections)
  ↓
3. Wait grace period          (10s default, in-flight requests complete)
  ↓
4. Close Redis connection     (redis.quit())
  ↓
5. Stop schedulers            (stopSchedulers())
  ↓
6. process.exit(0)
```

## Implementation

Replace the existing `shutdown` function and signal handlers in `server/_core/index.ts`:

```typescript
async function gracefulShutdown(signal: string) {
  console.log(`Received ${signal}, starting graceful shutdown...`);

  // Health probes return 503, Traefik stops routing
  isShuttingDown = true;

  // Stop accepting new connections
  server.close(() => {
    console.log("HTTP server closed");
  });

  // Wait for in-flight requests
  const gracePeriod = parseInt(process.env.SHUTDOWN_GRACE_PERIOD || "10000");
  console.log(`Waiting ${gracePeriod}ms for in-flight requests...`);
  await new Promise((resolve) => setTimeout(resolve, gracePeriod));

  // Close Redis
  try {
    console.log("Closing Redis connection...");
    const { getRedisClient } = await import("./sessionCache");
    const redis = getRedisClient();
    if (redis) {
      await redis.quit();
    }
  } catch (error) {
    console.error("Error closing Redis:", error);
  }

  // Stop schedulers
  try {
    console.log("Stopping schedulers...");
    stopSchedulers();
  } catch (error) {
    console.error("Error stopping schedulers:", error);
  }

  console.log("Graceful shutdown complete");
  process.exit(0);
}
```

### Signal Handlers

```typescript
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled rejection at:", promise, "reason:", reason);
  gracefulShutdown("unhandledRejection");
});
```

## Configuration

| Env Var | Default | Purpose |
|---|---|---|
| `SHUTDOWN_GRACE_PERIOD` | `10000` | Milliseconds to wait for in-flight requests |

## Why This Order Matters

1. **`isShuttingDown = true` first**: Health probes return 503, Traefik stops sending traffic
2. **`server.close()` second**: No _new_ TCP connections accepted
3. **Grace period third**: In-flight requests (SSE, long queries) get time to finish
4. **Redis/Schedulers last**: These support in-flight requests, so close after grace period

## Docker Integration

Docker sends `SIGTERM` when stopping a container, then `SIGKILL` after the stop timeout (default 10s).

Set `stop_grace_period` in docker-compose to match:

```yaml
services:
  app:
    stop_grace_period: 15s  # 10s grace + 5s buffer
```

## Testing

```bash
# Start server
bun run dev &
SERVER_PID=$!

# Send SIGTERM
kill -TERM $SERVER_PID

# Expected log output:
# Received SIGTERM, starting graceful shutdown...
# Waiting 10000ms for in-flight requests...
# HTTP server closed
# Closing Redis connection...
# Stopping schedulers...
# Graceful shutdown complete
```

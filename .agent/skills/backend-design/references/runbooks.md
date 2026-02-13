# Backend Runbooks — Complex Failure Response

Use this document during incident triage and postmortem-driven hardening.

## Incident Handling Protocol

1. Stabilize blast radius.
2. Preserve evidence with correlation IDs and recent deploy markers.
3. Identify failure domain and execute runbook.
4. Apply minimal safe mitigation.
5. Validate recovery with explicit checks.
6. Define prevention changes before close.

---

## Runbook 1 — Auth or Context Drift

### Symptoms

- Authenticated users receive inconsistent authorization outcomes.
- Role checks pass in one route and fail in another.
- Mentorado context missing intermittently.

### Likely Causes

- Session cache stale after profile or role updates.
- Webhook invalidation missed.
- Context build race across read-after-write updates.

### Diagnostics

1. Correlate failing requests by `requestId` and actor id.
2. Compare cache entry data with source-of-truth user record.
3. Verify webhook ingest and invalidation logs for recent actor changes.
4. Inspect middleware ordering for auth and context setup.

### Mitigation

- Force targeted cache invalidation and source refresh for affected actors.
- Temporarily tighten cache TTL while incident remains active.
- Reprocess missed auth update events if queue supports replay.

### Prevention

- Add divergence metrics between cache and source fields.
- Add deterministic context build assertions for required role fields.
- Add synthetic tests for role transition scenarios.

---

## Runbook 2 — Session Cache Inconsistency

### Symptoms

- Stale user data persists after update.
- Different app nodes return inconsistent actor profile.

### Likely Causes

- Redis write succeeded but memory write failed.
- Memory refreshed from stale fallback path.
- Invalidations executed only in one layer.

### Diagnostics

1. Compare Redis and memory values for same actor.
2. Review cache write error logs and layer-specific counters.
3. Validate invalidation events include both cache layers.

### Mitigation

- Flush in-memory layer for affected key range.
- Enforce Redis-read priority for high-risk paths until stable.

### Prevention

- Emit `cache_layer_divergence` metric and alert.
- Make dual-write failure explicit, never silent.

---

## Runbook 3 — Webhook Loss or Retry Storm

### Symptoms

- Expected side effects absent after provider event.
- Duplicate side effects due to repeated deliveries.
- Backlog growth after process restart.

### Likely Causes

- In-memory queue state lost on restart.
- Event dedup missing or broken.
- Provider retry policy colliding with long processing time.

### Diagnostics

1. Verify signature check pass and event-id dedup behavior.
2. Inspect ingress persistence and queue depth trends.
3. Identify oldest unprocessed event age and retry distribution.

### Mitigation

- Switch processing to replay from durable ingress if available.
- Pause non-critical downstream side effects.
- Apply rate shaping and worker concurrency control.

### Prevention

- Persist critical ingress before ACK.
- Keep dead-letter flow and replay command documented.
- Add idempotency key checks at mutation points.

---

## Runbook 4 — DB Latency Regression

### Symptoms

- p95 and p99 request latency spike on DB-dependent routes.
- Increased timeout and connection failure rates.

### Likely Causes

- Missing index for new predicate.
- Query shape change increased scanned rows.
- Migration changed table behavior or lock profile.

### Diagnostics

1. Identify top slow operations by route and query signature.
2. Compare before and after deploy query patterns.
3. Inspect query plan and index usage for degraded paths.

### Mitigation

- Roll back offending query path or deploy hotfix projection.
- Add or adjust index for high-frequency filter.
- Reduce route workload via temporary feature degradation.

### Prevention

- Require post-migration critical query validation.
- Add latency SLO checks in CI gating for critical endpoints.

---

## Runbook 5 — External API Rate Limiting or Degradation

### Symptoms

- Provider 429 and timeout spikes.
- Cascading failures into core routes.

### Likely Causes

- Missing outbound concurrency controls.
- Retry policy amplifying provider saturation.
- No degrade-mode path for optional external features.

### Diagnostics

1. Break down provider errors by status class and endpoint.
2. Inspect adapter retry behavior and backoff correctness.
3. Check queue depth and pending external call count.

### Mitigation

- Enforce strict outbound budget and concurrency cap.
- Disable non-essential provider calls behind feature flag.
- Respect retry-after semantics for 429 responses.

### Prevention

- Add circuit breaker threshold and half-open strategy.
- Add per-provider SLO dashboards and alerts.

---

## Runbook 6 — Migration Regression

### Symptoms

- Runtime errors after migration deploy.
- API contracts break due to schema mismatch.

### Likely Causes

- Backward incompatible schema change.
- Application code deployed out of compatibility order.
- Data backfill assumptions violated.

### Diagnostics

1. Compare deployed schema version and app commit compatibility.
2. Identify failing routes and affected columns/tables.
3. Validate backfill completion and null-safety assumptions.

### Mitigation

- Execute defined rollback or roll-forward fix path.
- Re-enable compatibility mode in feature flags if available.

### Prevention

- Enforce expand-then-contract migration strategy.
- Require rollback rehearsal for high-risk migrations.

---

## Runbook 7 — Hono Phase 1 Regression

### Symptoms

- `/api/trpc` starts returning 404/500 after runtime swap.
- Authenticated routes intermittently return 401/403.
- Webhooks fail signature validation after migration.
- SSE clients connect but stop receiving events or leak connections.

### Likely Causes

- Incorrect middleware order in Hono app.
- Context creation still coupled to Express request types.
- Raw body handling changed before signature verification.
- SSE response object mismatch between web response and Node outgoing response.

### Diagnostics

1. Verify middleware order is exactly: `logger` → `cors` → `secureHeaders` → `clerkMiddleware`.
2. Confirm `trpcServer` is mounted at `/api/trpc/*` with `endpoint: "/api/trpc"`.
3. Reproduce Stripe/Clerk/Meta webhook validation with known invalid signatures.
4. Inspect SSE client registration/removal counts before and after connection close.
5. Run `bun run check` and `bun test server` to isolate compile/runtime regressions.

### Mitigation

- Roll back only the last migrated subsystem commit (not full migration).
- Re-enable prior webhook handler implementation for affected provider.
- Temporarily disable non-critical SSE broadcasts while stabilizing connection lifecycle.
- Apply fallback `streamSSE` pattern if Node outgoing binding is unstable.

### Prevention

- Keep migration in atomic commits per subsystem (`context`, `webhooks`, `sse`, `core`).
- Add smoke checks for health, tRPC, webhook signatures, and SSE close cleanup in CI.
- Keep explicit compatibility notes for every endpoint path contract during migration.

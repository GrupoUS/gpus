# Infrastructure — Cache, Queueing, Schedulers, Limits, Observability

Use infrastructure patterns that survive process restarts, traffic spikes, and provider instability.

## Session Cache Architecture

### Dual-Write Model

Use Redis as authoritative cache and in-memory map as performance fallback.

```
read path:
request -> redis lookup -> memory fallback -> db/source sync -> cache repopulate

write path:
session update -> redis write -> memory write -> emit consistency metric

invalidate path:
auth webhook -> redis delete + memory delete -> verify deletion signal
```

### Consistency Guardrails

- Use identical TTL semantics across Redis and memory layers.
- Treat Redis failure as degraded mode, not silent success.
- Emit `cache_write_failed` and `cache_layer_divergence` signals.
- Add periodic reconciliation for high-risk actor records.

### Failure Domains

- Redis unavailable.
- Memory stale after process restart.
- Webhook invalidation missed or delayed.
- Concurrent writes producing stale reads.

Run incident response from [`runbooks.md`](runbooks.md).

## Webhook Queueing Reliability

When in-memory queues exist, treat them as best-effort only.

Required controls:

1. Persist critical ingress events to durable store before ACK when feasible.
2. Keep dedup key by provider event id.
3. Track queue depth, oldest event age, failure count.
4. Define replay process for lost in-memory state after restart.
5. Implement dead-letter policy for poison events.

## Scheduler Limits and Workload Design

Scheduler jobs must be idempotent and catch-up safe.

Rules:

- Use deterministic job keys to prevent duplicate side effects.
- Apply execution deadline and max runtime per tick.
- Split heavy scans into chunked batches with continuation markers.
- Guard against overlap with lock or lease mechanism.
- Record job watermark and last successful run.

## Rate Limiting and Backpressure

Implement layered controls:

- Edge/API limit for global abuse protection.
- Auth-sensitive limit for login and token flows.
- Provider-specific outbound limit and retry-after handling.
- Internal backpressure when queue depth or latency breaches threshold.

Design objective: fail fast under overload, preserve core flows.

## Observability Baseline

### Logs

Log schema should include:

- `requestId`
- `actorId` or anonymous marker
- `route` and procedure name
- `operation`
- `durationMs`
- `outcome`
- `errorClass` and `errorCode`

### Metrics

Collect at minimum:

- Request volume, error rate, tail latency.
- Cache hit rate and cache divergence rate.
- Webhook ingest rate, retries, dead-letter volume.
- DB query latency and timeout counts.
- External API timeout, 429, and 5xx rates.

### Alerts

Alert on sustained threshold breaches rather than single spikes.

## ENV and Secret Handling

- Centralize environment access in typed config module.
- Validate required variables at startup.
- Never read `process.env` directly in routers/services.
- Separate optional integration config from required core config.
- Rotate provider secrets with documented rollout steps.

## Do / Don’t

Do:

- Prefer durable state for critical queues.
- Prefer explicit degraded-mode responses.
- Prefer replayable event processing.

Don’t:

- Don’t hide cache write failures.
- Don’t run unbounded scheduler scans.
- Don’t ACK webhook payloads before trust and persistence checks on critical flows.

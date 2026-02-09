# Operational Guardrails — Resilience, Observability, Security, Rollback, Validation

Use these guardrails as mandatory controls for backend PR readiness and production hardening.

## 1. Resilience Guardrails

- Ensure idempotency on webhook and scheduler mutation paths.
- Use bounded retries with backoff and jitter for transient external failures.
- Define degraded-mode behavior for optional integrations.
- Protect critical paths from non-critical downstream dependencies.
- Keep durable recovery path for events that must not be lost.

## 2. Observability Guardrails

- Emit structured logs with request and actor correlation.
- Maintain service-level metrics for volume, error, latency, and saturation.
- Add operation metrics for cache, webhook, scheduler, and external adapters.
- Define alert thresholds tied to SLO error budget burn and latency risk.
- Keep dashboards with both route and dependency perspectives.

## 3. Security Guardrails

- Validate all incoming data at boundary.
- Enforce authorization at procedure middleware and domain checks.
- Centralize secret and environment access in typed module.
- Avoid exposing internal stack traces or provider payloads to clients.
- Record security-sensitive actions with auditable metadata.

## 4. Rollback Guardrails

- Include rollback strategy for all high-risk changes.
- Use expand-then-contract for schema evolution.
- Keep feature flag switch for non-essential risky behavior.
- Preserve replay path for integration events during rollback.
- Validate rollback in staging-like environment before merge for high-risk paths.

## 5. SLO-Minded Validation

### Minimum SLO Lens

- Availability target by critical route group.
- Latency targets for p95 and p99 on top endpoints.
- Error budget tracking for dependency-induced failures.

### Validation Requirements

- Run static checks and tests.
- Run targeted integration checks on auth, cache, webhook, DB, and provider adapters.
- Validate migration compatibility and data safety.
- Validate incident diagnostics are actionable from logs and metrics alone.

## PR Readiness Checklist

### Architecture and Contracts

- [ ] Procedure boundary is correct for trust level.
- [ ] Request lifecycle remains coherent end-to-end.
- [ ] Service boundaries isolate provider coupling.

### Reliability

- [ ] Idempotency exists for retryable mutation paths.
- [ ] Queueing and scheduler failure modes are addressed.
- [ ] Cache consistency strategy includes divergence detection.

### Performance

- [ ] Query plan risk reviewed for changed DB paths.
- [ ] Route latency impact evaluated for critical flows.
- [ ] External adapter timeout and concurrency budgets set.

### Security

- [ ] Input validation and authz checks are explicit.
- [ ] Secret handling follows typed config policy.
- [ ] No sensitive payload leakage in errors/logs.

### Operability

- [ ] Alerts and dashboards updated for new failure domains.
- [ ] Runbook entries updated for incident response.
- [ ] Rollback and recovery steps documented and testable.

### Final Gates

- [ ] `bun run check`
- [ ] `bun run lint:check`
- [ ] `bun run test`


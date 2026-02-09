# Debugging Strategy Matrix — Symptom to Cause to Diagnostics to Fix to Prevention

Use this matrix for high-velocity triage and consistent remediation.

| Symptom | Likely Cause | Diagnostics | Fix | Prevention |
|---|---|---|---|---|
| Intermittent unauthorized in protected routes | Stale cache or auth/context drift | Compare cache vs source user record, inspect middleware order | Invalidate actor cache and rebuild context path | Add cache divergence alerts and role transition tests |
| Role mismatch between endpoints | Inconsistent context derivation | Trace request logs by actor and endpoint, compare context fields | Centralize role resolution logic | Add contract tests for role-sensitive procedures |
| Mentorado context null for valid actor | Linkage query drift or stale session | Verify linkage query and recent user sync events | Re-sync linkage and tighten null handling at boundary | Add synthetic checks for mentorado-required routes |
| Duplicate webhook side effects | Missing idempotency guard | Inspect dedup key handling and event-id history | Add idempotency keys and conflict-safe writes | Enforce dedup checks in ingress and mutation layer |
| Missing webhook side effects after restart | In-memory queue loss | Review process restart timeline and queue persistence | Replay from durable ingress where possible | Persist critical events before ACK |
| Sudden p95 latency increase | New query shape or missing index | Compare query plans and slow operation logs | Add index or adjust query projection/filter order | Add performance checks on critical paths pre-merge |
| Elevated DB timeout rate | Overloaded route or heavy scan | Map timeouts to query signatures and route volume | Degrade optional route features and optimize hot query | Define SLO thresholds with alerting and autoscaling tactics |
| Frequent external API 429 | Outbound concurrency too high | Inspect adapter request rate and retry behavior | Cap concurrency and honor retry-after | Provider budget governance and rate dashboards |
| Retry storm against provider | Aggressive retry strategy | Trace retry attempts and interval patterns | Implement bounded exponential backoff with jitter | Circuit breaker with open-state cooldown |
| Migration broke API contract | Backward-incompatible schema change | Compare schema version against app expectations | Roll back or roll forward with compatibility shim | Expand-contract migration strategy with staged rollout |
| Cache hit rate collapsed | Redis instability or key mismatch | Inspect redis errors and key prefix usage | Fail to fallback path safely and restore key strategy | Cache health checks and standardized key contracts |
| Scheduler duplicate execution | Missing lock or idempotency key | Check overlapping run logs and lease behavior | Add lease lock and deterministic execution key | Scheduler framework checklist in PR gate |

## Triage Prioritization

1. Security and auth correctness.
2. Data integrity and duplication risk.
3. Availability and latency SLO impact.
4. Feature correctness for non-critical paths.

## Evidence Collection Minimum

- Correlation IDs for failing and healthy samples.
- Deploy SHA and migration identifier around onset.
- Impacted route list and actor scope.
- Error-rate and latency trend snapshots.


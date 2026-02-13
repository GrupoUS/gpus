# Clerk ↔ Neon Sync Contract (Canonical)

Defines ownership, precedence, and consistency guarantees between Clerk metadata and Neon runtime state.

Related docs:
- `../SKILL.md`
- `./clerk-rbac-patterns.md`
- `./db-schema-blueprints.md`
- `./stripe-webhook-lifecycle.md`

## 1) Ownership and Precedence

- Identity source: Clerk (`clerk_user_id`, authentication lifecycle).
- Effective authorization source: Neon (`users`, `user_permissions`).
- Billing source: Stripe (projected into Neon `subscriptions`).
- Clerk metadata is projection for UI, never sole runtime authority.

When values diverge:
1. If Neon has newer revision/timestamp, Neon wins and projects back to Clerk.
2. If authoritative source event is newer (Clerk identity event or Stripe billing event), Neon updates then projects.

## 2) Sync Objects

### Clerk -> Neon (ingress)
- `user.created`, `user.updated`, `user.deleted`.
- Extract identity fields and approved metadata fields.

### Neon -> Clerk (projection)
- `role`, `permissions` snapshot, `billingPlan`, `billingStatus`, `trialEndsAt`, `neonRevision`, `lastSyncedAt`.

## 3) Consistency Guarantees

- At-least-once event delivery tolerated.
- Exactly-once effect via `integration_events (source,event_id)` dedup.
- Out-of-order handling using `occurred_at` and/or monotonic `neon_revision`.
- Replay safe: duplicate events become no-op.

## 4) Processing Algorithm (High Level)

1. Verify signature/auth of source event.
2. Compute `payload_hash` and check dedup key.
3. If already processed: return success no-op.
4. Begin DB transaction.
5. Apply deterministic state transition iff event is newer than last known revision/time.
6. Increment `neon_revision` (when authorization/entitlement effective state changes).
7. Store processed event row.
8. Commit transaction.
9. Project resulting summary to Clerk metadata (retryable).

## 5) Failure and Retry Rules

- If DB transaction fails: do not mark event processed.
- If Clerk projection fails after DB commit: enqueue retry job; Neon remains authoritative.
- Projection retries must be idempotent (replace by revision).

## 6) Contract for Admin Role Updates

- Admin action writes Neon authoritative records first.
- Neon increments revision and writes audit.
- Service projects to Clerk metadata with same revision.
- Frontend reads merged backend response and refreshes token as needed.

## 7) Anti-Patterns

- Bidirectional blind overwrite (last writer without revision checks).
- Trusting Clerk token metadata for critical backend authorization.
- Skipping dedup table under assumption of exactly-once delivery.

## 8) Validation Checklist

- [ ] Dedup table exists and is used on every event.
- [ ] Revision/timestamp checks implemented.
- [ ] Clerk projection retries exist.
- [ ] Admin mutations and webhook mutations share same transition service.

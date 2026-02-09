# Stripe Webhook Lifecycle (Canonical)

Defines event matrix, entitlement transitions, and replay/out-of-order handling.

Related docs:
- `../SKILL.md`
- `./stripe-billing.md`
- `./db-schema-blueprints.md`
- `./clerk-neon-sync-contract.md`

## 1) Required Events

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.trial_will_end`

## 2) Event Matrix

| Event | Preconditions | DB Actions | Entitlement Outcome | Clerk Projection |
|---|---|---|---|---|
| checkout.session.completed | session has user reference | link `stripe_customer_id`/`stripe_subscription_id` | no final entitlement until sub status resolved | update ids only |
| customer.subscription.created | valid subscription | upsert subscription state | `trialing` or `active` per payload | mirror status/plan |
| customer.subscription.updated | known subscription | update plan/status/period/trial end | activate/deactivate capabilities by status | mirror status/plan |
| customer.subscription.deleted | known subscription | set canceled + period end | restrict entitlements per policy | mirror canceled |
| invoice.paid | active subscription | mark paid cycle metadata | keep/restore active entitlements | mirror active |
| invoice.payment_failed | charge failure | mark `past_due`/`unpaid` | dunning restrictions | mirror failed status |
| customer.subscription.trial_will_end | trial user | store reminder checkpoint | no entitlement change yet | optional projection |

## 3) Mentorado Conversion Logic

- During `trial_mentorado`: role remains `mentorado` with mentorship scope.
- On paid activation (`customer.subscription.updated` -> `active` after trial):
  - transition role `mentorado -> clinica_owner`
  - apply owner permission set
  - maintain tenant ownership consistency

If payment does not activate:
- keep non-paid restrictions and require billing recovery flow.

## 4) Idempotency and Replay

Mandatory:
- dedup key = `(source='stripe', event_id)` in `integration_events`.
- ignore duplicate event IDs.
- compare event `created` timestamp with `last_stripe_event_ts`; skip stale updates.
- transitions must be deterministic and side-effect guarded.

## 5) Out-of-Order Handling

Rules:
- Never regress from newer active state to older stale status.
- Ignore older payloads when `event_time < last_stripe_event_ts`.
- Keep audit of ignored stale events.

## 6) Webhook Endpoint Requirements

- Verify Stripe signature.
- Use raw body parser for signature verification.
- Process within transaction boundaries for state + dedup.
- Return 2xx only after deterministic commit/no-op.

## 7) Anti-Patterns

- Making role conversion in frontend checkout success page.
- Writing entitlements before dedup check.
- Using non-transactional updates for subscription + permissions.

## 8) Validation Checklist

- [ ] All required events are handled.
- [ ] Event matrix behavior matches implementation.
- [ ] Dedup + stale-event checks are present.
- [ ] Mentorado auto-conversion path is deterministic.

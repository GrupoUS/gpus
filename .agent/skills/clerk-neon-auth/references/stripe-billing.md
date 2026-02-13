# Stripe Billing Engineering (Canonical)

Defines plans, conversion rules, and entitlement semantics.

Related docs:
- `../SKILL.md`
- `./stripe-webhook-lifecycle.md`
- `./clerk-neon-sync-contract.md`
- `./db-schema-blueprints.md`

## 1) Plans

- `basic_193`: recurring R$193/month.
- `pro_433`: recurring R$433/month.
- `trial_mentorado`: 12-month free mentorship period (100% coupon or explicit trial lifecycle strategy).

## 2) Entitlement Policy

### By role and billing state

- `admin`: unaffected by subscription plan.
- `mentorado` during trial window: mentorship access only.
- `clinica_owner` paid active (`basic_193` or `pro_433`): clinic modules enabled.
- `clinica_staff`: clinic subset enabled via owner tenant and owner entitlement.

### AI/advanced features

If app differentiates features by plan:
- `pro_433`: full advanced feature set.
- `basic_193`: limited feature set.
- Trial period behavior must be explicit and documented in product policy.

## 3) Mentorado 12-Month Lifecycle

1. Admin assigns `mentorado`.
2. Billing profile created with 12-month free policy.
3. Trial reminders issued before expiration.
4. At trial end, system attempts automatic conversion to paid (`basic_193` or `pro_433` based on configured default/user choice).
5. On successful paid activation, role transitions to `clinica_owner`.
6. On payment failure/cancel, entitlements are restricted according to policy.

## 4) Event-Driven Provisioning

Provisioning source is Stripe webhook events (not client redirects).

- Checkout completion links customer/subscription IDs.
- Subscription status events update entitlement states.
- Invoice events adjust dunning/past-due behavior.

See event matrix in `./stripe-webhook-lifecycle.md`.

## 5) Data Contract (minimal)

Persist at least:
- `stripe_customer_id`
- `stripe_subscription_id`
- `billing_plan`
- `billing_status`
- `current_period_end`
- `trial_ends_at`
- `last_stripe_event_ts`

## 6) Anti-Patterns

- Granting entitlements from frontend success URL alone.
- Ignoring out-of-order webhook arrivals.
- Overwriting active state with older event payload.

## 7) Validation Checklist

- [ ] Plans exactly match R$193 / R$433.
- [ ] Trial lifecycle includes automatic conversion path.
- [ ] Provisioning is webhook-first.
- [ ] Billing state mirrored to Clerk as projection only.

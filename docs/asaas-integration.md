# Asaas Integration (Webhook Sync)

## Architecture overview

- Webhook endpoint: `https://<deployment>.convex.site/asaas/webhook`
- Auth: `asaas_signature` (HMAC SHA-256) preferred, `asaas-access-token` fallback
- Idempotency: `payload.id` stored in `asaasWebhooks` and checked before enqueue
- Processing: HTTP action logs event, schedules `processWebhookEvent` action
- Storage: webhook payloads are encrypted (LGPD) and retained for 90 days
- Retries: failed events are retried every 5 minutes with exponential backoff

## Environment setup

- `ASAAS_WEBHOOK_SECRET` (HMAC signature verification)
- `ASAAS_WEBHOOK_TOKEN` (legacy token auth fallback)
- `ASAAS_API_KEY` (Asaas API access)
- `ASAAS_BASE_URL` (optional, defaults to `https://api.asaas.com/v3`)
- `ASAAS_ENVIRONMENT` (`sandbox` or `production`)
- `ENCRYPTION_KEY` (required for LGPD payload encryption)

Set these in `.env.local` for development and in the Convex Dashboard for prod.

## Webhook configuration

1. Asaas Dashboard > Integrations > Webhooks
2. URL: `https://<deployment>.convex.site/asaas/webhook`
3. Auth token: match `ASAAS_WEBHOOK_SECRET` or `ASAAS_WEBHOOK_TOKEN`
4. Events: all `PAYMENT_*` and `SUBSCRIPTION_*` events
5. Delivery: sequential (recommended)

Development-only test endpoint:
`POST /asaas/webhook/test` (disabled in production)

## Troubleshooting

- 401 Unauthorized: signature/token mismatch
- 400 Bad Request: missing `id`, `event`, or entity payload
- Webhook stuck: check `asaasWebhooks.status` and `asaasWebhooks.error`
- Processing failures: check `asaasAlerts` for data integrity alerts
- Persistent failures: verify student/customer linkage (asaasCustomerId)

## Event reference

Payment events:
- `PAYMENT_CREATED`
- `PAYMENT_CONFIRMED`
- `PAYMENT_RECEIVED`
- `PAYMENT_OVERDUE`
- `PAYMENT_REFUNDED`
- `PAYMENT_DELETED`
- `PAYMENT_UPDATED`

Subscription events:
- `SUBSCRIPTION_CREATED`
- `SUBSCRIPTION_UPDATED`
- `SUBSCRIPTION_INACTIVATED`
- `SUBSCRIPTION_DELETED`

Customer events (if enabled in Asaas):
- `CUSTOMER_CREATED`
- `CUSTOMER_UPDATED`

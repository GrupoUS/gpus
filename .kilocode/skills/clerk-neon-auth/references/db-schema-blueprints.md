# DB Schema Blueprints (SQL + Prisma)

Canonical schema blueprint for users, subusers, permissions, subscriptions, and event idempotency.

Related docs:
- `../SKILL.md`
- `./role-architecture.md`
- `./neon-data-isolation.md`
- `./clerk-neon-sync-contract.md`
- `./stripe-webhook-lifecycle.md`

## 1) PostgreSQL SQL Blueprint

```sql
-- enums
create type app_role as enum ('admin','mentorado','clinica_owner','clinica_staff','pending');
create type billing_plan as enum ('none','trial_mentorado','basic_193','pro_433');
create type billing_status as enum ('none','trialing','active','past_due','unpaid','canceled','incomplete');

-- users (authoritative runtime identity projection)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  email text not null,
  role app_role not null default 'pending',
  tenant_owner_user_id uuid null references users(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (role = 'clinica_staff' and tenant_owner_user_id is not null)
    or (role <> 'clinica_staff')
  )
);

-- permissions (effective set)
create table if not exists user_permissions (
  user_id uuid not null references users(id) on delete cascade,
  permission_key text not null,
  granted boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (user_id, permission_key)
);

-- subscriptions (stripe projection)
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text not null unique,
  billing_plan billing_plan not null default 'none',
  billing_status billing_status not null default 'none',
  current_period_end timestamptz null,
  trial_ends_at timestamptz null,
  last_stripe_event_ts timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, stripe_customer_id)
);

-- event idempotency
create table if not exists integration_events (
  source text not null, -- clerk|stripe|sync
  event_id text not null,
  aggregate_key text null,
  occurred_at timestamptz null,
  processed_at timestamptz not null default now(),
  payload_hash text null,
  status text not null default 'processed',
  primary key (source, event_id)
);

-- sync revisions
create table if not exists identity_sync_state (
  user_id uuid primary key references users(id) on delete cascade,
  neon_revision bigint not null default 0,
  last_clerk_sync_at timestamptz null,
  last_clerk_event_ts timestamptz null,
  updated_at timestamptz not null default now()
);

-- indexes
create index if not exists idx_users_tenant_owner on users(tenant_owner_user_id);
create index if not exists idx_users_role on users(role);
create index if not exists idx_subscriptions_user on subscriptions(user_id);
create index if not exists idx_subscriptions_status on subscriptions(billing_status);
create index if not exists idx_events_aggregate on integration_events(aggregate_key, processed_at desc);
```

## 2) Prisma Blueprint

```prisma
enum AppRole {
  admin
  mentorado
  clinica_owner
  clinica_staff
  pending
}

enum BillingPlan {
  none
  trial_mentorado
  basic_193
  pro_433
}

enum BillingStatus {
  none
  trialing
  active
  past_due
  unpaid
  canceled
  incomplete
}

model User {
  id                String   @id @default(uuid()) @db.Uuid
  clerkUserId       String   @unique
  email             String
  role              AppRole  @default(pending)
  tenantOwnerUserId String?  @db.Uuid
  tenantOwner       User?    @relation("OwnerStaff", fields: [tenantOwnerUserId], references: [id])
  staffMembers      User[]   @relation("OwnerStaff")
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  permissions       UserPermission[]
  subscriptions     Subscription[]
  syncState         IdentitySyncState?

  @@index([tenantOwnerUserId])
  @@index([role])
}

model UserPermission {
  userId         String   @db.Uuid
  permissionKey  String
  granted        Boolean  @default(true)
  createdAt      DateTime @default(now())
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([userId, permissionKey])
}

model Subscription {
  id                  String       @id @default(uuid()) @db.Uuid
  userId              String       @db.Uuid
  stripeCustomerId    String
  stripeSubscriptionId String      @unique
  billingPlan         BillingPlan  @default(none)
  billingStatus       BillingStatus @default(none)
  currentPeriodEnd    DateTime?
  trialEndsAt         DateTime?
  lastStripeEventTs   DateTime?
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt

  user                User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, stripeCustomerId])
  @@index([userId])
  @@index([billingStatus])
}

model IntegrationEvent {
  source        String
  eventId       String
  aggregateKey  String?
  occurredAt    DateTime?
  processedAt   DateTime @default(now())
  payloadHash   String?
  status        String   @default("processed")

  @@id([source, eventId])
  @@index([aggregateKey, processedAt(sort: Desc)])
}

model IdentitySyncState {
  userId             String   @id @db.Uuid
  neonRevision       BigInt   @default(0)
  lastClerkSyncAt    DateTime?
  lastClerkEventTs   DateTime?
  updatedAt          DateTime @updatedAt

  user               User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## 3) Notes

- `clinica_staff` must reference a valid `clinica_owner` through `tenant_owner_user_id`.
- Keep all tenant business tables keyed by `tenant_owner_user_id`.
- `integration_events` is mandatory for webhook replay safety.

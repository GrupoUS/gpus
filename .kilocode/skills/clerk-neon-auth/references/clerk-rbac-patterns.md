# Clerk RBAC Patterns (Canonical)

Defines Clerk metadata shape, token claims, and integration rules for role/permission enforcement.

Related docs:
- `../SKILL.md`
- `./role-architecture.md`
- `./clerk-neon-sync-contract.md`

## 1) Metadata Contract

Use `publicMetadata` as identity-adjacent projection, not sole runtime authority.

```ts
export type AppRole =
  | 'admin'
  | 'mentorado'
  | 'clinica_owner'
  | 'clinica_staff'
  | 'pending';

export type ModulePermission =
  | 'admin_panel'
  | 'mentoria'
  | 'crm'
  | 'agenda'
  | 'pacientes'
  | 'financeiro'
  | 'marketing';

export interface ClerkPublicMetadata {
  role?: AppRole;
  permissionVersion?: number; // monotonic
  permissions?: ModulePermission[];
  tenantOwnerUserId?: string | null; // for clinica_staff

  // Billing projection (read-friendly for UI)
  billingPlan?: 'basic_193' | 'pro_433' | 'trial_mentorado' | 'none';
  billingStatus?:
    | 'trialing'
    | 'active'
    | 'past_due'
    | 'unpaid'
    | 'canceled'
    | 'incomplete'
    | 'none';
  trialEndsAt?: string | null;

  // Sync metadata
  neonRevision?: number; // last revision mirrored from Neon
  lastSyncedAt?: string;
}
```

## 2) Session Token Claim

Configure Clerk session template to include public metadata projection:

```json
{
  "app_metadata": "{{user.public_metadata}}"
}
```

Rules:
- Token claims are cacheable and can be stale.
- Backend must refresh effective state from Neon on sensitive mutations.

## 3) Backend Access Pattern

- Authenticate with Clerk session.
- Resolve `clerk_user_id`.
- Load effective permissions from Neon (`users + user_permissions`).
- Compare requested action against Neon effective permissions.

Never authorize critical action from token-only metadata.

## 4) Clerk Backend API Usage

### Required operations
- `users.getUserList` for admin grid reconciliation.
- `users.updateUser` or `users.updateUserMetadata` for controlled metadata projection writes.
- `invitations.createInvitation` for `clinica_staff` onboarding with `tenantOwnerUserId`.

### Admin CRUD parity

When admin updates role/permissions:
1. Persist authoritative change in Neon (transaction + audit).
2. Project summary to Clerk metadata.
3. Return merged view to frontend (`identity + effective state`).

## 5) Webhook Pattern (Clerk -> Neon)

Consume `user.created`, `user.updated`, `user.deleted`.

Requirements:
- Verify signature.
- Store event ID in processed-event table for dedup.
- Ignore stale payload using revision/timestamp.
- Use upsert by `clerk_user_id`.

## 6) Anti-Patterns

- Putting full ACL graph only in Clerk metadata.
- Updating Clerk and Neon in arbitrary order without versioning.
- Role decisions from frontend `useUser()` without backend re-check.

## 7) Validation Checklist

- [ ] `publicMetadata` matches schema contract.
- [ ] Session template includes metadata projection.
- [ ] Backend authorization uses Neon effective state.
- [ ] Clerk webhook handling is idempotent.
- [ ] Admin panel shows merged Clerk + Neon view.

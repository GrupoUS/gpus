# PLAN-lead-owner-improvement: New Lead Field & User Sync

> **Goal:** Search/select responsible user when creating a lead and fix empty "Responsible" dropdowns by syncing Clerk users.

## 0. Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | `LeadForm` is missing `assignedTo` field completely | 5/5 | `lead-form.tsx` | Cannot set owner on creation |
| 2 | `createLead` mutation does not accept `assignedTo` | 5/5 | `leads.ts` | Backend ignores assignment |
| 3 | No Clerk Webhook exists for user sync | 5/5 | `http.ts` | Users only exist after login (lazy sync) |
| 4 | `listVendors` relies on existing `users` table | 5/5 | `users.ts` | Returns empty if admins haven't logged in |

### Knowledge Gaps & Assumptions
- **Assumption:** The admin "Lucas" and SDRs exist in Clerk but are missing or outdated in Convex `users` table.
- **Assumption:** User has permissions to configure Clerk Webhooks in Clerk Dashboard (we will provide the endpoint).

---

## 1. User Review Required (Important)

> [!IMPORTANT]
> **Clerk Webhook Configuration Required**
> To keep users in sync automatically, you must add a webhook in Clerk Dashboard:
> - **Endpoint URL:** `https://<your-convex-site>.convex.site/clerk/users`
> - **Events:** `user.created`, `user.updated`, `user.deleted`
> - **Secret:** Add `CLERK_WEBHOOK_SECRET` to Convex Environment Variables.

---

## 2. Proposed Changes

### Phase 1: User Sync Infrastructure (Fixes Empty List)

#### [MODIFY] [users.ts](file:///home/mauricio/gpus/convex/users.ts)
- **Action:** Create `syncClerkUsers` internal action.
- **Details:** Uses `clerkClient.users.getUserList()` to fetch all users and `internal.users.updateFromClerk` to upsert them. This backfills missing users immediately.

#### [NEW] [clerk.ts](file:///home/mauricio/gpus/convex/clerk.ts)
- **Action:** Create Webhook Handler.
- **Details:** Handles `user.created/updated/deleted` events to keep Convex `users` table in sync real-time.

#### [MODIFY] [http.ts](file:///home/mauricio/gpus/convex/http.ts)
- **Action:** Mount `/clerk/users` endpoint.

### Phase 2: Lead Creation Owner Field

#### [MODIFY] [leads.ts](file:///home/mauricio/gpus/convex/leads.ts)
- **Action:** Update `createLead` to accept `assignedTo` (optional `v.id("users")`).
- **Details:** Insert `assignedTo: args.assignedTo` into DB.

#### [MODIFY] [lead-form.tsx](file:///home/mauricio/gpus/src/components/crm/lead-form.tsx)
- **Action:** Add `LeadOwnerSelect` component.
- **Details:** Update schema `leadFormSchema` and `onSubmit` payload.

---

## 3. Atomic Implementation Tasks

### AT-001: Implement Clerk User Sync ⚡
**Goal:** Ensure all Clerk users exist in Convex `users` table with correct roles.
**Dependencies:** None

#### Subtasks:
- [ ] ST-001.1: Create `convex/clerk.ts` with Webhook Handler (`user.created`, `user.updated`)
  - **File:** `convex/clerk.ts`
  - **Validation:** Check type safety
- [ ] ST-001.2: Register endpoint in `convex/http.ts`
  - **File:** `convex/http.ts`
  - **Validation:** `bun run check`
- [ ] ST-001.3: Create `backfillClerkUsers` action in `users.ts` + internal mutation
  - **File:** `convex/users.ts`
  - **Validation:** Call action via dashboard or CLI to populate users
- [ ] ST-001.4: Run Backfill
  - **Action:** Execute the backfill action once.
  - **Validation:** Verify `listVendors` now returns users.

### AT-002: Update Lead Creation Backend ⚡
**Goal:** Allow setting owner during lead creation.
**Dependencies:** AT-001 (to have users to assign)

#### Subtasks:
- [ ] ST-002.1: Add `assignedTo` to `createLead` args & insert
  - **File:** `convex/leads.ts`
  - **Validation:** `bun run check`

### AT-003: Update Lead Creation UI
**Goal:** Add selection dropdown to New Lead form.
**Dependencies:** AT-002

#### Subtasks:
- [ ] ST-003.1: Add `assignedTo` to `leadFormSchema` (zod)
  - **File:** `src/components/crm/lead-form.tsx`
- [ ] ST-003.2: Add `LeadOwnerSelect` to JSX
  - **File:** `src/components/crm/lead-form.tsx`
- [ ] ST-003.3: Pass `assignedTo` in `createLead` call
  - **File:** `src/components/crm/lead-form.tsx`
  - **Validation:** Create new lead, verify `assignedTo` is saved.

---

## 4. Verification Plan

### Automated Tests
- `bun run check`
- `bun run lint`

### Manual Verification
1.  **Sync:** Run backfill action, check "Responsible" dropdown in Lead Detail (should no longer be empty).
2.  **Create:** Open "New Lead", select a responsible, create.
3.  **Verify:** Open the new lead, confirm "Responsible" is set correctly.

---

## 5. Rollback Plan

- Revert `createLead` changes in `convex/leads.ts`.
- Revert `lead-form.tsx`.
- Disable/Remove webhook endpoint.

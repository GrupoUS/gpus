# PLAN-crm-lead-management: Lead Edit/Delete & Admin CRM View

> **Goal:** Implement edit/delete functionality for CRM leads and allow admins to view CRM data of other system users.

## 0. Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | Convex delete pattern: `ctx.db.delete(args.id)` in mutation | 5/5 | Context7 Convex docs | Backend mutation pattern |
| 2 | Clerk user listing: `clerkClient.users.getUserList()` with pagination | 5/5 | Context7 Clerk docs | Admin user dropdown |
| 3 | Existing `listVendors` action in `users.ts` already uses `createClerkClient` | 5/5 | Codebase analysis | Extend existing pattern |
| 4 | `lead-detail.tsx` uses Sheet component, no edit/delete buttons exist | 5/5 | Codebase analysis | Add action buttons |
| 5 | `updateLead` mutation exists but only updates stage (`updateLeadStage`) | 4/5 | `leads.ts` analysis | Create full edit mutation |
| 6 | `requirePermission(ctx, 'leads:manage')` pattern used for auth | 5/5 | Codebase analysis | Use for delete |
| 7 | Test patterns exist in `lead-form.test.tsx` with Convex mocks | 5/5 | Test file analysis | Reuse mock patterns |

### Knowledge Gaps
- **Gap:** No existing "view as user" pattern in codebase
- **Assumption:** Admin role check uses `getUser(ctx)` with `role === 'admin'` or `requirePermission`

### Edge Cases
1. Delete lead with associated activities, tasks, enrollments → cascade or prevent?
2. Admin selecting inactive/deleted Clerk user → handle gracefully
3. Concurrent edit by two users → Convex optimistic updates handle this
4. Delete own last lead → empty state UI needed
5. Non-admin trying admin-only features → permission error handling

---

## 1. User Review Required

> [!IMPORTANT]
> **Delete Behavior:** Should deleting a lead also delete associated data (activities, tasks, enrollments)?
> 
> **Recommended:** Soft-delete (add `deletedAt` field) to preserve data integrity. This plan assumes **hard delete** with cascade for simplicity. Please confirm.

> [!WARNING]
> **Breaking Change:** Adding `forUserId` parameter to `listLeads` query changes its signature. Existing calls won't break (optional param), but admin UI will need explicit handling.

---

## 2. Proposed Changes

### Phase 1: Backend Mutations

#### [MODIFY] [leads.ts](file:///home/mauricio/gpus/convex/leads.ts)
- **Add:** `deleteLead` mutation with permission check and cascade delete of activities
- **Add:** `updateLeadFull` mutation for editing all lead fields
- **Modify:** `listLeads` query to accept optional `forUserId` parameter (admin only)

---

### Phase 2: Admin User Selector

#### [MODIFY] [users.ts](file:///home/mauricio/gpus/convex/users.ts)
- **Add:** `listSystemUsers` query that returns synced Convex users (not Clerk API call)
- Uses existing `users` table which is already synced via webhooks

---

### Phase 3: Frontend Components

#### [NEW] [lead-actions.tsx](file:///home/mauricio/gpus/src/components/crm/lead-actions.tsx)
- Dropdown menu with Edit and Delete options
- Uses shadcn/ui DropdownMenu component

#### [NEW] [lead-edit-dialog.tsx](file:///home/mauricio/gpus/src/components/crm/lead-edit-dialog.tsx)
- Modal form reusing `lead-form.tsx` field structure
- Pre-populates with existing lead data

#### [NEW] [lead-delete-dialog.tsx](file:///home/mauricio/gpus/src/components/crm/lead-delete-dialog.tsx)
- Confirmation AlertDialog with lead name
- Calls `deleteLead` mutation on confirm

#### [MODIFY] [lead-detail.tsx](file:///home/mauricio/gpus/src/components/crm/lead-detail.tsx)
- Add `<LeadActions>` component to header section
- Pass lead data to action components

---

### Phase 4: Admin CRM View

#### [NEW] [admin-user-selector.tsx](file:///home/mauricio/gpus/src/components/crm/admin-user-selector.tsx)
- Select/Combobox component showing system users
- Only visible to admin users
- Emits `onUserSelect(userId | null)` event

#### [MODIFY] [crm.tsx](file:///home/mauricio/gpus/src/routes/_authenticated/crm.tsx)
- Add `AdminUserSelector` component (conditionally rendered for admins)
- Pass selected `userId` to `listLeads` query as `forUserId`

---

## 3. Atomic Implementation Tasks

> [!CAUTION]
> Each task has subtasks with validation gates.

### AT-001: Delete Lead Mutation ⚡
**Goal:** Enable permanent deletion of leads with activity cascade
**Dependencies:** None

#### Subtasks:
- [ ] ST-001.1: Add `deleteLead` mutation in `leads.ts`
  - **File:** `convex/leads.ts`
  - **Validation:** TypeScript compiles, `bun run build`
- [ ] ST-001.2: Add cascade delete for activities linked to lead
  - **File:** `convex/leads.ts`
  - **Validation:** `bun run build` passes
- [ ] ST-001.3: Add permission check `requirePermission(ctx, 'leads:manage')`
  - **File:** `convex/leads.ts`
  - **Validation:** Deploy with `bunx convex dev`

**Rollback:** Remove `deleteLead` export, redeploy

---

### AT-002: Full Lead Update Mutation ⚡
**Goal:** Allow editing all lead fields via single mutation
**Dependencies:** None

#### Subtasks:
- [ ] ST-002.1: Add `updateLeadFull` mutation with all editable fields
  - **File:** `convex/leads.ts`
  - **Validation:** TypeScript compiles
- [ ] ST-002.2: Add input validation with `v.object()`
  - **File:** `convex/leads.ts`
  - **Validation:** `bun run build`

**Rollback:** Remove `updateLeadFull` export, redeploy

---

### AT-003: Admin User Filtering on listLeads
**Goal:** Allow admins to view leads of other users
**Dependencies:** None

#### Subtasks:
- [ ] ST-003.1: Add optional `forUserId` arg to `listLeads` query
  - **File:** `convex/leads.ts`
  - **Validation:** TypeScript compiles
- [ ] ST-003.2: Add admin check when `forUserId` is different from current user
  - **File:** `convex/leads.ts`
  - **Validation:** `bun run build`
- [ ] ST-003.3: Filter query by `forUserId` when provided
  - **File:** `convex/leads.ts`
  - **Validation:** Deploy and test in dashboard

**Rollback:** Remove `forUserId` param, redeploy

---

### AT-004: List System Users Query
**Goal:** Provide dropdown data for admin user selector
**Dependencies:** None

#### Subtasks:
- [ ] ST-004.1: Add `listSystemUsers` query in `users.ts`
  - **File:** `convex/users.ts`
  - **Validation:** TypeScript compiles
- [ ] ST-004.2: Restrict to admin-only with permission check
  - **File:** `convex/users.ts`
  - **Validation:** `bun run build`

**Rollback:** Remove query, redeploy

---

### AT-005: Lead Actions Component
**Goal:** UI dropdown with Edit/Delete options
**Dependencies:** AT-001, AT-002

#### Subtasks:
- [ ] ST-005.1: Create `lead-actions.tsx` with DropdownMenu
  - **File:** `src/components/crm/lead-actions.tsx`
  - **Validation:** `bun run build`
- [ ] ST-005.2: Wire Edit action to open edit dialog
  - **File:** `src/components/crm/lead-actions.tsx`
  - **Validation:** Browser manual test
- [ ] ST-005.3: Wire Delete action to open confirmation
  - **File:** `src/components/crm/lead-actions.tsx`
  - **Validation:** Browser manual test

**Rollback:** Delete component file

---

### AT-006: Lead Edit Dialog
**Goal:** Modal form to edit lead details
**Dependencies:** AT-002

#### Subtasks:
- [ ] ST-006.1: Create `lead-edit-dialog.tsx` with form fields
  - **File:** `src/components/crm/lead-edit-dialog.tsx`
  - **Validation:** `bun run build`
- [ ] ST-006.2: Pre-populate form with existing lead data
  - **File:** `src/components/crm/lead-edit-dialog.tsx`
  - **Validation:** Browser test
- [ ] ST-006.3: Call `updateLeadFull` on submit
  - **File:** `src/components/crm/lead-edit-dialog.tsx`
  - **Validation:** Lead updates in Kanban

**Rollback:** Delete component file

---

### AT-007: Lead Delete Confirmation Dialog
**Goal:** Confirmation before permanent deletion
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-007.1: Create `lead-delete-dialog.tsx` with AlertDialog
  - **File:** `src/components/crm/lead-delete-dialog.tsx`
  - **Validation:** `bun run build`
- [ ] ST-007.2: Call `deleteLead` mutation on confirm
  - **File:** `src/components/crm/lead-delete-dialog.tsx`
  - **Validation:** Lead removed from Kanban

**Rollback:** Delete component file

---

### AT-008: Integrate Actions into LeadDetail
**Goal:** Add Edit/Delete buttons to lead detail sheet
**Dependencies:** AT-005, AT-006, AT-007

#### Subtasks:
- [ ] ST-008.1: Import and render `LeadActions` in header
  - **File:** `src/components/crm/lead-detail.tsx`
  - **Validation:** `bun run build`
- [ ] ST-008.2: Pass lead data and callbacks
  - **File:** `src/components/crm/lead-detail.tsx`
  - **Validation:** Browser test - actions visible

**Rollback:** Remove LeadActions import and usage

---

### AT-009: Admin User Selector Component
**Goal:** Dropdown for admins to select which user's CRM to view
**Dependencies:** AT-004

#### Subtasks:
- [ ] ST-009.1: Create `admin-user-selector.tsx` with Combobox
  - **File:** `src/components/crm/admin-user-selector.tsx`
  - **Validation:** `bun run build`
- [ ] ST-009.2: Fetch users from `listSystemUsers` query
  - **File:** `src/components/crm/admin-user-selector.tsx`
  - **Validation:** Browser test - users load

**Rollback:** Delete component file

---

### AT-010: Integrate Admin Selector into CRM Page
**Goal:** Allow admins to view other users' leads
**Dependencies:** AT-003, AT-009

#### Subtasks:
- [ ] ST-010.1: Import `AdminUserSelector` in CRM page
  - **File:** `src/routes/_authenticated/crm.tsx`
  - **Validation:** `bun run build`
- [ ] ST-010.2: Add state for selected user and pass to `listLeads`
  - **File:** `src/routes/_authenticated/crm.tsx`
  - **Validation:** Browser test - leads filter by user
- [ ] ST-010.3: Conditionally render selector for admins only
  - **File:** `src/routes/_authenticated/crm.tsx`
  - **Validation:** Non-admin doesn't see selector

**Rollback:** Remove selector import and state

---

## 4. Verification Plan

### Automated Tests
```bash
# TypeScript compilation
bun run build

# Lint check
bun run lint:check

# Unit tests (existing)
bun run test
```

### Browser Testing (Manual)
1. **Edit Lead Flow:**
   - Open CRM page → Click lead card → Click "⋮" menu → Select "Editar"
   - Modify name → Save → Verify name updated in Kanban

2. **Delete Lead Flow:**
   - Open CRM page → Click lead card → Click "⋮" menu → Select "Excluir"
   - Confirm deletion → Verify lead removed from Kanban

3. **Admin User View:**
   - Login as admin user → Go to CRM page
   - See user selector dropdown → Select different user
   - Verify leads shown are from selected user

4. **Permission Check:**
   - Login as non-admin → Go to CRM page
   - Verify user selector NOT visible

---

## 5. Rollback Plan

```bash
# Revert all changes
git checkout HEAD -- convex/leads.ts convex/users.ts
git checkout HEAD -- src/components/crm/
git checkout HEAD -- src/routes/_authenticated/crm.tsx

# Redeploy Convex
bunx convex deploy
```

---

## Pre-Submission Checklist

- [x] Research findings documented with confidence scores
- [x] Knowledge gaps identified (delete behavior, admin role check)
- [x] Edge cases documented (5+)
- [x] All tasks have subtasks with validation
- [x] Parallel-safe tasks marked with ⚡
- [x] Rollback steps defined for each task
- [x] Verification plan includes both automated and manual tests

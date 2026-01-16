# Workspace QA Fixes - Comprehensive Plan

## Executive Summary

This plan addresses all workspace diagnostics issues across 4 files, with **critical syntax errors** in `convex/leads.ts` that prevent compilation.

## Issues by Severity

### 🔴 CRITICAL (Blocking Compilation)

#### convex/leads.ts - Lines 449-464
**Problem**: Unterminated string literal and garbage code causing syntax errors

```typescript
// CURRENT (BROKEN)
449 | console.warn('leads:r
450 | }
451 |
452 | // 2. Query leads using index
...
462 | ignored)
463 | // This prevents the whole dashboard from crashing if just t
464 | });
```

**Fix**:
```typescript
// FIXED
if (!organizationId) {
  return [];
}

// 2. Query leads using index
const results = await ctx.db
  .query('leads')
  .withIndex('by_organization', (q) => q.eq('organizationId', organizationId))
  .order('desc')
  .take(args.limit ?? 10);

return results;
```

---

### 🟠 HIGH (Type Safety & Best Practices)

#### 1. Namespace Imports (Prevent Tree Shaking)

**convex/leads.ts - Line 4**
```typescript
// BEFORE
import * as apiModule from './_generated/api';

// AFTER
import type { FunctionReference } from 'convex/server';
import { internal } from './_generated/api';
```

**src/components/crm/lead-form.tsx - Line 8**
```typescript
// BEFORE
import * as z from 'zod';

// AFTER
import { z } from 'zod';
```

---

#### 2. Type Instantiation Excessively Deep

**convex/http.ts - Line 64**
```typescript
// BEFORE
const contact = await ctx.runQuery((internal as any).emailMarketing.getContactByEmailInternal, {

// AFTER
const contact = await ctx.runQuery(
  (internal as unknown as FunctionReference<'query', '_internal', 'emailMarketing.getContactByEmailInternal'>),
  {
```

---

### 🟡 MEDIUM (Code Quality)

#### 3. `any` Type Replacements in convex/leads.ts

| Line | Current | Fix |
|------|---------|-----|
| 7 | `const internal = (apiModule as any).internal;` | `import { internal } from './_generated/api';` |
| 73 | `handler: async (ctx, args: any) => {` | `handler: async (ctx, args: ListLeadsArgs) => {` |
| 90 | `.eq('stage', singleStage as any)` | `.eq('stage', singleStage as string)` |
| 98 | `const filters = [];` | `const filters: boolean[] = [];` |
| 213 | `const syncFn = (internal as any).emailMarketing.syncLeadAsContactInternal;` | `const syncFn = internal.emailMarketing.syncLeadAsContactInternal;` |
| 214 | `await (ctx.scheduler as any).runAfter(0, syncFn, {` | `await ctx.scheduler.runAfter(0, syncFn, {` |
| 302 | Same as 213 | Same fix |
| 303 | Same as 214 | Same fix |
| 399 | `handler: async (ctx, args: any) => {` | `handler: async (ctx, args: UpdateLeadArgs) => {` |
| 403 | `const lead = (await ctx.db.get(args.leadId)) as any;` | `const lead = await ctx.db.get(args.leadId);` |
| 460 | `catch (error: any) {` | `catch (error) {` |
| 527 | `await ctx.db.delete(deleteId as any);` | `await ctx.db.delete(deleteId as Id<'leads'>);` |

---

#### 4. Variable Shadowing

**convex/leads.ts - Line 86**
```typescript
// BEFORE (shadows outer 'query' variable)
let query = singleStage ? ctx.db.query('leads')... : ctx.db.query('leads')...;

// AFTER (rename to avoid shadowing)
let leadQuery = singleStage ? ctx.db.query('leads')... : ctx.db.query('leads')...;
```

Also update line 97: `query = query.filter` → `leadQuery = leadQuery.filter`

---

#### 5. Non-Null Assertions

**convex/leads.ts - Lines 239, 264**
```typescript
// Line 239
// BEFORE
q.eq('identifier', args.userIp!).eq('action', 'submit_form'),

// AFTER
q.eq('identifier', args.userIp ?? '').eq('action', 'submit_form'),

// Line 264
// BEFORE
q.eq('organizationId', orgId!).eq('phone', args.phone),

// AFTER
q.eq('organizationId', orgId ?? '').eq('phone', args.phone),
```

---

#### 6. Console Statements (Remove)

**convex/leads.ts - Lines 449, 461**
```typescript
// Line 449 - Remove console.warn
// BEFORE
if (!organizationId) {
  console.warn('leads:r
}

// AFTER
if (!organizationId) {
  return [];
}

// Line 461 - Remove console.error
// BEFORE
} catch (error: any) {
  console.error('leads:recent: Server Error detected', error);
  ignored)

// AFTER
} catch (error) {
  // Return empty array to prevent dashboard crash
  return [];
}
```

---

#### 7. Useless Catch Clause

**convex/leads.ts - Line 442**
```typescript
// BEFORE
try {
  await ctx.auth.getUserIdentity();
} catch (e) {
  throw e;
}

// AFTER
await ctx.auth.getUserIdentity();
```

---

### 🟢 LOW (Already Handled)

#### convex/users.ts
- **Line 77**: `_id` property - Already has biome ignore comment
- **Line 160**: Excessive complexity - Already has biome ignore comment

---

## Implementation Order

### Phase 1: Critical Syntax Fixes (Must do first)
1. Fix unterminated string literal in `convex/leads.ts` line 449
2. Remove garbage code `ignored)` on line 462
3. Fix incomplete comment on line 463
4. Fix misplaced closing brace on line 464
5. Add missing closing brace for `recent` query

### Phase 2: Type Safety Improvements
6. Replace namespace imports with named imports
7. Replace all `any` types with proper types
8. Fix type instantiation depth in `convex/http.ts`
9. Fix implicit any types

### Phase 3: Code Quality
10. Fix variable shadowing
11. Remove non-null assertions
12. Remove console statements
13. Remove useless catch clause

### Phase 4: Validation
14. Run `bun run lint:check`
15. Run `bun run build`
16. Verify all diagnostics resolved

---

## Type Definitions Needed

Add these interfaces to `convex/leads.ts`:

```typescript
interface ListLeadsArgs {
  paginationOpts: PaginationOptions;
  stage?: string;
  stages?: string[];
  search?: string;
  temperature?: string[];
  products?: string[];
  source?: string[];
}

interface UpdateLeadArgs {
  leadId: Id<'leads'>;
  patch: {
    name?: string;
    phone?: string;
    email?: string;
    source?: string;
    lgpdConsent?: boolean;
    whatsappConsent?: boolean;
    message?: string;
    utmSource?: string;
    utmCampaign?: string;
    utmMedium?: string;
    utmContent?: string;
    utmTerm?: string;
    sourceDetail?: string;
    profession?: string;
    interestedProduct?: string;
    temperature?: string;
    stage?: string;
    hasClinic?: boolean;
    clinicName?: string;
    clinicCity?: string;
    yearsInAesthetics?: number;
    currentRevenue?: string;
    mainPain?: string;
    mainDesire?: string;
    score?: number;
    nextFollowUpAt?: number;
  };
}
```

---

## Expected Results

After all fixes:
- ✅ 0 TypeScript errors
- ✅ 0 Biome errors
- ✅ Clean build
- ✅ All workspace diagnostics resolved

---

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| Breaking changes | Low | Only fixing type issues, not logic |
| Runtime errors | Low | Syntax fixes are straightforward |
| Performance impact | None | No algorithm changes |

---

## Success Criteria

- [ ] All TypeScript errors resolved
- [ ] All Biome errors resolved
- [ ] `bun run lint:check` passes
- [ ] `bun run build` succeeds
- [ ] No workspace diagnostics visible

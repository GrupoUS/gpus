# Workspace Diagnostics Fix Plan

## Summary
Fix all TypeScript and Biome linting errors/warnings across the codebase.

## Issues Analysis

### 1. src/hooks/use-students-view-model.ts (3 issues)

**Issue 1: Biome Warning (Line 38)**
- **Problem**: Suppression comment has no effect
- **Location**: `// biome-ignore lint/suspicious/noExplicitAny: Complex type inference causes TypeScript recursion`
- **Root Cause**: The biome-ignore comment is on the wrong line or the rule name is incorrect
- **Solution**: Remove the comment since it's not suppressing anything, or move it to line 47 where the actual `any` is used

**Issue 2: TypeScript Error (Line 40)**
- **Problem**: Type instantiation is excessively deep and possibly infinite
- **Location**: `api.students.list`
- **Root Cause**: Complex type inference from Convex API with conditional parameters
- **Solution**: Extract the query parameters into a typed interface or use a type assertion with proper typing

**Issue 3: Biome Warning (Line 47)**
- **Problem**: Unexpected any type
- **Location**: `} as any)`
- **Root Cause**: Using `as any` to bypass type checking
- **Solution**: Define proper types for the query parameters instead of using `any`

### 2. convex/asaas/retry.ts (1 issue)

**Issue: TypeScript Warning (Line 7)**
- **Problem**: `isTransientError` is declared but never read
- **Location**: `import { isRetryableError, isTransientError } from './errors'`
- **Root Cause**: Import exists but function is not used in the file
- **Solution**: Remove the unused import

### 3. convex/asaas/client.ts (3 issues)

**Issue 1: TypeScript Warning (Line 9)**
- **Problem**: `AsaasError` is declared but never read
- **Location**: `import { AsaasError, ... } from './errors'`
- **Root Cause**: Import exists but type is not used
- **Solution**: Remove the unused import

**Issue 2: TypeScript Warning (Line 14)**
- **Problem**: `withRetry` is declared but never read
- **Location**: `import { withRetry, withTimeoutAndRetry, createCircuitBreaker } from './retry'`
- **Root Cause**: Import exists but function is not used
- **Solution**: Remove the unused import

**Issue 3: TypeScript Warning (Line 340)**
- **Problem**: `response` is declared but never read
- **Location**: `const response = await this.fetch<{ object: string; totalCount: number }>('/customers?limit=1')`
- **Root Cause**: Variable is assigned but never used
- **Solution**: Remove the variable assignment or use it

### 4. src/components/students/create-payment-dialog.tsx (1 issue)

**Issue: Biome Warning (Line 69)**
- **Problem**: Unexpected any type
- **Location**: `} catch (error: any) {`
- **Root Cause**: Using `any` for error type
- **Solution**: Use `unknown` type instead and narrow it with type guards

### 5. convex/asaas/errors.ts (1 issue)

**Issue: TypeScript Warning (Line 253)**
- **Problem**: `key` is declared but never read
- **Location**: `return JSON.stringify(json, (key, value) => {`
- **Root Cause**: Parameter is not used in the callback
- **Solution**: Prefix with underscore `_key` to indicate intentionally unused

### 6. convex/lib/asaas.ts (1 issue)

**Issue: TypeScript Warning (Line 325)**
- **Problem**: `startTime` is declared but never read
- **Location**: `const startTime = Date.now();`
- **Root Cause**: Variable is declared but never used
- **Solution**: Remove the variable or use it for logging/response time calculation

## Implementation Plan

### Priority 1: Critical TypeScript Errors
1. Fix `src/hooks/use-students-view-model.ts` type instantiation error
2. Fix all `any` type usages to use proper types

### Priority 2: Unused Imports/Variables
3. Remove unused imports in `convex/asaas/retry.ts`
4. Remove unused imports in `convex/asaas/client.ts`
5. Remove unused variable in `convex/asaas/client.ts`
6. Remove unused variable in `convex/lib/asaas.ts`

### Priority 3: Minor Warnings
7. Fix unused parameter in `convex/asaas/errors.ts`
8. Fix biome-ignore comment in `src/hooks/use-students-view-model.ts`

## Detailed Solutions

### Solution 1: Fix use-students-view-model.ts Type Issues

**Approach**: Define proper types for the query parameters and remove `any` usage

```typescript
// Define the query parameters type
interface StudentsListQueryParams {
  search?: string;
  status?: string;
  churnRisk?: string;
  product?: string;
}

// Use the type instead of 'any'
const students = useQuery(
  api.students.list,
  isAuthenticated
    ? ({
        search: search || undefined,
        status: status === 'all' ? undefined : status,
        churnRisk: churnRisk === 'all' ? undefined : churnRisk,
        product: product === 'all' ? undefined : product,
      } as StudentsListQueryParams)
    : 'skip',
);
```

### Solution 2: Remove Unused Imports

**convex/asaas/retry.ts**:
```typescript
// Remove isTransientError from import
import { isRetryableError } from './errors'
```

**convex/asaas/client.ts**:
```typescript
// Remove AsaasError and withRetry from imports
import {
  classifyError,
  sanitizeErrorForLogging,
  AsaasConfigurationError,
} from './errors'
import { withTimeoutAndRetry, createCircuitBreaker } from './retry'
```

### Solution 3: Fix Unused Variables

**convex/asaas/client.ts** (Line 340):
```typescript
// Option 1: Remove the variable
public async testConnection(): Promise<{ status: number; success: boolean }> {
  try {
    await this.fetch<{ object: string; totalCount: number }>('/customers?limit=1')
    return { status: 200, success: true }
  } catch (error) {
    // ...
  }
}

// Option 2: Use the variable
public async testConnection(): Promise<{ status: number; success: boolean }> {
  try {
    const response = await this.fetch<{ object: string; totalCount: number }>('/customers?limit=1')
    console.log('Connection test successful:', response)
    return { status: 200, success: true }
  } catch (error) {
    // ...
  }
}
```

**convex/lib/asaas.ts** (Line 325):
```typescript
// Remove the unused variable
// const startTime = Date.now(); // Remove this line
```

### Solution 4: Fix Error Type

**src/components/students/create-payment-dialog.tsx**:
```typescript
// Use unknown instead of any
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
  toast.error('Falha na sincronização', {
    description: errorMessage,
  });
}
```

### Solution 5: Fix Unused Parameter

**convex/asaas/errors.ts**:
```typescript
// Prefix with underscore to indicate intentionally unused
return JSON.stringify(json, (_key, value) => {
  if (typeof value === 'string' && value.length > 32 && /^[a-zA-Z0-9]+$/.test(value)) {
    return '[REDACTED]'
  }
  return value
})
```

### Solution 6: Fix Biome Ignore Comment

**src/hooks/use-students-view-model.ts**:
```typescript
// Remove the ineffective biome-ignore comment on line 38
// Move it to line 47 where the actual any is used, or remove it entirely
```

## Verification Steps

1. Run `bun run lint:check` to verify no linting errors
2. Run `bun run build` to verify TypeScript compilation
3. Check VSCode diagnostics to confirm all issues are resolved
4. Run tests to ensure no functionality is broken

## Risk Assessment

- **Low Risk**: Removing unused imports and variables
- **Medium Risk**: Changing error types from `any` to `unknown` (requires type guards)
- **Medium Risk**: Fixing type instantiation issues (may require testing)
- **Low Risk**: Prefixing unused parameters with underscore

## Estimated Impact

- **Code Quality**: Improved type safety and reduced technical debt
- **Maintainability**: Cleaner code with no unused imports/variables
- **Performance**: No performance impact
- **Functionality**: No functional changes, only code quality improvements

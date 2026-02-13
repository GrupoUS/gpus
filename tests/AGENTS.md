# tests/ - Test Suite

## Package Identity

**Purpose:** End-to-end, integration, and unit tests for Portal Grupo US  
**Tech:** Playwright for E2E, Vitest for unit/integration tests

---

## Directory Structure

```
tests/
├── e2e/
│   └── sanity.spec.ts        # Basic E2E smoke tests
├── integration/
│   └── asaas-sync.test.ts    # Asaas integration tests
└── unit/
    └── asaas/                # Asaas unit tests (validators, etc.)
```

---

## Setup & Run

```bash
# Run all tests
bun run test

# Run with watch mode
bun run test:watch

# Run with coverage
bun run test:coverage

# Run E2E tests
bunx playwright test
```

---

## Patterns & Conventions

### E2E Tests (Playwright)

✅ **DO:** Use Playwright's page object pattern
```typescript
// tests/e2e/sanity.spec.ts
import { test, expect } from '@playwright/test'

test('loads the landing page', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Portal Grupo US/)
})
```

✅ **DO:** Test authenticated flows with Clerk
```typescript
test.describe('authenticated', () => {
  test.beforeEach(async ({ page }) => {
    // Setup Clerk testing helpers
  })
  
  test('can access dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })
})
```

### Unit Tests (Vitest)

✅ **DO:** Co-locate tests with source files
```
src/lib/utils.ts       # Source
src/lib/utils.test.ts  # Test
```

✅ **DO:** Use descriptive test names
```typescript
import { describe, it, expect } from 'vitest'
import { formatCurrency } from './constants'

describe('formatCurrency', () => {
  it('formats BRL currency correctly', () => {
    expect(formatCurrency(1234.56)).toBe('R$ 1.234,56')
  })
  
  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('R$ 0,00')
  })
})
```

### Backend / tRPC Tests

✅ **DO:** Test server validators and services independently
```typescript
import { describe, it, expect } from 'vitest'
import { validateCPF } from '../../server/lib/validators'

describe('validateCPF', () => {
  it('validates a correct CPF', () => {
    expect(validateCPF('123.456.789-09').valid).toBe(true)
  })
  
  it('rejects invalid CPF', () => {
    expect(validateCPF('000.000.000-00').valid).toBe(false)
  })
})
```

---

## Test Categories

| Category | Location | Command |
|----------|----------|---------|
| Unit | `src/**/*.test.ts` | `bun run test` |
| Integration | `tests/integration/` | `bun run test` |
| E2E | `tests/e2e/` | `bunx playwright test` |

---

## Common Gotchas

- **Clerk auth**: Use Clerk testing utilities for authenticated flows
- **tRPC mocking**: Mock tRPC client for component tests using `vi.mock('~/lib/trpc')`
- **Coverage**: Target 80%+ for critical business logic
- **Dialog tests**: Some dialog components (e.g., scroll-lock) may have environment-specific failures in JSDOM

---

## Pre-PR Checks

```bash
# Full test suite
bun run test

# E2E only
bunx playwright test

# Coverage report
bun run test:coverage
```

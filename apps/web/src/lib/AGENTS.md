# src/lib/ - Utilities & Constants

## Package Identity

**Purpose:** Utility functions, constants, and helper modules for the application  
**Tech:** TypeScript with pure functions and shared constants

---

## Patterns & Conventions

**File Organization:**
```
src/lib/
├── utils.ts          # General utility functions (cn, formatters)
├── constants.ts      # App-wide constants and configuration
└── [feature]-utils.ts  # Feature-specific utilities
```

**Function Patterns:**
✅ **DO:** Use pure functions with explicit types
```typescript
// src/lib/utils.ts
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(date)
}
```

✅ **DO:** Group related utilities
```typescript
// src/lib/date-utils.ts
export function addDays(date: Date, days: number): Date { ... }
export function isWeekend(date: Date): boolean { ... }
```

❌ **DON'T:** Create side effects in utility functions
```typescript
// AVOID
export function saveUser(user: User) {
  localStorage.setItem('user', JSON.stringify(user)) // Side effect
}
```

---

## Available Files

| File | Purpose | Exports |
|------|---------|---------|
| `utils.ts` | Class name utility | `cn()` - Tailwind class merging |
| `constants.ts` | Business domain labels & formatters | Labels, variants, formatters |
| `animations.ts` | Framer Motion animation presets | Animation configs |
| `cookies.ts` | Cookie management utilities | Cookie helpers |
| `utils.test.ts` | Tests for utility functions | — |

---

## Constants Reference (`constants.ts`)

### Available Constants
```typescript
// Product labels
productLabels: Record<string, string>
// → trintae3, otb, black_neon, comunidade, auriculo, na_mesa_certa

// Student status
studentStatusLabels: Record<string, string>
studentStatusVariants: Record<string, BadgeVariant>

// Enrollment status
enrollmentStatusLabels: Record<string, string>

// Payment status
paymentStatusLabels: Record<string, string>

// Conversation status
conversationStatusLabels: Record<string, string>

// Churn risk
churnRiskColors: Record<string, string>

// Currency formatter
formatCurrency(value: number): string  // → R$ 1.234,56
```

### Usage Pattern
```typescript
import { productLabels, formatCurrency, churnRiskColors } from '@/lib/constants'

// Labels
<span>{productLabels[product]}</span>  // → "TRINTAE3"

// Currency
<span>{formatCurrency(18000)}</span>   // → "R$ 18.000,00"

// Conditional styling
<span className={churnRiskColors[risk]}>{risk}</span>
```

---

## Touch Points / Key Files

| File | Purpose |
|------|---------|
| `src/lib/utils.ts` | Core utilities (cn function) |
| `src/lib/constants.ts` | Product labels, status labels, formatters |
| `src/lib/animations.ts` | Framer Motion animation presets |
| `src/lib/cookies.ts` | Cookie management utilities |

---

## JIT Index Hints

```bash
# Find utility functions
rg -n "export.*function" src/lib/

# Find constants
rg -n "export.*const.*=" src/lib/

# Find specific utility
rg -n "formatDate|cn\(" src/lib/

# Find type definitions
rg -n "interface|type.*=" src/lib/
```

---

## Pre-PR Checks

```bash
# Ensure no linting errors
bun run lint

# Type check
bun run build
```

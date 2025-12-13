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

## Touch Points / Key Files

| File | Purpose |
|------|---------|
| `src/lib/utils.ts` | Core utilities (cn function, formatters) |
| `src/lib/constants.ts` | App constants, configuration values |
| `src/lib/` | Feature-specific utility files |

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

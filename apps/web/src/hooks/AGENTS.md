# src/hooks/ - Custom React Hooks

## Package Identity

**Purpose:** Reusable React hooks for state management, data fetching, and business logic  
**Tech:** React 19 hooks with TypeScript and tRPC integration

---

## Patterns & Conventions

**Naming Conventions:**
- Always prefix with `use` (e.g., `useAuth`, `useTheme`)
- Descriptive names that indicate functionality
- camelCase naming with clear purpose

**Hook Structure:**
✅ **DO:** Follow standard React hook patterns
```typescript
// src/hooks/use-mobile.tsx
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)
  
  React.useEffect(() => {
    // Mobile detection logic
  }, [])
  
  return isMobile
}
```

✅ **DO:** Use tRPC hooks for data fetching
```typescript
// src/hooks/use-leads.ts
import { trpc } from '~/lib/trpc';

export function useLeads(mentoradoId: string) {
  const { data: leads } = trpc.leads.list.useQuery({ mentoradoId });
  const createLead = trpc.leads.create.useMutation();
  
  return { leads, createLead };
}
```

❌ **DON'T:** Create hooks with side effects beyond their purpose
```typescript
// AVOID
export function useAuthWithRouting() {
  const auth = useAuth()
  navigate('/dashboard') // Side effect in hook
  return auth
}
```

---

## Available Hooks

| Hook | Purpose | tRPC Integration |
|------|---------|-----------------|
| `use-mobile.tsx` | Mobile detection with responsive breakpoints | No |
| `use-toast.ts` | Toast notification management (from sonner) | No |
| `use-dify-chat.ts` | Dify AI chat integration with streaming | Yes (via tRPC actions) |
| `use-students-view-model.ts` | Student list state, filters, pagination | Yes (tRPC queries) |

---

## Touch Points / Key Files

| File | Purpose |
|------|---------|
| `src/hooks/use-mobile.tsx` | Mobile detection hook with breakpoint logic |
| `src/hooks/use-students-view-model.ts` | Student list ViewModel with filtering, pagination, navigation |
| `src/hooks/use-dify-chat.ts` | Dify AI chat integration for WhatsApp/chat |
| `src/hooks/use-toast.ts` | Toast notification hook (shadcn pattern) |

---

## JIT Index Hints

```bash
# Find all hooks
rg -n "export.*use[A-Z]" src/hooks/

# Find specific hook
rg -n "useIsMobile|useAuth|useTheme" src/hooks/

# Find tRPC usage in hooks
rg -n "trpc\." src/hooks/

# Find useState usage
rg -n "useState" src/hooks/
```

---

## Common Hook Patterns

**Data Fetching Hooks:**
```typescript
export function useLeads(mentoradoId: string, filters?: LeadFilters) {
  return trpc.leads.list.useQuery({ mentoradoId, ...filters });
}
```

**Mutation Hooks:**
```typescript
export function useLeadMutations() {
  const utils = trpc.useUtils();
  const create = trpc.leads.create.useMutation({
    onSuccess: () => utils.leads.list.invalidate(),
  });
  const update = trpc.leads.update.useMutation({
    onSuccess: () => utils.leads.list.invalidate(),
  });
  
  return { create, update };
}
```

**Local State Hooks:**
```typescript
export function useModalState() {
  const [isOpen, setIsOpen] = useState(false)
  const [data, setData] = useState(null)
  
  return { isOpen, setIsOpen, data, setData }
}
```

---

## Pre-PR Checks

```bash
# Ensure hooks are properly tested
bun run test src/hooks/

# Check for linting issues
bun run lint

# Type checking
bun run build
```

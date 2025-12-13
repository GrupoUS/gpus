# src/components/ - UI Components

## Package Identity

**Purpose:** Reusable React components for UI, CRM, dashboard, and layout  
**Tech:** React 19 + shadcn/ui + Tailwind CSS v4

---

## Setup & Run

Components are used within the main app. No separate dev server.

```bash
# Add new shadcn component
bunx shadcn@latest add [component-name]

# Example: Add dialog component
bunx shadcn@latest add dialog
```

---

## Patterns & Conventions

### Directory Structure

```
components/
├── ui/              # shadcn/ui base components (Button, Card, etc.)
├── crm/             # CRM-specific components
│   ├── lead-card.tsx
│   ├── pipeline-kanban.tsx
│   └── lead-form.tsx
├── dashboard/       # Dashboard widgets
│   └── stats-card.tsx
└── layout/          # Layout components
    ├── app-sidebar.tsx
    └── main-layout.tsx
```

### Component Patterns

✅ **DO:** Use functional components with TypeScript
```tsx
// src/components/crm/lead-card.tsx
interface LeadCardProps {
  lead: {
    _id: string
    name: string
    phone: string
  }
}

export function LeadCard({ lead }: LeadCardProps) {
  return (
    <Card className="p-4">
      <h3>{lead.name}</h3>
      <p>{lead.phone}</p>
    </Card>
  )
}
```

✅ **DO:** Use shadcn/ui components as building blocks
```tsx
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
```

✅ **DO:** Use Tailwind CSS for styling
```tsx
<div className="flex items-center gap-4 p-6 rounded-lg border">
```

❌ **DON'T:** Use inline styles
```tsx
// AVOID
<div style={{ display: 'flex', padding: '24px' }}>
```

### Design System

✅ **DO:** Use design tokens from Tailwind config
```tsx
// Colors
<div className="bg-primary text-primary-foreground">
<div className="bg-secondary text-secondary-foreground">
<div className="bg-muted text-muted-foreground">

// Spacing
<div className="p-4 gap-2">  // 4 = 1rem, 2 = 0.5rem

// Borders
<div className="border rounded-lg">
```

❌ **DON'T:** Hardcode colors or spacing
```tsx
// AVOID
<div className="bg-[#8b5cf6] p-[24px]">
```

### Component Composition

✅ **DO:** Compose components from smaller pieces
```tsx
// Example: src/components/dashboard/stats-card.tsx
export function StatsCard({ title, value, icon: Icon }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}
```

### Accessibility

✅ **DO:** Use semantic HTML and ARIA labels
```tsx
<button aria-label="Close dialog">
  <X className="h-4 w-4" />
</button>
```

✅ **DO:** Use shadcn/ui components (built-in accessibility)

---

## Touch Points / Key Files

| File | Purpose |
|------|---------|
| `src/components/ui/` | shadcn/ui base components |
| `src/components/layout/app-sidebar.tsx` | Main navigation sidebar |
| `src/components/crm/lead-card.tsx` | Lead card component example |
| `src/components/dashboard/stats-card.tsx` | Stats widget example |
| `src/lib/utils.ts` | `cn()` utility for class merging |

---

## JIT Index Hints

```bash
# Find a component
rg -n "export function" src/components

# Find component usage
rg -n "import.*from.*components" src/

# Find shadcn components
ls src/components/ui/

# Find Tailwind classes
rg -n "className=" src/components
```

---

## Common Gotchas

- **shadcn/ui:** Components are copied to your project (not npm package)
- **Tailwind:** Use `cn()` utility to merge classes conditionally
  ```tsx
  import { cn } from '@/lib/utils'
  <div className={cn('base-class', isActive && 'active-class')}>
  ```
- **Icons:** Use `lucide-react` for icons
  ```tsx
  import { User, Settings, LogOut } from 'lucide-react'
  ```
- **Forms:** Use shadcn Form components with react-hook-form
  ```tsx
  import { Form, FormField, FormItem, FormLabel } from '@/components/ui/form'
  ```

---

## Pre-PR Checks

```bash
# Ensure no linting errors
bun run lint

# Type check
bun run build
```

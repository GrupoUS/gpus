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
├── ui/                # shadcn/ui base components (Button, Card, Dialog, etc.)
├── crm/               # CRM pipeline and lead management
│   ├── lead-card.tsx           # Lead card with temperature indicators
│   ├── lead-detail.tsx         # Full lead details view
│   ├── lead-filters.tsx        # Filter controls
│   ├── lead-form.tsx           # Lead creation/edit form
│   └── pipeline-kanban.tsx     # Kanban board for pipeline
├── dashboard/         # Dashboard widgets and charts
│   ├── stats-card.tsx          # Metric card component
│   ├── churn-alerts.tsx        # Churn risk alerts
│   ├── funnel-chart.tsx        # Sales funnel visualization
│   ├── leads-by-product.tsx    # Product distribution chart
│   ├── leads-vs-conversions.tsx # Conversion comparison
│   ├── recent-leads.tsx        # Recent leads list
│   ├── response-time.tsx       # Response time metrics
│   └── team-performance.tsx    # Team performance metrics
├── students/          # Student management components
│   ├── student-card.tsx        # Student summary card
│   ├── student-detail.tsx      # Full student profile
│   ├── student-filters.tsx     # Filter controls
│   ├── student-form.tsx        # Student creation/edit
│   ├── student-header.tsx      # Detail page header
│   ├── student-stats.tsx       # Student statistics
│   ├── student-table.tsx       # Tabular student list
│   ├── student-timeline.tsx    # Activity timeline
│   ├── enrollment-card.tsx     # Enrollment details
│   └── tabs/                   # Tab components
│       ├── student-conversations-tab.tsx
│       ├── student-enrollments-tab.tsx
│       └── student-payments-tab.tsx
├── chat/              # Chat and messaging components
│   ├── ai-chat-widget.tsx      # Dify AI chat integration
│   ├── chat-input.tsx          # Message input
│   ├── chat-window.tsx         # Chat conversation view
│   ├── conversation-list.tsx   # Conversation sidebar
│   ├── message-bubble.tsx      # Message display
│   └── template-picker.tsx     # Message template selector
├── landing/           # Public landing page components
│   ├── hero.tsx                # Hero section
│   ├── features.tsx            # Features section
│   ├── dashboard-preview.tsx   # Preview section
│   ├── navbar.tsx              # Landing navbar
│   └── footer.tsx              # Footer
├── layout/            # Layout components
│   ├── app-sidebar.tsx         # Main navigation sidebar
│   └── main-layout.tsx         # Authenticated layout wrapper
├── theme-provider.tsx  # Dark/light theme context (optimized with useCallback/useMemo)
├── ui/animated-theme-toggler.tsx  # Animated theme toggle with View Transition API
├── debug-auth.tsx      # Auth debugging (dev only)
└── not-found.tsx       # 404 component
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

---

## Theme System

The project uses a custom Theme System with View Transition API support.

### Key Components
- `theme-provider.tsx`: Context provider. Handles `localStorage` and `matchMedia`.
- `theme-toggle.tsx`: Dropdown component for user selection.
- `lib/theme-transitions.ts`: Hook (`useThemeTransition`) for smooth animations.

### Usage
- Use `useTheme()` hook to get/set theme.
- Use `ThemeToggle` component in navbars/settings.
- Ensure colors in `index.css` meet WCAG 2.1 AA (contrast > 4.5:1).

### View Transitions
To enable the circular reveal animation, use the `useThemeTransition` hook and pass the event coordinates:
```tsx
const { animateThemeChange } = useThemeTransition();
// ...
animateThemeChange(newTheme, () => setTheme(newTheme), { x: e.clientX, y: e.clientY });
```

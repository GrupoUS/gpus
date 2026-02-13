# shadcn/ui Patterns

> Deep reference for shadcn/ui component integration in the neondash project.
> For quick reference, see the shadcn/ui section in `SKILL.md`.

---

## Core Philosophy

shadcn/ui is **not a library**. Components live in **your codebase**, not `node_modules`.

| Benefit | Why |
|---------|-----|
| Full ownership | Modify anything freely |
| No version lock-in | Update components selectively |
| Zero runtime overhead | Just the code you need |
| Complete customization | Choose Radix UI or Base UI primitives |

---

## Project Setup

### Neondash Configuration

Our project uses shadcn/ui with:
- **Tailwind CSS v4** (`@tailwindcss/vite`)
- **Radix UI** primitives
- **TypeScript strict mode**
- **Bun** as package manager

```bash
# Add a component
bunx shadcn@latest add [component-name]

# Add multiple components
bunx shadcn@latest add button card dialog input
```

### File Structure

```
client/src/
├── components/
│   ├── ui/            # shadcn components (owned, not node_modules)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   └── [feature]/     # composed business components
│       └── user-card.tsx
├── lib/
│   └── utils.ts       # cn() utility
└── app.css            # CSS variables for theming
```

### The `cn()` Utility

All shadcn components use `cn()` for intelligent class merging:

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## Component Discovery

### Via MCP (if shadcn MCP available)

| Tool | Purpose |
|------|---------|
| `list_components` | Browse full catalog |
| `get_component_metadata` | Props, dependencies, usage |
| `get_component_demo` | Implementation examples |
| `get_component` | Source code retrieval |
| `list_blocks` | Pre-built complex patterns |
| `get_block` | Block source code |

### Via CLI

```bash
# List installable components
bunx shadcn@latest add --help

# Install with dependencies auto-resolved
bunx shadcn@latest add dialog
```

---

## Customization Patterns

### 1. Theme via CSS Variables

Our GPUS theme uses CSS variables in `app.css`:

```css
@layer base {
  :root {
    --background: 0 0% 98%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --accent: 39 90% 55%;       /* Gold */
    --destructive: 0 84.2% 60.2%;
    /* ... more variables */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 39 90% 55%;       /* Gold in dark mode */
    /* ... dark overrides */
  }
}
```

### 2. Component Variants with CVA

Use `class-variance-authority` for variant logic:

```typescript
import { cva, type VariantProps } from "class-variance-authority"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        success: "bg-emerald-500/15 text-emerald-500",
        warning: "bg-amber-500/15 text-amber-500",
        destructive: "bg-destructive/15 text-destructive",
        outline: "border border-input text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  className?: string
  children: React.ReactNode
}

export function Badge({ className, variant, children }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)}>{children}</span>
}
```

### 3. Component Extension

**Rule:** Extend in `components/[feature]/`, not in `components/ui/`.

```tsx
// components/loading-button.tsx — CORRECT location
import { Button, type ButtonProps } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean
}

export function LoadingButton({ loading, children, disabled, ...props }: LoadingButtonProps) {
  return (
    <Button disabled={loading || disabled} {...props}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  )
}
```

---

## Common Patterns

### Forms with react-hook-form

```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const form = useForm<FormValues>({
  resolver: zodResolver(formSchema),
  defaultValues: { name: "", email: "" },
})
```

### Dialog / Modal

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"

<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button variant="outline">Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description text.</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button onClick={() => setOpen(false)}>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Data Table

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// For advanced tables, combine with TanStack Table:
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table"
```

### Dropdown Menu

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
```

### Command Palette

```tsx
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
```

---

## Blocks (Pre-built Complex Patterns)

shadcn provides complete UI blocks:

| Category | Examples |
|----------|---------|
| **dashboard** | Dashboard layouts, stat cards, charts |
| **sidebar** | Collapsible navigation sidebars |
| **login** | Authentication flows |
| **calendar** | Calendar interfaces |
| **products** | E-commerce components |

Install blocks:

```bash
bunx shadcn@latest add sidebar-01
bunx shadcn@latest add dashboard-01
```

---

## Accessibility Guarantees

Built on Radix UI primitives, all components include:

| Feature | Guarantee |
|---------|-----------|
| Keyboard navigation | Full keyboard support |
| ARIA attributes | Proper roles and states |
| Focus management | Logical focus flow |
| Screen reader | Announced correctly |

**When customizing, NEVER remove:**
- ARIA attributes
- Keyboard event handlers
- Focus indicators (`focus-visible:ring-*`)

---

## Troubleshooting

### Import Errors

```json
// tsconfig.json — verify path alias
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Style Conflicts

- Verify `app.css` imports Tailwind and CSS variables
- Check CSS variable names match between components and theme
- Ensure `cn()` is imported from `@/lib/utils`

### Missing Dependencies

```bash
# Auto-install via CLI
bunx shadcn@latest add [component]

# Manual check
bun add @radix-ui/react-[primitive]
```

### Dark/Light Mode

- Use `class` strategy (not `media`)
- All color values must use CSS variables, not hardcoded hex
- Test both modes after every component change

---

## Quality Checklist

Before committing shadcn components:

```
[ ] TypeScript: no type errors (`bun run check`)
[ ] Lint: passes Biome (`bun run lint:check`)
[ ] Accessibility: focus states visible, ARIA intact
[ ] Dark mode: tested and correct
[ ] Light mode: tested and correct
[ ] Responsive: works at mobile/tablet/desktop breakpoints
[ ] Extension: custom components NOT in `components/ui/`
```

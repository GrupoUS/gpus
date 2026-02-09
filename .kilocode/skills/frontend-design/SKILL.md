---
name: frontend-design
description: Unified frontend design skill covering React 19 patterns, Tailwind CSS v4, Web Design Guidelines (A11y, Animation, Forms), Stitch MCP workflows (prompt engineering, DESIGN.md, build loop, screen-to-React), and shadcn/ui deep integration. Use when designing components, layouts, prototyping with Stitch, or building aesthetic interfaces.
---

# Frontend Design Skill

> **Philosophy:** Intentional Minimalism. Every element must earn its place.

---

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | React 19 + Vite 7 | Function components, `ref` as prop |
| Styling | Tailwind CSS v4 | `@tailwindcss/vite` plugin |
| Components | shadcn/ui + Radix | Never reinvent primitives |
| Animation | Framer Motion 12 | Micro-interactions |
| Charts | Recharts 2 | Performance visualizations |
| Prototyping | Stitch MCP | AI-powered UI generation |

---

## React Performance Patterns (Vercel)

### Priority 1: Eliminating Waterfalls (CRITICAL)

| Rule | Pattern |
|------|---------|
| `async-defer-await` | Move `await` into branches where actually used |
| `async-parallel` | Use `Promise.all()` for independent operations |
| `async-suspense` | Use `<Suspense>` to stream content progressively |

```tsx
// ❌ Sequential waterfalls
const user = await getUser();
const posts = await getPosts();

// ✅ Parallel fetching
const [user, posts] = await Promise.all([getUser(), getPosts()]);
```

### Priority 2: Bundle Optimization (CRITICAL)

| Rule | Pattern |
|------|---------|
| `bundle-barrel-imports` | Avoid barrel files (`index.ts` re-exports) |
| `bundle-namespace-imports` | Use specific imports, not `import * as` |
| `bundle-dynamic-imports` | Use `React.lazy` for heavy components |

```tsx
// ❌ Barrel import
import { Button, Card, Modal } from "@/components";

// ✅ Direct imports
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
```

### Priority 3: Component Boundaries (HIGH)

| Rule | Pattern |
|------|---------|
| `client-boundary` | Keep `"use client"` at leaf components |
| `server-default` | Default to Server Components, client only for interactivity |
| `rerender-children` | Pass children as props to avoid re-renders |

---

## Web Design Standards (Vercel)

### Accessibility

| Rule | Standard |
|------|----------|
| Contrast | 4.5:1 minimum for text |
| Focus | Visible `focus-visible:ring-*`, never `outline-none` alone |
| Semantics | Use `<button>`, `<a>`, `<nav>` before ARIA |
| Headings | Hierarchical `<h1>`→`<h6>`, include skip links |

### Animation

| Rule | Standard |
|------|----------|
| Performance | Only `transform`/`opacity` (compositor-friendly) |
| Preference | Honor `prefers-reduced-motion` |
| Specificity | Never `transition: all`, list properties explicitly |
| Interruptible | Animations respond to user input mid-animation |

### Forms

| Rule | Standard |
|------|----------|
| Autocomplete | Always set `autocomplete` and meaningful `name` |
| Input Types | Use correct `type` (`email`, `tel`, `url`) and `inputmode` |
| Labels | Clickable via `htmlFor` or wrapping |
| Errors | Inline next to fields, focus first error on submit |
| Paste | Never block paste (`onPaste + preventDefault`) |

### Typography

| Rule | Standard |
|------|----------|
| Ellipsis | Use `…` not `...` |
| Quotes | Curly quotes `"` `"` not straight `"` |
| Numbers | `font-variant-numeric: tabular-nums` for columns |
| Loading | States end with `…`: "Loading…", "Saving…" |

---

## Stitch MCP — AI Prototyping Pipeline

### Overview

Stitch generates high-fidelity UI screens from text prompts via MCP. The full pipeline:

```
enhance-prompt → generate_screen → get_screen → adapt to React/Tailwind/shadcn
```

### Core Workflow

#### Step 1: Enhance the Prompt

Before sending to Stitch, **always** enhance vague prompts. Assess and add missing elements:

| Element | Check for | If missing… |
|---------|-----------|-------------|
| **Platform** | "web", "mobile", "desktop" | Add `DESKTOP` for dashboard |
| **Page type** | "dashboard", "form", "table" | Infer from description |
| **Structure** | Numbered sections/components | Create logical page structure |
| **Visual style** | Adjectives, mood, vibe | Add GPUS Navy/Gold descriptors |
| **Colors** | Specific hex values or roles | Inject from GPUS theme |
| **Components** | UI-specific terms | Translate to proper keywords |

**Vague → Structured transformation:**

| Vague | Enhanced |
|-------|----------|
| "menu at the top" | "navigation bar with logo and menu items" |
| "button" | "primary call-to-action button" |
| "list of items" | "card grid layout with thumbnails" |
| "form" | "form with labeled input fields and submit button" |
| "picture area" | "hero section with full-width image" |

**Vibe amplification:**

| Basic | Enhanced |
|-------|----------|
| "modern" | "clean, minimal, with generous whitespace" |
| "professional" | "sophisticated, trustworthy, with subtle shadows" |
| "dark mode" | "dark theme with high-contrast accents on deep backgrounds" |

> See `references/stitch-prompt-templates.md` for ready-to-use templates.

#### Step 2: Generate with Stitch MCP

```yaml
workflow:
  1. Create project: mcp_stitch_create_project (if needed)
  2. Generate screen: mcp_stitch_generate_screen_from_text
     - Use GEMINI_3_PRO for high fidelity
     - deviceType: DESKTOP for dashboard pages
     - Include DESIGN SYSTEM block in prompt
  3. Retrieve screen: mcp_stitch_get_screen
     - Get htmlCode.downloadUrl for source HTML
     - Get screenshot.downloadUrl for visual reference
  4. Handle output_components (suggestions or code)
```

#### Step 3: Convert to React Components

Architectural rules for Stitch → React conversion:

| Rule | Pattern |
|------|---------|
| **Modular** | Break design into independent component files |
| **Logic isolation** | Move handlers to custom hooks in `src/hooks/` |
| **Data decoupling** | Move static text/lists into data files or tRPC queries |
| **Type safety** | Every component has `Readonly<ComponentNameProps>` interface |
| **Style mapping** | Use Tailwind theme tokens, not arbitrary hex codes |

#### Step 4: Adapt to Project Stack

| From Stitch | To Neondash |
|-------------|-------------|
| Raw Tailwind classes | Tailwind v4 + GPUS theme tokens |
| Generic HTML | shadcn/ui primitives (Button, Card, Dialog, etc.) |
| Static content | tRPC queries + TanStack Query |
| Inline styles | CSS variables from design system |
| `npm` commands | `bun` commands |

### DESIGN.md Generation

When building **multiple Stitch screens for the same project**, generate a semantic DESIGN.md first:

1. **Retrieve** an existing screen from the Stitch project
2. **Analyze** the HTML/CSS → extract colors, typography, shapes, shadows
3. **Synthesize** into natural language descriptions:
   - "Deep Muted Teal-Navy (#294056)" not just "#294056"
   - "Pill-shaped" not "rounded-full"
   - "Whisper-soft diffused shadows" not "shadow-md"
4. **Include** the DESIGN SYSTEM block in every subsequent prompt

> See `references/stitch-workflows.md` for the full DESIGN.md generation workflow.

### Stitch Build Loop (Multi-Page Pattern)

For generating multiple dashboard pages with consistent design:

```
DESIGN.md → next-prompt.md (baton) → generate → integrate → update baton → repeat
```

**Baton file (`next-prompt.md`):**

```markdown
---
page: metrics-dashboard
---
A metrics dashboard showing monthly performance KPIs.

**DESIGN SYSTEM (REQUIRED):**
[Copy from DESIGN.md]

**Page Structure:**
1. Header with navigation
2. KPI cards grid
3. Charts section
4. Footer
```

**Critical rules:**
- Always include DESIGN SYSTEM block from DESIGN.md
- Don't recreate pages that already exist
- Update baton file before completing work

> See `references/stitch-workflows.md` for detailed loop protocol.

---

## shadcn/ui Integration

### Core Principle

shadcn/ui is **not a library** — it's components you **own**. Full customization, no version lock-in.

### Component Discovery (via MCP or CLI)

```bash
# List all available components
bunx shadcn@latest add [component-name]

# Init (existing project)
bunx shadcn@latest init
```

### Customization with CVA

```tsx
import { cva } from "class-variance-authority"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        outline: "border border-input",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)
```

### Extension Pattern

Create wrappers in `components/` (not `components/ui/`):

```tsx
// components/loading-button.tsx
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function LoadingButton({ loading, children, ...props }) {
  return (
    <Button disabled={loading} {...props}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}
```

### Blocks

Pre-built complex UI patterns: authentication, dashboards, sidebars, data tables. Use `bunx shadcn@latest add` to install.

> See `references/shadcn-patterns.md` for deep patterns and troubleshooting.

---

## Nano Banana Pro (Image Generation)

Generate assets using Gemini 3.0 Pro via `generate_image` tool.

```yaml
usage:
  - High-fidelity placeholders and mockups
  - UI illustrations and icons
  - Background patterns and gradients

best_practices:
  - Be specific about style, colors, dimensions
  - Reference GPUS design system palette
  - Request "clean, minimal, professional" for UI assets
```

---

## Quick Reference

### Component Checklist

- [ ] Uses shadcn/ui primitives (not custom buttons/modals)
- [ ] Client boundary at lowest possible level
- [ ] Parallel data fetching where applicable
- [ ] Visible focus states
- [ ] Respects `prefers-reduced-motion`
- [ ] Form inputs have `autocomplete` and `name`

### Import Pattern

```tsx
// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Hooks
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
```

### Stitch Prompt Checklist

- [ ] Platform specified (DESKTOP for dashboard)
- [ ] Visual style descriptors included
- [ ] DESIGN SYSTEM block with hex colors
- [ ] Page structure with numbered sections
- [ ] Component names use UI-specific terminology
- [ ] Using GEMINI_3_PRO model for high fidelity

---

## References

- `references/stitch-workflows.md` — DESIGN.md, Build Loop, Stitch-to-React pipelines
- `references/stitch-prompt-templates.md` — Ready-to-use prompt templates for GPUS theme
- `references/shadcn-patterns.md` — Deep shadcn/ui patterns, blocks, and troubleshooting
- `decision-trees.md` — Component selection decision trees
- `color-system.md` — Color system reference
- `typography-system.md` — Typography system reference
- `animation-guide.md` — Animation patterns
- `tailwind-v4-patterns.md` — Tailwind v4 specific patterns
- `ux-psychology.md` — UX psychology principles

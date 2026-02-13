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
| Design Intelligence | ui-ux-pro-max | Style/color/typography recommendations |

---

## GPUS Design System — Our Theme

> **Identity:** Azul Petróleo + Gold accents. Professional, premium, educational.
> Full reference: `references/project-design-system.md` · Theme source: `gpus-theme/SKILL.md`

### Quick Palette

| Token | Light | Dark | Purpose |
|-------|-------|------|---------|
| `--primary` | Gold `38 60% 45%` | Amber `43 96% 56%` | Buttons, links, CTAs |
| `--background` | Slate 50 `210 40% 98%` | Slate 950 `222 47% 6%` | Page bg |
| `--foreground` | Petróleo `203 65% 26%` | Slate 50 `210 40% 98%` | Body text |
| `--accent` | Gold 95% `38 60% 95%` | Navy `217 33% 17%` | Hover highlights |
| `--ring` | Gold | Gold | Focus indicators |

### Brand Extensions

| Utility Class | Purpose |
|---------------|--------|
| `text-neon-petroleo` | Azul Petróleo brand text |
| `text-neon-gold` / `bg-neon-gold` | Gold brand elements |
| `text-neon-blue-light` | Light blue accent (dark mode) |
| `border-neon-border` | Standard brand border |

### Typography

- **Primary font:** Manrope (`@fontsource/manrope`)
- **Mono:** Fira Code / JetBrains Mono
- **Radius:** `0.5rem` (8px)

### Color Rules

| ✅ Do | ❌ Don't |
|-------|--------|
| `bg-primary` | `bg-[#b45309]` |
| `text-foreground` | `text-[#0f172a]` |
| `text-neon-petroleo` | `text-[#0f4c75]` |
| `border-border` | `border-gray-300` |

**Rule:** Always use semantic tokens or custom utility classes. Never hardcode hex values.

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

## Layout & Scroll Standards

### Overflow Chain Rule (CRITICAL)

Every scrollable page must follow the **single scroll owner** pattern:

| Rule | Standard |
|------|----------|
| Scroll owner | Only `<main>` (via `<ScrollArea>`) owns vertical scroll |
| No clip on content | Never use `overflow-hidden` on content wrappers |
| No constrained tabs | Tab containers must NOT use `h-full` + `min-h-0` |
| Natural flow | Content flows naturally; height is determined by content |
| ScrollArea usage | Use shadcn `<ScrollArea>` instead of native `overflow-y-auto` |

```tsx
// ❌ Blocks scroll — content clipped
<div className="h-full overflow-hidden">
  <div className="h-full overflow-y-auto">
    {/* deep content */}
  </div>
</div>

// ✅ Content flows naturally, ScrollArea handles scroll
<main className="flex-1 overflow-hidden">
  <ScrollArea className="flex-1">
    <div className="p-6">{children}</div>
  </ScrollArea>
</main>
```

### Responsive Sizing Rules

| Element | Mobile | Desktop (lg) | Large (xl) |
|---------|--------|--------------|------------|
| Page headings | `text-2xl` | `text-3xl` | `text-4xl` |
| Section headings | `text-lg` | `text-xl` | `text-2xl` |
| Card stat values | `text-xl` | `text-2xl` | `text-3xl` |
| Card labels | `text-xs` | `text-sm` | `text-sm` |
| Card padding | `p-4` | `p-6` | `p-8` |
| Grid gaps | `gap-4` | `gap-6` | `gap-8` |
| Icon containers | `w-10 h-10` | `w-12 h-12` | `w-14 h-14` |

Cards must always fill available width (`w-full` or grid layout).

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

## Project Architecture

### Component Inventory

| Directory | Count | Purpose |
|-----------|-------|---------|
| `ui/` | 86 | shadcn/ui owned primitives |
| `dashboard/` | 41 | KPI cards, charts, metrics |
| `crm/` | 18 | Kanban board, lead management |
| `financeiro/` | 18 | Financial management |
| `pacientes/` | 17 | Patient records, procedures |
| `chat/` | 15 | WhatsApp messaging |
| `landing/` | 13 | Landing page sections |
| `settings/` | 10 | Settings page cards |
| `mentor/` | 8 | Mentor impersonation |

### Core Layout Pattern

```
DashboardLayout (sidebar + main)
└── ScrollArea (single scroll owner)
    └── PageContainer (padding wrapper)
        └── Page content (natural flow)
```

### Established Page Patterns

| Pattern | Grid | Used In |
|---------|------|---------|
| KPI cards row | `grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6` | Dashboard |
| Settings grid | `grid-cols-1 lg:grid-cols-2 gap-6` | Settings |
| Kanban columns | Horizontal scroll + drag-and-drop | CRM |
| Tabbed detail | Tabs + natural flow content | Pacientes |

> Full architecture map: `references/project-design-system.md`

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
- [ ] Page content scrolls when exceeding viewport height
- [ ] No `overflow-hidden` on content wrappers (only decorative containers)
- [ ] Text/padding/gaps use responsive breakpoints (sm/lg/xl)
- [ ] Cards fill available width on all screen sizes
- [ ] Uses `<ScrollArea>` instead of native `overflow-y-auto` for main content

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

## Design Intelligence

Use `ui-ux-pro-max` for design research BEFORE implementation. See the `/design` workflow for the full pipeline.

### When to Use

| Scenario | Command |
|----------|--------|
| New page/feature design | `python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<keywords>" --design-system` |
| Style exploration | `python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<style>" --domain style` |
| Chart selection | `python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<type>" --domain chart` |
| UX best practices | `python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<topic>" --domain ux` |
| Typography alternatives | `python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<mood>" --domain typography` |

### Reconciliation Rule

> **GPUS tokens are immutable.** `ui-ux-pro-max` informs layout, style, and typography *choices*, but color token values always come from our GPUS theme. Never replace `--primary` with a generated palette suggestion.

| Source | Provides |
|--------|--------|
| `ui-ux-pro-max` | Layout patterns, style keywords, typography pairings, anti-patterns |
| GPUS theme | Color token values, brand identity, CSS variables |
| This skill | Code patterns, component standards, implementation rules |

---

## References

| Reference | Purpose |
|-----------|--------|
| [project-design-system.md](references/project-design-system.md) | Full GPUS tokens, component architecture, page patterns |
| [stitch-workflows.md](references/stitch-workflows.md) | DESIGN.md, Build Loop, Stitch-to-React pipelines |
| [stitch-prompt-templates.md](references/stitch-prompt-templates.md) | Ready-to-use prompt templates for GPUS theme |
| [shadcn-patterns.md](references/shadcn-patterns.md) | Deep shadcn/ui patterns, blocks, troubleshooting |
| [decision-trees.md](decision-trees.md) | Component selection decision trees |
| [color-system.md](color-system.md) | Color system reference |
| [typography-system.md](typography-system.md) | Typography system reference |
| [animation-guide.md](animation-guide.md) | Animation patterns |
| [tailwind-v4-patterns.md](tailwind-v4-patterns.md) | Tailwind v4 specific patterns |
| [ux-psychology.md](ux-psychology.md) | UX psychology principles |

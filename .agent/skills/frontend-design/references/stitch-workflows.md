# Stitch MCP Workflows

> Deep reference for Stitch-powered UI generation workflows. For quick reference, see `SKILL.md`.

---

## Pipeline Overview

```
┌─────────────────────────────────────────────────────────────┐
│  1. DESIGN.md     →  Semantic design system extraction      │
│  2. enhance-prompt →  Vague idea → structured prompt        │
│  3. generate       →  Stitch MCP screen generation          │
│  4. convert        →  Stitch HTML → React + shadcn/ui       │
│  5. build-loop     →  Multi-page iteration (baton pattern)  │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. DESIGN.md Generation Workflow

### When to Generate

- Starting a new Stitch project with multiple screens
- Existing Stitch project needs design consistency
- Onboarding a new design language into the pipeline

### Retrieval Steps

1. **Project lookup** (if ID not known):
   - `mcp_stitch_list_projects` with `filter: "view=owned"`
   - Extract Project ID from `name` field (e.g., `projects/13534454087919359824`)

2. **Screen lookup**:
   - `mcp_stitch_list_screens` with `projectId` (numeric only)
   - Identify target screen by title

3. **Metadata fetch**:
   - `mcp_stitch_get_screen` with `projectId` + `screenId`
   - Returns: `screenshot.downloadUrl`, `htmlCode.downloadUrl`, dimensions, `designTheme`

4. **Asset download**:
   - Download HTML from `htmlCode.downloadUrl`
   - Parse for Tailwind classes, custom CSS, component patterns

5. **Project metadata**:
   - `mcp_stitch_get_project` with full path `projects/{id}`
   - Extract `designTheme` (color mode, fonts, roundness, custom colors)

### Analysis & Synthesis

| Step | What to Extract | Output Style |
|------|-----------------|-------------|
| **Identity** | Project title + ID | JSON |
| **Atmosphere** | Overall mood/vibe | Evocative adjectives ("Airy", "Dense", "Minimalist") |
| **Colors** | Key color palette | Descriptive Name + Hex + Functional Role |
| **Geometry** | Border radius, layout | Physical descriptions ("Pill-shaped", "Sharp edges") |
| **Depth** | Shadows, elevation | Quality descriptions ("Whisper-soft diffused shadows") |

### DESIGN.md Structure

```markdown
# Design System: [Project Title]

**Project ID:** [ID]

## 1. Visual Theme & Atmosphere
(Mood, density, aesthetic philosophy)

## 2. Color Palette & Roles
- Descriptive Name (#hex) — Functional Role
- Deep Navy (#0a0f1c) — Primary backgrounds
- Electric Gold (#f5a623) — Accent highlights and CTAs

## 3. Typography Rules
(Font family, weight usage, letter-spacing)

## 4. Component Stylings
* **Buttons:** Shape, color, behavior
* **Cards/Containers:** Corners, background, shadow depth
* **Inputs/Forms:** Stroke style, background

## 5. Layout Principles
(Whitespace strategy, margins, grid alignment)

## 6. Design System Notes for Stitch Generation
(Copyable block for prompts — include in every next-prompt.md)
```

### Best Practices

- ❌ "blue" or "rounded" → ✅ "Ocean-deep Cerulean (#0077B6)" or "Gently curved edges"
- ❌ Omitting hex codes → ✅ Always include exact values in parentheses
- ❌ Forgetting functional roles → ✅ "Used for primary actions"

---

## 2. Prompt Enhancement Pipeline

### Assessment Checklist

Before sending any prompt to Stitch, verify these elements:

```
[ ] Platform specified (DESKTOP for dashboard)
[ ] Page type identified (dashboard, form, data table)
[ ] Numbered page structure
[ ] Visual style descriptors
[ ] Color palette with hex values
[ ] UI-specific component terminology
[ ] DESIGN SYSTEM block (if multi-screen project)
```

### Enhancement Techniques

#### A. Keyword Replacement

| Vague Input | Enhanced Output |
|-------------|-----------------|
| "menu at the top" | "navigation bar with logo, breadcrumbs, and user avatar" |
| "some buttons" | "primary CTA button with secondary outline variant" |
| "a table" | "data table with sortable columns, pagination, and row actions" |
| "charts area" | "responsive chart grid with line and bar charts using muted palette" |
| "sidebar" | "collapsible sidebar navigation with icon-only collapse state" |

#### B. Structure Template

```markdown
**Page Structure:**
1. **Header:** Navigation with logo, breadcrumbs, user menu
2. **Sidebar:** Collapsible navigation with icon labels
3. **Main Content:** [Describe primary content area]
4. **Footer:** Status bar or minimal footer
```

#### C. Color Formatting

Always format colors as: `Descriptive Name (#hexcode) for functional role`

```
Deep Navy (#0a0f1c) for primary backgrounds
Electric Gold (#f5a623) for accent highlights and CTAs
Soft Gray (#6b7280) for secondary text
```

### Check for DESIGN.md

- **If exists:** Read and include the "Design System Notes for Stitch Generation" block
- **If not exists:** Generate one first using the workflow above, or add a note:
  ```
  💡 Tip: For consistent designs across screens, create a DESIGN.md using the design-md workflow.
  ```

---

## 3. Stitch Build Loop (Baton Pattern)

### Purpose

Autonomous multi-page generation with consistent design across all screens.

### File Structure

```
project/
├── next-prompt.md       # The baton — current task
├── stitch.json          # Stitch project ID (persist!)
├── DESIGN.md            # Visual design system
├── SITE.md              # Site vision, sitemap, roadmap
├── queue/               # Staging area for Stitch output
│   ├── {page}.html
│   └── {page}.png
└── client/src/pages/    # Production pages (neondash)
    └── {page}.tsx
```

### Execution Protocol

#### Step 1: Read Baton
Parse `next-prompt.md` → extract page name + prompt content.

#### Step 2: Consult Context
- **SITE.md** → Check sitemap (don't recreate existing pages), pick from roadmap
- **DESIGN.md** → Required visual style for prompts

#### Step 3: Generate with Stitch
1. Get or create project (persist ID to `stitch.json`)
2. `mcp_stitch_generate_screen_from_text` with full prompt + design system
3. `mcp_stitch_get_screen` → download HTML + screenshot

#### Step 4: Integrate
1. Convert HTML to React component with shadcn/ui primitives
2. Add to routing (TanStack Router)
3. Wire navigation links
4. Replace static data with tRPC queries

#### Step 5: Update Documentation
- Mark page complete in SITE.md sitemap
- Remove consumed items from roadmap

#### Step 6: Prepare Next Baton (CRITICAL)
Update `next-prompt.md` with next page + DESIGN SYSTEM block.

### Orchestration

| Method | Use Case |
|--------|----------|
| **Human-in-loop** | Review each iteration before continuing |
| **Sequential** | Run agent repeatedly with same repo |
| **CI/CD** | Trigger on `next-prompt.md` changes |

---

## 4. Stitch → React Conversion Rules

### Architectural Rules

| Rule | Implementation |
|------|---------------|
| **Modular components** | One component per file, max ~150 lines |
| **Logic isolation** | Event handlers → custom hooks in `src/hooks/` |
| **Data decoupling** | Static text → tRPC queries or data files |
| **Type safety** | `Readonly<ComponentNameProps>` interface per component |
| **Style mapping** | Theme tokens, not arbitrary hex codes |

### Conversion Checklist

```
[ ] Extracted Tailwind config from Stitch HTML <style>
[ ] Mapped colors to GPUS theme CSS variables
[ ] Replaced raw HTML with shadcn/ui primitives
[ ] Moved static content to tRPC or mock data
[ ] Added TypeScript interfaces for all props
[ ] Created custom hooks for business logic
[ ] Verified responsive behavior
[ ] Added Framer Motion for micro-interactions
```

### Stack Adaptation Table

| Stitch Output | Neondash Equivalent |
|---------------|---------------------|
| `<button class="...">` | `<Button variant="default">` from shadcn |
| `<div class="card ...">` | `<Card><CardContent>` from shadcn |
| `<input ...>` | `<Input>` from shadcn + `react-hook-form` |
| `<dialog>` | `<Dialog>` from shadcn |
| `<table>` | `<Table>` from shadcn or TanStack Table |
| Arbitrary colors | GPUS CSS variables (`hsl(var(--primary))`) |
| `npm install` | `bun install` |
| Static routes | TanStack Router file-based routes |

---

## 5. Visual Verification

After generating and converting a screen:

1. Start dev server: `bun dev`
2. Navigate to the new page
3. Compare against Stitch screenshot
4. Check responsive behavior at breakpoints
5. Verify dark/light mode
6. Test keyboard navigation and focus states

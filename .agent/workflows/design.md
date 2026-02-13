---
description: Canonical design workflow. 6-phase pipeline from design intelligence through validation.
---

# /design — Design Workflow

> Orchestration-only. Deep policy lives in `frontend-design/SKILL.md`, `gpus-theme/SKILL.md`, and `ui-ux-pro-max/SKILL.md`.

---

## 1. Mandatory Skill Loading

```yaml
ALWAYS_LOAD:
  - .agent/skills/frontend-design/SKILL.md     # Code standards + GPUS inline
  - .agent/skills/gpus-theme/SKILL.md           # Full theme tokens (when needed)
  - .agent/skills/ui-ux-pro-max/SKILL.md        # Design intelligence engine
```

## 2. Task Routing

| Task Type | Primary Reference |
|-----------|------------------|
| New page/feature | `ui-ux-pro-max` → `project-design-system.md` |
| Component design | `shadcn-patterns.md` → `decision-trees.md` |
| Stitch prototyping | `stitch-workflows.md` → `stitch-prompt-templates.md` |
| Color/typography questions | `color-system.md` → `typography-system.md` |
| Animation/interaction | `animation-guide.md` → `ux-psychology.md` |
| Tailwind patterns | `tailwind-v4-patterns.md` |
| Multi-page consistency | `stitch-workflows.md` § DESIGN.md |
| Layout patterns | `project-design-system.md` § Page Design Patterns |

---

## 3. Execution Phases

### Phase 0 — Design Intelligence

> Use `ui-ux-pro-max` for inspiration and best practices BEFORE any implementation.

**When required:** New pages, feature areas, landing pages, or significant UI redesigns.
**Skip when:** Bug fixes, minor tweaks, or adding a field to an existing form.

```bash
# Full design system recommendation
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<feature keywords>" --design-system

# Domain-specific research
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<topic>" --domain style
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<topic>" --domain chart
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<topic>" --domain ux
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<topic>" --domain typography

# Multi-page projects: persist design system
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<project>" --design-system --persist
```

**Output:** Design recommendations (style, palette, typography, chart types, anti-patterns).

---

### Phase 1 — Intent & Context

1. **Clarify the goal** — What does the user need? Page, component, or redesign?
2. **Audit existing patterns** — Check `project-design-system.md` for page patterns already in use
3. **Identify scope** — New component vs extending existing, how many pages affected
4. **Check component inventory** — Does a similar component already exist?

```yaml
audit_checklist:
  - Existing page patterns that match?
  - Components to reuse from ui/ or feature dirs?
  - Layout template to follow? (KPI, Kanban, Settings, Tabbed)
  - Dark mode impact?
```

---

### Phase 2 — Theme Reconciliation

Merge `ui-ux-pro-max` output (Phase 0) with GPUS theme constraints:

| ui-ux-pro-max Suggests | GPUS Decision |
|------------------------|---------------|
| Color palette | **Ignore.** Keep GPUS tokens unchanged |
| Typography pairing | **Adopt if compatible** with Manrope primary |
| Layout pattern | **Adopt.** Use as layout guidance |
| Animation style | **Adopt.** Apply via Framer Motion |
| Chart type | **Adopt.** Implement with Recharts + GPUS chart colors |
| Component choices | **Validate** against shadcn/ui inventory first |

> **Iron rule:** GPUS token values are immutable. `ui-ux-pro-max` provides layout, style, and interaction guidance only.

---

### Phase 3 — Prototyping

**Option A — Stitch MCP** (visual prototyping):

1. Enhance prompt with GPUS context from `stitch-prompt-templates.md`
2. Generate screen → review → iterate
3. For multi-page: create `DESIGN.md` first for consistency

**Option B — Direct Implementation** (code-first):

1. Start from established page pattern in `project-design-system.md`
2. Build with shadcn/ui primitives from `ui/`
3. Apply GPUS tokens from the start

```yaml
routing:
  new_page: Option A (Stitch first)
  component_refactor: Option B (code-first)
  landing_page: Option A (Stitch + DESIGN.md)
  dashboard_widget: Option B (code-first)
```

---

### Phase 4 — Implementation

Follow `frontend-design/SKILL.md` strictly:

1. **shadcn/ui first** — Use existing primitives from `ui/`. Never reinvent
2. **GPUS tokens always** — `bg-primary`, `text-foreground`, `text-neon-petroleo`, no hardcoded hex
3. **Feature components** in `components/[feature]/`, NOT in `components/ui/`
4. **Framer Motion** for enter/exit animations, stagger effects
5. **Recharts** with GPUS chart color tokens for data viz
6. **Responsive** — mobile-first with `lg:` breakpoints for desktop

```yaml
quality_gates:
  - Uses semantic color tokens only
  - All interactive elements have focus ring (--ring)
  - Dark mode works (toggle test)
  - No layout shift on load
  - ScrollArea at DashboardLayout level only
```

---

### Phase 5 — Validation

#### Accessibility
- [ ] Color contrast ≥ 4.5:1 (text), ≥ 3:1 (large text)
- [ ] All interactive elements keyboard-accessible
- [ ] ARIA labels on icon-only buttons
- [ ] Focus visible on all focusable elements

#### Responsive
- [ ] Mobile (`< 640px`): single column, touch targets ≥ 44px
- [ ] Tablet (`640px–1023px`): 2-column adapts
- [ ] Desktop (`≥ 1024px`): full grid, max-width 1280px

#### Dark Mode
- [ ] All text readable against dark backgrounds
- [ ] No hardcoded colors bypassing theme
- [ ] Charts use `--chart-*` tokens

#### Component Quality
- [ ] No custom components duplicating shadcn/ui primitives
- [ ] CVA variants for component variations
- [ ] TypeScript strict — no `any`

#### Pre-Delivery (from ui-ux-pro-max)
- [ ] Visual hierarchy clear (max 3 heading levels)
- [ ] Whitespace balanced (not cramped, not empty)
- [ ] Loading states implemented (skeletons)
- [ ] Error states handled
- [ ] Empty states designed

---

## 4. MCP Routing

| Need | MCP Tool |
|------|----------|
| Generate visual prototype | `stitch` (generate_screen_from_text) |
| Edit existing prototype | `stitch` (edit_screens) |
| Look up library docs | `context7` (query-docs) |
| Research design patterns | `tavily` (searchContext) |
| Complex design reasoning | `sequential-thinking` |

---

## 5. Anti-Patterns

| ❌ Don't | ✅ Do |
|----------|------|
| Build custom modal from scratch | Use `Dialog` from shadcn/ui |
| Hardcode `bg-[#0f4c75]` | Use `text-neon-petroleo` utility |
| Skip Phase 0 for new pages | Always research first |
| Replace GPUS colors with generated palette | Adopt layout guidance, keep tokens |
| Add CSS to component files | Use Tailwind classes or index.css utilities |
| Create components in `ui/` | Feature components go in `components/[feature]/` |
| Skip dark mode testing | Always verify both themes |
| Use multiple scroll containers | Single `ScrollArea` at layout level |

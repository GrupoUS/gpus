---
description: Canonical design workflow. Orchestration-only; style/pattern policy stays in design skills.
---

# /design - Design Orchestration

$ARGUMENTS

## Mandatory Skill Loading

Before any design work, load the primary skill and route to the appropriate reference:

1. **Always load:** `.agent/skills/frontend-design/SKILL.md`
2. **Route by task type:**

| Task Type | Load Reference |
|-----------|---------------|
| New Stitch screen / prototype | `references/stitch-prompt-templates.md` → pick template, enhance, generate |
| Multi-page Stitch generation | `references/stitch-workflows.md` → DESIGN.md + Build Loop |
| Stitch → React conversion | `references/stitch-workflows.md` → Section 4 conversion rules |
| shadcn/ui component work | `references/shadcn-patterns.md` → discovery, CVA, blocks |
| Color/palette decisions | `color-system.md` + `gpus-theme` skill |
| Typography decisions | `typography-system.md` |
| Animation/motion | `animation-guide.md` |
| Component selection | `decision-trees.md` |
| UX trade-offs | `ux-psychology.md` + `sequentialthinking` MCP |
| Tailwind v4 patterns | `tailwind-v4-patterns.md` |

3. **For broad redesigns/features:** Run `/plan` first

## Execution Sequence

### Phase 1: Intent & Context

1. Clarify intent and UX target
2. Audit existing components/patterns (search codebase first)
3. Load appropriate reference(s) from the table above

### Phase 2: Stitch Prototyping (if generating new UI)

1. **Enhance the prompt** — Apply the enhancement pipeline from `SKILL.md`:
   - Assess missing elements (platform, page type, structure, colors, components)
   - Inject GPUS theme colors (Navy/Gold) from `references/stitch-prompt-templates.md`
   - Add UI-specific keywords and vibe amplification
   - Structure with numbered sections

2. **Check for DESIGN.md** — If multi-screen project:
   - If exists: include DESIGN SYSTEM block in prompt
   - If not: generate one first using workflow from `references/stitch-workflows.md` Section 1

3. **Generate with Stitch MCP:**
   ```
   mcp_stitch_create_project (if needed)
   → mcp_stitch_generate_screen_from_text (GEMINI_3_PRO, DESKTOP)
   → mcp_stitch_get_screen (retrieve HTML + screenshot)
   ```

4. **Handle output_components** — If Stitch returns suggestions, present to user

### Phase 3: Implementation

1. **Convert Stitch → React** (if from Stitch):
   - Follow conversion rules from `references/stitch-workflows.md` Section 4
   - Replace raw HTML with shadcn/ui primitives (`references/shadcn-patterns.md`)
   - Map colors to GPUS CSS variables (not arbitrary hex)
   - Extract static content to tRPC queries
   - Move logic to custom hooks

2. **Component work** (if not from Stitch):
   - Use shadcn/ui primitives — check `references/shadcn-patterns.md` for patterns
   - Follow CVA for variants, extension pattern for custom components
   - Use `bunx shadcn@latest add [component]` for new primitives

3. **Styling:**
   - Tailwind v4 classes with GPUS theme tokens
   - Framer Motion for micro-interactions (honor `prefers-reduced-motion`)
   - Only `transform`/`opacity` animations (compositor-friendly)

### Phase 4: Validation

1. **Accessibility:** Contrast 4.5:1, visible focus states, semantic HTML, keyboard nav
2. **Responsive:** Test mobile/tablet/desktop breakpoints
3. **Dark/Light mode:** Both tested and correct
4. **Component checklist** from `SKILL.md`:
   ```
   [ ] Uses shadcn/ui primitives
   [ ] Client boundary at lowest level
   [ ] Parallel data fetching
   [ ] Visible focus states
   [ ] Respects prefers-reduced-motion
   [ ] Form inputs have autocomplete + name
   ```

5. **Quality gates:**
   ```bash
   bun run check
   bun run lint:check
   bun run test
   ```

## MCP Routing

| MCP | When |
|-----|------|
| `stitch` | UI prototype generation, screen retrieval |
| `context7` | React/Tailwind/shadcn/Radix docs |
| `tavily` | Only when official docs are insufficient |
| `sequentialthinking` | Complex UX trade-offs, layout decisions |

## Anti-Patterns

| ❌ Bad | ✅ Good |
|--------|---------|
| Vague Stitch prompts | Enhanced prompts with DESIGN SYSTEM block |
| Arbitrary hex colors | GPUS theme CSS variables |
| Custom buttons/modals | shadcn/ui primitives |
| Monolithic components | Modular components with custom hooks |
| Skip accessibility | A11y validation before completion |
| `npm` / `npx` | `bun` / `bunx` |

## References

- `.agent/skills/frontend-design/SKILL.md` — Primary skill (pipeline, patterns, checklists)
- `.agent/skills/frontend-design/references/stitch-workflows.md` — DESIGN.md, Build Loop, conversion
- `.agent/skills/frontend-design/references/stitch-prompt-templates.md` — GPUS prompt templates
- `.agent/skills/frontend-design/references/shadcn-patterns.md` — Component patterns, CVA, blocks
- `.agent/skills/gpus-theme/SKILL.md` — GPUS Navy/Gold design system
- `.agent/skills/ui-ux-pro-max/SKILL.md` — Styles, palettes, font pairings
- `.agent/workflows/plan.md` — Use for broad redesigns

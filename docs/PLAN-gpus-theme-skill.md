# PLAN: Create GPUS Theme Skill

> **Mode:** CONSERVATIVE (plan only, no code)
> **Complexity:** L4 (multi-file skill creation)
> **Output:** `.agent/skills/gpus-theme/`

---

## Goal

Create a portable skill called `gpus-theme` that encapsulates the complete design system of the GPUS project (Portal Grupo US). This skill enables reuse of the theme in other projects, including:

- Light and dark theme CSS variables (Navy/Gold palette)
- shadcn/ui configuration (new-york style, registries)
- 43 UI components listing
- Tailwind v4 theme configuration

---

## Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | Dark theme: Navy background (`211 49% 10%`) + Gold foreground (`39 44% 65%`) | 5/5 | `src/index.css:124-183` | Core palette |
| 2 | Light theme: White background + Gold primary (`38 60% 45%`) | 5/5 | `src/index.css:64-122` | Core palette |
| 3 | shadcn style: `new-york`, base color: `zinc`, CSS variables: `true` | 5/5 | `components.json` | Config portability |
| 4 | 8 component registries: kokonutui, aceternity, magicui, tweakcn, shadcnui-blocks, cult-ui, originui, tailark | 5/5 | `components.json:20-28` | Extended components |
| 5 | 43 UI components in `src/components/ui/` including sidebar, hero-parallax, macbook-scroll | 5/5 | File listing | Component inventory |
| 6 | Custom utilities: `bg-mesh`, `glass-card`, `bg-noise`, `animate-ripple` | 5/5 | `src/index.css:218-268` | Visual effects |
| 7 | Smooth theme transitions with View Transition API | 4/5 | `src/index.css:200-252` | Animation system |
| 8 | Border radius: `0.625rem` (10px) | 5/5 | `src/index.css:111` | Spacing system |

### Knowledge Gaps

1. No explicit font-family defined in CSS (uses browser defaults + Tailwind)
2. No typography scale tokens (relies on Tailwind defaults)

### Assumptions to Validate

1. Theme can be applied to any Tailwind v4 + shadcn project
2. No project-specific dependencies in CSS variables

### Edge Cases

1. **Non-Tailwind projects:** Provide raw CSS fallback
2. **Tailwind v3 projects:** Include migration notes for `@theme` vs `theme.extend`
3. **Different shadcn styles:** Document how to override `new-york` specifics
4. **Chart colors:** Different between light (gold-based) and dark (purple-based)
5. **Sidebar tokens:** Complete separate set of 8 variables

---

## Proposed Changes

### [NEW] `.agent/skills/gpus-theme/SKILL.md`

Main skill file with:
- Description: Portable GPUS design system theme
- Trigger conditions: When applying GPUS branding to projects
- Quick start guide
- References to assets and references

### [NEW] `.agent/skills/gpus-theme/references/css-variables.md`

Complete documentation of all CSS custom properties:
- `:root` (light theme) - 26 variables
- `.dark` (dark theme) - 27 variables
- HSL format explanation
- Usage examples

### [NEW] `.agent/skills/gpus-theme/references/shadcn-config.md`

Documentation of shadcn/ui configuration:
- `components.json` full content
- Alias paths explanation
- Registries list with purpose
- Component inventory (43 components)

### [NEW] `.agent/skills/gpus-theme/assets/theme-tokens.css`

Portable CSS file that can be copied directly:
- Complete `:root` and `.dark` definitions
- `@theme` block for Tailwind v4
- Custom utilities (`bg-mesh`, `glass-card`, etc.)

### [NEW] `.agent/skills/gpus-theme/assets/tailwind-theme.ts`

TypeScript configuration for `tailwind.config.ts`:
- Color tokens as JS object
- For Tailwind v3 compatibility
- Export for `theme.extend.colors`

### [NEW] `.agent/skills/gpus-theme/assets/components.json`

Complete shadcn configuration file ready to use

---

## Atomic Tasks

### AT-001: Initialize Skill Directory ⚡
```bash
python .agent/skills/skill-creator/scripts/init_skill.py gpus-theme --path .agent/skills
```
**Validation:** Directory `.agent/skills/gpus-theme/` exists with SKILL.md
**Rollback:** `rm -rf .agent/skills/gpus-theme`

### AT-002: Create SKILL.md ⚡
Write main skill file with complete documentation.
**Validation:** `cat .agent/skills/gpus-theme/SKILL.md | head -20` shows frontmatter
**Rollback:** Restore from template

### AT-003: Create css-variables.md Reference
Document all CSS variables from `src/index.css`.
**Validation:** File exists and contains `--background`, `--primary`, `--chart-*`
**Rollback:** Delete file

### AT-004: Create shadcn-config.md Reference
Document shadcn configuration and component list.
**Validation:** File contains `new-york`, registries, 43 components
**Rollback:** Delete file

### AT-005: Create theme-tokens.css Asset ⚡
Copy and organize CSS from `src/index.css`.
**Validation:** File is valid CSS, contains `:root` and `.dark`
**Rollback:** Delete file

### AT-006: Create tailwind-theme.ts Asset ⚡
Convert CSS vars to TypeScript config object.
**Validation:** File exports `gpusTheme` object
**Rollback:** Delete file

### AT-007: Copy components.json Asset ⚡
Copy `components.json` to assets.
**Validation:** Files are identical: `diff components.json .agent/skills/gpus-theme/assets/components.json`
**Rollback:** Delete file

### AT-008: Cleanup Example Files
Remove unused `scripts/example.py`, `references/api_reference.md`, `assets/example_asset.txt`.
**Validation:** Files no longer exist
**Rollback:** Re-run init_skill.py

### AT-009: Update GEMINI.md Skills List
Add `gpus-theme` to available skills table.
**Validation:** `grep "gpus-theme" GEMINI.md` returns match
**Rollback:** Revert GEMINI.md

---

## Verification Plan

### Automated Tests
None available - this is a documentation/asset skill.

### Manual Verification
1. **Structure check:**
   ```bash
   ls -la .agent/skills/gpus-theme/
   # Expected: SKILL.md, references/, assets/
   ```

2. **CSS validity:**
   - Copy `theme-tokens.css` to a test project
   - Run `bun run check` (no CSS errors)

3. **Content completeness:**
   - Verify all 26 light theme variables present
   - Verify all 27 dark theme variables present
   - Verify 8 shadcn registries documented
   - Verify 43 components listed

---

## Pre-Submission Checklist

### Research
- [x] Codebase patterns searched and documented
- [x] Theme variables extracted from `src/index.css`
- [x] shadcn config analyzed from `components.json`
- [x] UI components listed
- [x] Cross-validation: CSS matches components.json paths

### Context
- [x] Findings Table with confidence scores
- [x] Knowledge Gaps explicitly listed
- [x] Assumptions to Validate listed
- [x] Edge cases documented (5)

### Tasks
- [x] Truly atomic (single action each)
- [x] Validation command for each
- [x] Dependencies mapped (AT-001 first)
- [x] Rollback steps defined
- [x] Parallel-safe marked with ⚡

### Quality
- [x] Mode: CONSERVATIVE
- [x] Output format: Skill directory
- [x] Success criteria: Portable theme skill

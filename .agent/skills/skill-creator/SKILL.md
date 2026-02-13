---
name: skill-creator
description: Use when creating a new skill, editing or iterating on an existing skill, verifying skill quality before deployment, or when unsure how to structure skill content for maximum agent discoverability and compliance.
license: Complete terms in LICENSE.txt
---

# Skill Creator

Guide for creating effective, discoverable, and testable skills.

## About Skills

Skills are modular, self-contained packages that extend AI agent capabilities with specialized knowledge, workflows, and tools. They transform a general-purpose agent into a domain specialist equipped with procedural knowledge no model fully possesses.

### Skill Types

| Type | Purpose | Example |
|------|---------|---------|
| **Technique** | Concrete method with steps to follow | condition-based-waiting, root-cause-tracing |
| **Pattern** | Way of thinking about problems | flatten-with-flags, test-invariants |
| **Reference** | API docs, syntax guides, tool documentation | office-docs, pptx-api |
| **Discipline** | Rules/requirements that enforce compliance | TDD enforcement, verification-before-completion |

Classify the skill type early — it determines testing strategy (see `references/testing-skills.md`).

### What Skills Provide

1. **Specialized workflows** — multi-step procedures for specific domains
2. **Tool integrations** — instructions for working with specific file formats or APIs
3. **Domain expertise** — company-specific knowledge, schemas, business logic
4. **Bundled resources** — scripts, references, and assets for complex and repetitive tasks

### Anatomy of a Skill

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter metadata (required)
│   │   ├── name: (required)
│   │   └── description: (required)
│   └── Markdown instructions (required)
└── Bundled Resources (optional)
    ├── scripts/          - Executable code (Python/Bash/etc.)
    ├── references/       - Documentation loaded into context as needed
    └── assets/           - Files used in output (templates, icons, fonts, etc.)
```

#### SKILL.md (required)

**Metadata Quality:** The `name` and `description` in YAML frontmatter determine when the agent will use the skill. Optimize for discovery — see **Agent Search Optimization** below.

#### Bundled Resources (optional)

##### Scripts (`scripts/`)

Executable code for tasks needing deterministic reliability or that are repeatedly rewritten.

- **When to include**: Same code rewritten repeatedly, or deterministic reliability needed
- **Benefits**: Token-efficient, deterministic, may be executed without loading into context

##### References (`references/`)

Documentation loaded as needed into context to inform process and thinking.

- **When to include**: Detailed information the agent should reference while working
- **Best practice**: If files are large (>10k words), include grep search patterns in SKILL.md
- **Avoid duplication**: Information lives in EITHER SKILL.md OR references, not both. Prefer references for detailed content — keeps SKILL.md lean and context-efficient.

##### Assets (`assets/`)

Files not loaded into context, but used within the output the agent produces.

- **When to include**: Templates, images, boilerplate code that get copied or modified
- **Benefits**: Separates output resources from documentation

### File Organization Patterns

| Pattern | Structure | When to Use |
|---------|-----------|-------------|
| **Self-contained** | `skill/SKILL.md` only | All content fits inline, no heavy reference |
| **With reusable tool** | `skill/SKILL.md` + `example.ts` | Tool is reusable code, not just narrative |
| **With heavy reference** | `skill/SKILL.md` + `references/*.md` + `scripts/` | Reference material > 100 lines |

---

## Agent Search Optimization (ASO)

> **Critical for discovery:** Future agents need to FIND the skill. Optimize for this flow:
>
> 1. **Encounters problem** → 2. **Finds skill** (description matches) → 3. **Scans overview** → 4. **Reads patterns** → 5. **Loads examples** (only when implementing)

### Description Field

**Format:** Start with "Use when…" to focus on triggering conditions. Max 1024 characters. Third-person voice.

**CRITICAL: Description = When to Use, NOT What the Skill Does.**

Testing reveals that when a description summarizes workflow, agents may follow the description instead of reading the full skill body. This creates a shortcut that makes the skill body documentation the agent skips.

```yaml
# ❌ BAD: Summarizes workflow — agent shortcuts full reading
description: Skill for TDD — write test first, watch it fail, write minimal code, refactor

# ❌ BAD: Vague, no triggering conditions
description: Helps with testing

# ✅ GOOD: Just triggering conditions, no workflow summary
description: Use when implementing any feature or bugfix, before writing implementation code

# ✅ GOOD: Specific symptoms and contexts
description: Use when tests have race conditions, timing dependencies, or pass/fail inconsistently
```

### Keyword Coverage

Use words agents would search for:
- **Error messages**: "Hook timed out", "ENOTEMPTY", "race condition"
- **Symptoms**: "flaky", "hanging", "zombie", "pollution"
- **Synonyms**: "timeout/hang/freeze", "cleanup/teardown/afterEach"
- **Tools**: Actual commands, library names, file types

### Naming Conventions

**Use active voice, verb-first, gerund form (-ing):**
- ✅ `creating-skills` not `skill-creation`
- ✅ `condition-based-waiting` not `async-test-helpers`
- ✅ `root-cause-tracing` not `debugging-techniques`

---

## Token Efficiency

The context window is a shared resource. Every token in a loaded skill competes with conversation history and other context.

**Targets:**
- SKILL.md body: **< 500 lines** (split into references if exceeded)
- Frequently-loaded skills: **< 200 words** total
- Other skills: **< 500 words** (still be concise)

**Techniques:**

1. **Move details to references** — keep SKILL.md as an overview/table-of-contents
2. **Cross-reference, don't repeat** — reference other skills/docs instead of duplicating
3. **Compress examples** — one excellent example beats three mediocre ones
4. **Challenge each paragraph** — "Does the agent really need this explanation?" If it's common knowledge, omit it.

---

## Degrees of Freedom

Match instruction specificity to the task's fragility:

| Level | When to Use | Style |
|-------|-------------|-------|
| **High freedom** | Multiple valid approaches, context-dependent | Text-based guidance, heuristics |
| **Medium freedom** | Preferred pattern exists, some variation OK | Pseudocode, parameterized scripts |
| **Low freedom** | Fragile/error-prone operations, consistency critical | Exact scripts, "do not modify" |

---

## Progressive Disclosure

Skills use a three-level loading system to manage context efficiently:

1. **Metadata (name + description)** — Always in context (~100 words)
2. **SKILL.md body** — When skill triggers (< 500 lines)
3. **Bundled resources** — As needed by the agent (unlimited\*)

\*Unlimited because scripts can be executed without reading into context window.

---

## Skill Creation Process

Follow these steps in order, skipping only when clearly not applicable.

### Step 1: Understanding the Skill with Concrete Examples

Skip only when usage patterns are already clearly understood.

Clearly understand concrete examples of how the skill will be used. Ask the user:

- "What functionality should this skill support?"
- "Can you give examples of how it would be used?"
- "What would a user say that should trigger this skill?"

Avoid asking too many questions at once. Start with the most important and follow up.

**Conclude when:** Clear sense of the functionality the skill should support.

### Step 2: Planning Reusable Skill Contents

Analyze each concrete example by:

1. Considering how to execute the example from scratch
2. Identifying what scripts, references, and assets would help when executing repeatedly
3. Choosing the file organization pattern (self-contained / tool / heavy-reference)

**Output:** A list of reusable resources to include.

### Step 3: Initializing the Skill

Skip if iterating on an existing skill.

Run the `init_skill.py` script to generate a template:

```bash
scripts/init_skill.py <skill-name> --path <output-directory>
```

The script creates the skill directory with SKILL.md template, frontmatter, and example resource directories. Customize or remove generated files as needed.

### Step 4: Edit the Skill

The skill is being created for another AI agent instance to use. Focus on non-obvious procedural knowledge, domain-specific details, and reusable assets.

#### 4a. Start with Reusable Contents

Implement the resources identified in Step 2 (`scripts/`, `references/`, `assets/`). Delete example files not needed. This step may require user input (e.g., brand assets, documentation).

#### 4b. Write SKILL.md

**Writing style:** Use **imperative/infinitive form** (verb-first instructions). Objective, instructional language ("To accomplish X, do Y" not "You should do X").

Answer these questions:
1. What is the purpose of the skill?
2. When should the skill be used? (ASO-optimized description)
3. How should the agent use the skill? Reference all bundled resources.

**SKILL.md recommended structure:**

```markdown
---
name: Skill-Name-With-Hyphens
description: Use when [specific triggering conditions and symptoms]
---

# Skill Name

## Overview
Core principle in 1-2 sentences.

## When to Use
Bullet list with SYMPTOMS and use cases.
When NOT to use.

## Core Pattern (for techniques/patterns)
Before/after code comparison.

## Quick Reference
Table or bullets for scanning common operations.

## Implementation
Inline code for simple patterns.
Link to file for heavy reference or reusable tools.

## Common Mistakes
What goes wrong + fixes.
```

### Step 5: Verify the Skill

**Test before deploying. No exceptions.**

For discipline-enforcing skills, use the TDD-for-skills methodology:
> See `references/testing-skills.md` for the complete RED-GREEN-REFACTOR cycle adapted for skills.

For all skill types, run the quality checklist below.

### Step 6: Iterate

After using the skill on real tasks:

1. Notice struggles or inefficiencies
2. Identify how SKILL.md or bundled resources should be updated
3. Implement changes
4. **Re-verify** — edits to existing skills also require testing

---

## Anti-Patterns

| Anti-Pattern | Why Bad |
|--------------|---------|
| **Narrative storytelling** ("In session 2025-10-03, we found…") | Too specific, not reusable |
| **Multi-language dilution** (example-js, example-py, example-go) | Mediocre quality, maintenance burden. One excellent example is enough. |
| **Code in flowcharts** (`step1 [label="import fs"]`) | Can't copy-paste, hard to read |
| **Generic labels** (helper1, step3, pattern4) | Labels must have semantic meaning |
| **Workflow summaries in description** | Agent shortcuts full skill reading |
| **Repeating info across SKILL.md + references** | Wastes tokens, creates maintenance drift |
| **Over-explaining common knowledge** | Agent already knows what a PDF is |

---

## Quality Checklist

### Structure
- [ ] Name uses only letters, numbers, hyphens (no special chars)
- [ ] YAML frontmatter with `name` and `description` only (max 1024 chars)
- [ ] Description starts with "Use when…", includes specific triggers/symptoms
- [ ] Description in third person, **no workflow summary**
- [ ] SKILL.md body under 500 lines
- [ ] Additional details in reference files (if needed)

### Content
- [ ] Keywords throughout for search (errors, symptoms, tools)
- [ ] Clear overview with core principle
- [ ] One excellent example per pattern (not multi-language)
- [ ] No narrative storytelling
- [ ] Consistent terminology throughout
- [ ] Progressive disclosure used appropriately

### Code & Scripts
- [ ] Scripts solve problems deterministically (not punt to agent)
- [ ] Error handling is explicit and helpful
- [ ] Required packages listed and verified
- [ ] No Windows-style paths (all forward slashes)

### Testing (for discipline-enforcing skills)
- [ ] Pressure scenarios created (3+ combined pressures)
- [ ] Baseline behavior documented WITHOUT skill
- [ ] Skill addresses specific baseline failures
- [ ] Agent complies WITH skill present
- [ ] Rationalization table built from all test iterations
- [ ] Red flags list created

---

## Resources

- `references/testing-skills.md` — TDD-for-skills methodology with pressure scenarios
- `references/persuasion-principles.md` — Persuasion techniques for discipline-enforcing skills
- `references/anthropic-best-practices-summary.md` — Condensed official Anthropic skill authoring guidance
- `scripts/init_skill.py` — Initialize new skill directory
- `scripts/package_skill.py` — Package skill for distribution
- `scripts/quick_validate.py` — Validate skill structure

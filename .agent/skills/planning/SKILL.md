---
name: planning
description: Use when the /plan command is executed, when creating implementation plans or architectural designs, when tasks have high uncertainty requiring research before coding, or when brainstorming new features to clarify requirements before implementation.
---

# Planning Skill

Research-first planning that eliminates unknowns before implementation.

> **Core Principle:** Discover → Research → Plan → (Implement → Validate)

## Activation Triggers

**Mandatory when:**

1. User executes `/plan` command
2. Building plans, roadmaps, or architecture for new features/systems
3. High uncertainty or risk of hallucination without research
4. Multi-step execution requiring task decomposition
5. Third-party integrations (APIs, frameworks, infrastructure)

**Skip for:** Simple Q&A, pure copywriting, tasks solvable from provided context.

---

## D.R.P.I.V Workflow

### Phase 0: DISCOVER (New Features / Ambiguous Requests)

Clarify requirements through collaborative dialogue before any research. Skip only when the request is already crystal-clear and well-scoped.

**Rules:**

- **One question at a time** — never overwhelm with multiple questions
- **Multiple choice preferred** — easier to answer than open-ended
- **Explore 2-3 approaches** — always present alternatives with trade-offs, lead with your recommendation and reasoning
- **Incremental validation** — present design in small sections (200-300 words), check after each
- **YAGNI ruthlessly** — remove unnecessary features from all designs

**Process:**

1. Check current project state (files, docs, recent patterns)
2. Ask questions one at a time to refine the idea
3. Once understood, propose 2-3 approaches with trade-offs
4. Present chosen design incrementally, validate each section
5. Document validated design as input to the Plan phase

> See `references/brainstorming-protocol.md` for the full discovery protocol.

### Phase 1: RESEARCH (Always)

Eliminate unknowns and lock in best-practice approach.

**Research cascade (in order):**

1. Search codebase for patterns, conventions
2. Query Context7 for official docs
3. Tavily web search for best practices (only if 1-2 insufficient)
4. Sequential Thinking for complex decisions

**Required outputs:**

- Findings Table: `| # | Finding | Confidence (1-5) | Source | Impact |`
- Knowledge Gaps: What remains unknown
- Assumptions to Validate: Explicit assumptions needing confirmation
- Edge Cases: Minimum 5 for L4+ complexity

**Confidence scoring (tag every finding):**

| Score | Meaning | Action |
|-------|---------|--------|
| 5 | Verified in official docs / codebase | Use directly |
| 3-4 | Community consensus / multiple sources | Use with note |
| 1-2 | Single source / unverified | Flag as assumption, validate before relying |

> When any finding scores ≤ 2, run `sequentialthinking` to evaluate alternatives before proceeding.

> See `references/mcp-usage.md` for detailed MCP tool guidance.

### Phase 2: PLAN (Before Implementation)

Convert research into an execution runbook with bite-sized tasks.

**Task granularity — each step = one atomic action (2-5 minutes):**

```
Step 1: Write the failing test          ← one action
Step 2: Run test to verify it fails     ← one action
Step 3: Implement minimal code          ← one action
Step 4: Run test to verify it passes    ← one action
Step 5: Commit                          ← one action
```

**Each task must specify:**

- Exact file paths (with line ranges when modifying: `path/to/file.ts:123-145`)
- Complete code — never "add validation", provide the actual code
- Exact validation commands with expected output
- Rollback steps
- Dependencies mapped — mark `⚡ PARALLEL-SAFE` when independent

**Parallel execution (L5+):** Group tasks without mutual dependencies under `[PARALLEL]` tags. This reduces total execution time by identifying concurrent work.

**Risk assessment (L6+):** Run a pre-mortem analysis — see `references/pre-mortem-analysis.md`.

**Architecture decisions (L6+):** Document non-obvious choices with lightweight ADRs — see `references/architecture-decisions.md`.

**Output:** `docs/PLAN-{task-slug}.md`

> See `references/plan-template.md` for complete template.

### Phase 2.5: PLAN SELF-REVIEW (Before Presenting)

Before presenting the plan to the user, self-evaluate against these 5 criteria:

| # | Criterion | Check |
|---|-----------|-------|
| 1 | **Completeness** | Does every requirement map to at least one task? |
| 2 | **Atomicity** | Is every step a single action (2-5 min)? |
| 3 | **Risk coverage** | Are top risks identified with mitigations? (L6+) |
| 4 | **Dependency order** | Can tasks execute in the listed order without blockers? |
| 5 | **Rollback feasibility** | Can each task be undone without cascading failures? |

**If any criterion fails:** Iterate on the plan before presenting. Do not present a plan that fails self-review.

> This implements the evaluator-optimizer pattern — the agent reviews its own output before human review.

### Phase 3: IMPLEMENT (Only If Requested)

Execute per atomic steps with validation gates.

**Pattern:** Implement → Validate → Commit (or Rollback)

**Quality gates after each task:**

- `bun run check` (TypeScript)
- `bun run lint:check` (Biome)
- `bun test` (Unit tests)

### Phase 4: VALIDATE (Always)

- Build: zero errors
- Lint: zero warnings
- Tests: all passing
- Consult specialists if security or schema changes involved

---

## Execution Handoff

After saving the plan, present options:

```
✅ Plan created: docs/PLAN-{slug}.md

Execution options:
1. **Implement now** — Start executing tasks sequentially with validation gates
2. **Review first** — Open the plan for review before any implementation
3. **Modify plan** — Adjust scope, ordering, or approach
```

---

## Operating Modes

| Mode                               | Behavior                          | Output                |
| ---------------------------------- | --------------------------------- | --------------------- |
| CONSERVATIVE (default for `/plan`) | Discover + research + plan only   | `docs/PLAN-{slug}.md` |
| PROACTIVE (for implementation)     | Discover → research → plan → impl | Code + plan file      |

---

## Complexity Levels

| Level  | Indicators                | Research Depth | Discovery? |
| ------ | ------------------------- | -------------- | ---------- |
| L1-L2  | Bug fix, single function  | Repo-only      | Skip       |
| L3-L5  | Feature, multi-file       | Docs + repo    | If ambiguous |
| L6-L8  | Architecture, integration | Deep research  | Always     |
| L9-L10 | Migrations, multi-service | Comprehensive  | Always     |

> See `references/complexity-guide.md` for detailed classification.

---

## Anti-Patterns

| Bad                               | Good                                                     |
| --------------------------------- | -------------------------------------------------------- |
| "Implement auth"                  | Discover → Research → Search codebase → Query docs → Plan |
| Skip research                     | ALWAYS research first, even for "simple" tasks           |
| Guess file paths                  | Search and verify paths before referencing               |
| Speculate about code              | Read files before making claims                          |
| "Add validation logic" in plan    | Provide exact code in plan steps                         |
| Multi-step blobs as single task   | One action per step (2-5 min each)                       |
| Dump 5 questions at once          | One question at a time during discovery                  |
| Present plan without self-review  | Run 5-criterion self-review before presenting            |
| Skip risk assessment for L6+      | Always run pre-mortem for complex tasks                  |
| Use low-confidence findings as-is | Flag, validate, or seek alternatives for scores ≤ 2      |

---

## Quick Reference

```
D.R.P.I.V: DISCOVER → RESEARCH → PLAN → IMPLEMENT → VALIDATE

GOLDEN RULES:
✓ DISCOVER FIRST — clarify before researching
✓ RESEARCH ALWAYS — never implement blind
✓ BITE-SIZED STEPS — each step = one action (2-5 min)
✓ EXACT CODE — complete code in plan, never vague instructions
✓ EXACT PATHS — file paths with line ranges
✓ ONE QUESTION — never overwhelm during discovery
✓ 2-3 APPROACHES — always explore alternatives
✓ YAGNI — remove unnecessary features ruthlessly
✓ SELF-REVIEW — evaluate plan against 5 criteria before presenting
✓ PRE-MORTEM (L6+) — imagine failure, identify and mitigate risks
✓ CONFIDENCE TAG — score every research finding 1-5
```

---

## Resources

- `references/brainstorming-protocol.md` — Full discovery/brainstorming protocol
- `references/plan-template.md` — Complete plan template structure
- `references/complexity-guide.md` — Task complexity classification
- `references/mcp-usage.md` — When and how to use MCP tools
- `references/pre-mortem-analysis.md` — Risk assessment protocol (L6+)
- `references/architecture-decisions.md` — Lightweight ADR template (L6+)

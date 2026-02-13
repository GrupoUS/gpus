# Brainstorming & Discovery Protocol

> Reference for Phase 0 (DISCOVER) of the planning skill. Use when requirements are ambiguous, when building new features, or when the scope needs refinement before research.

## When to Use

- New feature requests without clear specifications
- Ambiguous or broad user requests
- Architectural decisions with multiple valid approaches
- Any L6+ complexity task
- User explicitly asks to brainstorm or discuss options

## When to Skip

- Bug fixes with clear reproduction steps
- Well-scoped tasks with explicit requirements
- Tasks following established patterns already in the codebase

---

## Process

### Step 1: Understand the Current State

Before asking any questions:

1. Check relevant files, docs, and recent changes in the project
2. Identify existing patterns that relate to the request
3. Note constraints from the tech stack and architecture

### Step 2: Clarify the Idea (One Question at a Time)

**Rules:**

- Ask **one question per message** — if a topic needs more exploration, break it into follow-ups
- **Prefer multiple choice** when possible — easier to answer than open-ended
- Focus on understanding: **purpose, constraints, success criteria**
- Never ask "What do you want?" — propose something specific and ask for refinement

**Question sequence (adapt as needed):**

1. **Purpose**: "What problem does this solve?" or "Who benefits from this?"
2. **Scope**: Present 2-3 scope options (MVP, standard, comprehensive)
3. **Constraints**: "Any hard requirements? (deadline, compatibility, performance)"
4. **Success criteria**: "How do we know this is done?"

**Example — good vs bad:**

```
❌ BAD (multiple questions dumped):
"What should the dashboard show? How should it look?
What data sources? Who are the users? What's the timeline?"

✅ GOOD (one at a time, multiple choice):
"For the dashboard, which data is most critical to show first?
A) Revenue metrics (faturamento, MRR)
B) Patient flow (new, returning, churn)
C) Operational health (appointments, no-shows)
D) Something else?"
```

### Step 3: Explore Approaches (2-3 Options)

Once the idea is understood, propose 2-3 approaches:

- **Lead with your recommendation** and explain why
- Include trade-offs for each (complexity, time, maintainability)
- Be opinionated — the user wants guidance, not a menu

**Format:**

```markdown
## Approaches

### A) [Recommended] — Description
- Pros: ...
- Cons: ...
- Effort: ~X hours

### B) Alternative — Description
- Pros: ...
- Cons: ...
- Effort: ~X hours

**Recommendation:** A, because [specific reasoning].
```

### Step 4: Present Design Incrementally

Once an approach is selected:

1. Break the design into sections (200-300 words each)
2. Present one section at a time
3. Ask "Does this look right?" after each section
4. Cover: architecture, components, data flow, error handling
5. Be ready to go back and revise if something doesn't fit

### Step 5: Document & Hand Off

Write the validated design as input to the Plan phase:

- Summarize decided scope, approach, and constraints
- List any open questions that Research phase should resolve
- Transition: "Ready to research and create the implementation plan?"

---

## YAGNI Enforcement

Apply at every step of brainstorming:

- **Before adding any feature:** "Is this needed for the first working version?"
- **The YAGNI test:** If removing the feature doesn't break the core value prop, remove it
- **Defer, don't delete:** Move nice-to-haves to a "Future" section, don't fight about them

---

## Key Principles

| Principle | Why |
|-----------|-----|
| One question at a time | Prevents overwhelm, gets better answers |
| Multiple choice preferred | Reduces cognitive load on user |
| Lead with recommendation | Users want expert guidance |
| Incremental validation | Catches misunderstandings early |
| YAGNI ruthlessly | Prevents scope creep before planning even starts |
| Be flexible | Go back and clarify when something doesn't fit |

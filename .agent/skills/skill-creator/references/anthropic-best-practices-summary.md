# Anthropic Skill Authoring Best Practices — Summary

Condensed from [Anthropic's official skill authoring best practices](https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills/skill-authoring-best-practices).

---

## Core Principles

### 1. Concise is Key

The context window is a shared resource. Only add what the agent doesn't already know.

Challenge each piece of information:
- "Does the agent really need this explanation?"
- "Can I assume the agent knows this?"
- "Does this paragraph justify its token cost?"

### 2. Degrees of Freedom

| Level | When | Style |
|-------|------|-------|
| **High** | Multiple valid approaches | Text guidance, heuristics |
| **Medium** | Preferred pattern, some variation OK | Pseudocode, parameterized scripts |
| **Low** | Fragile/error-prone, consistency critical | Exact scripts, "do not modify" |

### 3. Test with Multiple Models

What works for powerful models may need more detail for lighter ones. Test with all models you plan to use.

---

## Skill Structure

### YAML Frontmatter
- `name`: 64 characters max, letters/numbers/hyphens only
- `description`: 1024 characters max, third-person voice
- Both fields are the ONLY supported frontmatter fields

### Progressive Disclosure
- Keep SKILL.md body **under 500 lines**
- Split into reference files when approaching limit
- Reference files loaded only when agent determines they're needed

### Naming Conventions
**Gerund form (verb + -ing)** recommended:
- ✅ "Processing PDFs", "Analyzing spreadsheets"
- ❌ "Helper", "Utils", "Tools"

### Description Writing
- Include both what the skill does AND when to use it
- Be specific with key terms
- Third person always ("Processes Excel files" not "I can help")

---

## Workflows & Feedback Loops

### Workflows for Complex Tasks
Break into clear sequential steps. For complex workflows, provide a checklist the agent copies and tracks:

```markdown
Task Progress:
- [ ] Step 1: Analyze input
- [ ] Step 2: Process data
- [ ] Step 3: Validate output
- [ ] Step 4: Generate report
```

### Feedback Loops
Common pattern: Run validator → fix errors → repeat.

```markdown
1. Make edits
2. Validate immediately
3. If validation fails: fix → validate again
4. Only proceed when validation passes
```

---

## Anti-Patterns

- **Windows-style paths** — always use forward slashes
- **Too many options** — provide a default, mention alternative only for specific case
- **Over-explaining** — agent knows what a PDF or API is
- **Time-sensitive info** — put in "old patterns" section or avoid

---

## Quality Checklist

### Core Quality
- [ ] Description is specific with key terms
- [ ] Includes both what it does AND when to use
- [ ] SKILL.md body under 500 lines
- [ ] No time-sensitive information
- [ ] Consistent terminology
- [ ] Concrete examples (not abstract)
- [ ] Progressive disclosure used appropriately
- [ ] Workflows have clear steps

### Code & Scripts
- [ ] Scripts solve problems (not punt to agent)
- [ ] Error handling explicit and helpful
- [ ] Required packages listed and verified
- [ ] No Windows-style paths
- [ ] Validation/verification steps for critical ops
- [ ] Feedback loops for quality-critical tasks

### Testing
- [ ] At least three evaluations created
- [ ] Tested with real usage scenarios
- [ ] Team feedback incorporated (if applicable)

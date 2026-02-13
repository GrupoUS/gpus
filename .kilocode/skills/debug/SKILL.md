---
name: debug
description: Use when investigating bugs, test failures, unexpected behavior, performance problems, build failures, or flaky tests. Use ESPECIALLY when under time pressure, when a "quick fix" seems obvious, or after multiple failed fix attempts.
allowed-tools:
  - run_command
  - browser_subagent
  - mcp_mcp-server-neon_run_sql
  - mcp_mcp-server-neon_list_slow_queries
  - mcp_sequential-thinking_sequentialthinking
---

# Debug Skill

> Systematic debugging for full-stack applications. Root cause first, always.

## The Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If you haven't completed Phase 1, you **cannot** propose fixes. Violating this process is violating the spirit of debugging.

---

## When to Use

| Trigger                  | Action                  |
| ------------------------ | ----------------------- |
| Bug report, error, crash | Start 4-phase debugging |
| Flaky / failing tests    | Investigate root cause  |
| Performance problems     | Neon MCP + profiling    |
| Frontend broken          | agent-browser CLI       |
| Build / deploy failure   | Check logs + traces     |

**Use ESPECIALLY when:**

- Under time pressure (emergencies make guessing tempting)
- "Just one quick fix" seems obvious
- You've already tried multiple fixes
- Previous fix didn't work
- You don't fully understand the issue

**Don't skip when:**

- Issue seems simple (simple bugs have root causes too)
- You're in a hurry (systematic is faster than thrashing)

---

## Content Map

| Reference                                                        | Purpose                               |
| ---------------------------------------------------------------- | ------------------------------------- |
| [Debug Methodology](references/debug-methodology.md)             | 4-phase process, 5 Whys, templates    |
| [Root Cause Tracing](references/root-cause-tracing.md)           | Backward trace through call chain     |
| [Defense-in-Depth](references/defense-in-depth.md)               | 4-layer validation after fixing       |
| [Condition-Based Waiting](references/condition-based-waiting.md) | Replace timeouts with condition polls |
| [Testing Pyramid](references/testing-pyramid.md)                 | Unit/Integration/E2E selection        |
| [Security Checklist](references/security-checklist.md)           | OWASP Top 10 2025                     |

---

## The Four Phases

Complete each phase before proceeding. See `debug-methodology.md` for detailed steps.

| Phase                    | Key Activities                               | Success Criteria                 |
| ------------------------ | -------------------------------------------- | -------------------------------- |
| **1. Root Cause Invest.**| Read errors, reproduce, check changes, trace | Understand WHAT and WHY          |
| **2. Pattern Analysis**  | Find working examples, compare differences   | Identify what's different        |
| **3. Hypothesis Test**   | Form single theory, test minimally           | Confirmed or new hypothesis      |
| **4. Implementation**    | Create failing test, fix, verify             | Bug resolved, all tests pass     |

### 3-Fix Escalation Rule

- **< 3 fixes failed** → Return to Phase 1, re-analyze
- **≥ 3 fixes failed** → **STOP.** Question the architecture. Discuss with user.

---

## Red Flags — STOP and Return to Phase 1

If you catch yourself thinking:

- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "Add multiple changes, run tests"
- "Skip the test, I'll manually verify"
- "It's probably X, let me fix that"
- "I don't fully understand but this might work"
- "Here are the main problems: [lists fixes without investigation]"
- "One more fix attempt" (when already tried 2+)

**ALL of these mean: STOP. Return to Phase 1.**

---

## Common Rationalizations

| Excuse                                      | Reality                                                  |
| ------------------------------------------- | -------------------------------------------------------- |
| "Issue is simple, don't need process"       | Simple issues have root causes too. Process is fast.     |
| "Emergency, no time for process"            | Systematic debugging is FASTER than guess-and-check.     |
| "Just try this first, then investigate"     | First fix sets the pattern. Do it right from the start.  |
| "I'll write test after confirming fix works"| Untested fixes don't stick. Test first proves it.        |
| "Multiple fixes at once saves time"         | Can't isolate what worked. Causes new bugs.              |
| "I see the problem, let me fix it"          | Seeing symptoms ≠ understanding root cause.              |
| "One more fix attempt" (after 2+ failures)  | 3+ failures = architectural problem. Question pattern.   |

---

## Decision Tree: Which Tool?

```
Problem Type?
├── Backend Error
│   ├── Type error → bun run check
│   ├── Logic error → bun test
│   └── API error → Check tRPC logs
├── Database Error
│   ├── Slow query → neon MCP (`list_slow_queries`)
│   ├── Schema issue → drizzle-kit push
│   └── Connection → Check DATABASE_URL
├── Frontend Error
│   ├── Visual bug → agent-browser snapshot/screenshot
│   ├── Interaction → agent-browser click/fill
│   └── Console error → browser_subagent
└── Deployment Error
    └── Railway → railway logs --filter="level:error"
```

---

## CLI Quick Reference

### Backend: Biome + Vitest

```bash
bun run check              # Lint & type check
bun test                   # Run tests
bun test --coverage        # With coverage
bun test path/to/file.test.ts  # Specific file
```

### Frontend: agent-browser CLI

```bash
agent-browser open http://localhost:3000   # Navigate
agent-browser snapshot                     # Get refs (a11y tree)
agent-browser click @e2                    # Click element by ref
agent-browser fill @e3 "test@example.com"  # Fill input
agent-browser get text @e1                 # Get text content
agent-browser screenshot page.png          # Capture state
agent-browser close                        # Cleanup
```

### Database: Neon MCP

```bash
neon.list_slow_queries       # Find slow queries
neon.run_sql                 # Execute debug SQL
neon.explain_sql_statement   # Analyze query plan
```

### Git Forensics

```bash
git diff HEAD~5              # Recent changes
git log --oneline -10        # Recent commits
git bisect start             # Binary search for breaking commit
```

---

## Scripts

| Script                                         | Purpose               |
| ---------------------------------------------- | --------------------- |
| [`run_tests.sh`](scripts/run_tests.sh)         | Run biome + vitest    |
| [`fetch_logs.sh`](scripts/fetch_logs.sh)       | Aggregate error logs  |
| [`frontend_test.sh`](scripts/frontend_test.sh) | agent-browser testing |

---

## Anti-Patterns

❌ **Shotgun debugging** — Random changes hoping to fix
❌ **Symptom fixing** — Hiding the error without understanding root cause
❌ **Skip reproduction** — Assuming you know the problem
❌ **No verification** — Not confirming fix actually works
❌ **Multiple fixes at once** — Can't isolate what worked
❌ **Skip error messages** — Not reading stack traces completely
❌ **Fix at symptom** — Not tracing back to original trigger
❌ **Ignore type errors** — Treating them as noise
❌ **Deploy without tests** — Shipping unverified changes

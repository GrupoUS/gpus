---
name: debug
description: Use when investigating bugs, test failures, unexpected behavior, performance problems, build failures, deploy failures, CI/CD pipeline errors, or flaky tests. Use ESPECIALLY when under time pressure, when a "quick fix" seems obvious, after multiple failed fix attempts, or when GitHub Actions deploys fail.
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

| Trigger                      | Action                                    |
| ---------------------------- | ----------------------------------------- |
| Bug report, error, crash     | Start 4-phase debugging                   |
| Flaky / failing tests        | Investigate root cause                    |
| Performance problems         | Neon MCP + profiling                      |
| Frontend broken              | agent-browser CLI                         |
| Build / deploy failure       | GitHub Actions logs + VPS container logs  |
| CI/CD pipeline error         | `gh run view` + docker-deploy skill       |
| Container crash / unhealthy  | VPS SSH + `docker logs` + health probes   |

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
| [Root Cause Tracing](references/root-cause-tracing.md)           | Backward trace, fault isolation       |
| [Defense-in-Depth](references/defense-in-depth.md)               | 4-layer validation after fixing       |
| [Cognitive Debiasing](references/cognitive-debiasing.md)         | 5 biases, self-interrogation protocol |
| [Regression Prevention](references/regression-prevention.md)     | Postmortem, prevention checklist      |
| [Condition-Based Waiting](references/condition-based-waiting.md) | Replace timeouts with condition polls |
| [Testing Pyramid](references/testing-pyramid.md)                 | Unit/Integration/E2E selection        |
| [Security Checklist](references/security-checklist.md)           | OWASP Top 10 2025                     |

---

## The Four Phases

Complete each phase before proceeding. See `debug-methodology.md` for detailed steps.

| Phase                      | Key Activities                                   | Success Criteria                 |
| -------------------------- | ------------------------------------------------ | -------------------------------- |
| **1. Root Cause Invest.**  | Read errors, reproduce, self-interrogate, trace  | Understand WHAT and WHY          |
| **2. Pattern Analysis**    | Find working examples, compare differences       | Identify what's different        |
| **3. Hypothesis Test**     | Form single theory, test minimally               | Confirmed or new hypothesis      |
| **3.5 Fix Self-Review**    | Challenge: is this truly the root cause?         | Debiasing checklist passed       |
| **4. Implementation**      | Create failing test, fix, verify                 | Bug resolved, all tests pass     |

### 3-Fix Escalation Rule

- **< 3 fixes failed** → Return to Phase 1, re-analyze
- **≥ 3 fixes failed** → **STOP.** Question the architecture. Discuss with user.

### Phase 1: Self-Interrogation (Rubber Duck)

When stuck or before forming any hypothesis, answer in writing:

1. **What SHOULD happen?** (expected behavior, exact values)
2. **What ACTUALLY happens?** (observed behavior, exact values)
3. **WHERE do they diverge?** (specific point of divergence)

### Phase 3.5: Fix Self-Review

Before implementing, challenge your hypothesis:

- Does this explain ALL symptoms, not just some?
- Have I considered ≥ 2 alternative hypotheses?
- Am I fixing the root cause or a symptom?
- Would this fix survive the [Debiasing Checklist](references/cognitive-debiasing.md)?

### Bug Triage (L5+ only)

For complex bugs, classify before investigating:

| Field | Options |
|-------|--------|
| **Type** | Cosmetic · Performance · Security · Functionality · Flaky Test |
| **Severity** | P1 (crash/data loss) · P2 (major broken) · P3 (degraded) · P4 (minor) |
| **Regression Risk** | High · Medium · Low |

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

## Cognitive Debiasing — The 3 Killers

See [full protocol](references/cognitive-debiasing.md). Quick summary:

| Bias | Symptom | Counter |
|------|---------|--------|
| **Confirmation** | Only looking for evidence that proves your theory | Write the DISPROVING test first |
| **Anchoring** | Fixating on first error line | Generate 3 hypotheses before committing |
| **Fixation** | Trying same approach after 2 failures | Change approach entirely after 2 strikes |

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
└── Deploy / CI/CD Error
    ├── GitHub Actions failed → gh run view --log-failed
    ├── Docker build failed → Check Dockerfile + build args
    ├── SSH deploy failed → VPS SSH + docker compose logs
    ├── Container unhealthy → docker inspect + health probes
    ├── Traefik routing → docker network + labels
    └── Full deploy guide → .agent/skills/docker-deploy/SKILL.md
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

### CI/CD: GitHub Actions + VPS Deploy

```bash
# --- GitHub Actions (run locally) ---
gh run list --repo GrupoUS/neondash -L 5          # List recent runs
gh run view <RUN_ID> --repo GrupoUS/neondash      # View run summary
gh run view <RUN_ID> --log-failed                  # Show ONLY failed step logs
gh run view <RUN_ID> --log                         # Full logs (verbose)
gh run rerun <RUN_ID> --failed                     # Re-run only failed jobs

# --- VPS Container Diagnostics (via SSH) ---
ssh root@31.97.170.4 "docker ps"                                    # Container status
ssh root@31.97.170.4 "docker compose -f /opt/neondash/docker-compose.deploy.yml logs app --tail 50"        # Production logs
ssh root@31.97.170.4 "docker compose -f /opt/neondash-staging/docker-compose.deploy.yml logs app --tail 50" # Staging logs
ssh root@31.97.170.4 "docker inspect <CID> --format '{{.State.Health}}'"  # Health status
ssh root@31.97.170.4 "docker exec <CID> wget -qO- http://127.0.0.1:3000/health/live"   # Liveness probe
ssh root@31.97.170.4 "docker exec <CID> wget -qO- http://127.0.0.1:3000/health/ready"  # Readiness probe
```

### Git Forensics

```bash
git diff HEAD~5              # Recent changes
git log --oneline -10        # Recent commits
git bisect start             # Binary search for breaking commit
```

---

## Scripts

| Script                                         | Purpose                              |
| ---------------------------------------------- | ------------------------------------ |
| [`run_tests.sh`](scripts/run_tests.sh)         | Run biome + vitest                   |
| [`fetch_logs.sh`](scripts/fetch_logs.sh)       | Aggregate error logs (GH Actions + VPS) |
| [`frontend_test.sh`](scripts/frontend_test.sh) | agent-browser testing                |

---

## Cross-References

| Domain | Skill | When |
|--------|-------|------|
| Docker / Deploy / CI/CD | `.agent/skills/docker-deploy/SKILL.md` | Container crashes, deploy failures, Traefik, VPS, GitHub Actions pipeline |
| Auth / Database | `.agent/skills/clerk-neon-auth/SKILL.md` | Clerk sync, Drizzle schema, Neon connection issues |
| Backend | `.agent/skills/backend-design/SKILL.md` | tRPC errors, service layer, middleware issues |

> **Deploy debugging flow**: Always check GitHub Actions logs first (`gh run view --log-failed`), then VPS container logs (`docker compose logs`), then consult `docker-deploy` skill for infrastructure-specific guidance.

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
❌ **Confirmation-seeking** — Only writing tests that prove your fix works
❌ **Anchored investigation** — Fixating on the first suspicious line
❌ **Same-approach retry** — Trying variations of a failed approach instead of new angle
❌ **Ignore CI/CD logs** — Guessing deploy failure cause without reading GitHub Actions output
❌ **Fix locally, skip pipeline** — Fixing code but not verifying CI/CD passes
❌ **Blame infrastructure** — Assuming VPS/Docker issue without checking app logs first

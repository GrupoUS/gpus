---
description: Canonical debugging workflow. Orchestration-only with reproducible root-cause loop.
---

# /debug - Debug Orchestration

$ARGUMENTS

## Required Inputs

- Error message, stack trace, symptom description, or **deploy failure**
- Affected layer: frontend · backend · database · CI/CD · VPS · unknown

## Orchestration Rules

1. Load `.agent/skills/debug/SKILL.md` — **read the Iron Law first**
2. Load domain-specific skills as needed:
   - Backend/domain logic → `.agent/skills/backend-design/SKILL.md`
   - Deploy/Docker/CI/CD → `.agent/skills/docker-deploy/SKILL.md`
3. **NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST**
4. Complete each phase before proceeding to the next
5. If ≥ 3 fixes fail → STOP, question architecture, discuss with user

## Phase 0: Collect All Errors

Before investigating, **gather all error sources** — local AND remote:

### 0a. Local Errors

// turbo-all

```bash
bun run check 2>&1 | tail -30
```

```bash
bun run lint:check 2>&1 | tail -30
```

```bash
bun run test 2>&1 | tail -30
```

### 0b. GitHub Actions — CI/CD Errors

// turbo-all

```bash
gh run list --repo GrupoUS/neondash -L 5 --json status,conclusion,name,headBranch,createdAt --template '{{range .}}{{.name}} | {{.headBranch}} | {{.conclusion}} | {{.createdAt}}{{"\n"}}{{end}}'
```

If any run failed, fetch the failure logs:

```bash
FAILED_RUN=$(gh run list --repo GrupoUS/neondash -L 1 --status failure --json databaseId --template '{{range .}}{{.databaseId}}{{end}}') && [ -n "$FAILED_RUN" ] && gh run view "$FAILED_RUN" --repo GrupoUS/neondash --log-failed 2>&1 | tail -80
```

### 0c. VPS Container Health (if deploy-related)

Check both production and staging containers:

```bash
ssh -o ConnectTimeout=5 -o BatchMode=yes root@31.97.170.4 "echo '--- Production ---' && docker compose -f /opt/neondash/docker-compose.deploy.yml ps 2>/dev/null && echo '' && echo '--- Staging ---' && docker compose -f /opt/neondash-staging/docker-compose.deploy.yml ps 2>/dev/null" 2>&1 | head -30
```

If containers are unhealthy, fetch app logs:

```bash
ssh -o BatchMode=yes root@31.97.170.4 "docker compose -f /opt/neondash/docker-compose.deploy.yml logs app --tail 50" 2>&1 | tail -50
```

```bash
ssh -o BatchMode=yes root@31.97.170.4 "docker compose -f /opt/neondash-staging/docker-compose.deploy.yml logs app --tail 50" 2>&1 | tail -50
```

### 0d. Error Inventory

After collecting, create a single inventory:

```
| # | Error                     | Source          | Layer          | Severity |
|---|---------------------------|-----------------|----------------|----------|
| 1 | [first error description] | [where found]   | [which layer]  | P1-P4    |
| 2 | ...                       | ...             | ...            | ...      |
```

Sort by severity (P1 first) and fix in order.

---

## Phase 0.5: Bug Triage (L5+)

1. Classify bug type: Cosmetic · Performance · Security · Functionality · Flaky Test · **Deploy Failure**
2. Assign severity: P1 (crash/data loss) · P2 (major broken) · P3 (degraded) · P4 (minor)
3. Assess regression risk: High · Medium · Low
4. P1/P2 → immediate investigation. P3/P4 → queue or schedule.

---

## Phase 1: Root Cause Investigation

1. Read error messages and stack traces **completely** — don't skip
2. Reproduce issue and document expected vs actual behavior
3. **Self-Interrogate**: What SHOULD happen? What ACTUALLY happens? Where do they diverge?
4. Identify affected layer (frontend / backend / database / CI/CD / Docker / VPS)
5. For multi-component issues: add boundary logging at each layer
6. Use `sequential-thinking` for complex multi-step diagnosis
7. Trace data flow backward to find original trigger (see `references/root-cause-tracing.md`)

### CI/CD-Specific Investigation

For GitHub Actions or VPS deploy failures:

- **Build step failed** → Check TypeScript errors (`bun run check`), missing env vars, Dockerfile issues
- **Test step failed** → Run tests locally, compare output
- **Docker build failed** → Check Dockerfile, `.dockerignore`, build args
- **SSH deploy step failed** → Check VPS SSH connectivity, disk space, Docker daemon status
- **Container unhealthy** → Check health probes (`/health/live`, `/health/ready`), app startup logs
- **Traefik routing broken** → Check Traefik labels, `easypanel` network attachment, `APP_HOST` value

> When in doubt, consult `.agent/skills/docker-deploy/SKILL.md` for infrastructure-specific guidance.

---

## Phase 2: Pattern Analysis

8. Find working examples of similar code in the codebase
9. Compare working vs broken — list every difference
10. Pull official docs (`context7`) when library behavior is uncertain

---

## Phase 3: Hypothesis & Testing

11. Form a **single hypothesis**: "X is the root cause because Y"
12. Make the **smallest possible change** to test it
13. If hypothesis fails → form NEW hypothesis, don't stack fixes

---

## Phase 4: Implementation & Verification

14. Create failing test case (when applicable)
15. Implement single focused fix addressing root cause
16. Run validation gates (see below)
17. Add defense-in-depth validation at each layer the data passes through (see `references/defense-in-depth.md`)
18. For L6+ bugs: apply regression prevention protocol (see `references/regression-prevention.md`)
19. Document fix in commit message with root cause

Capture fix for evolution-core learning:
// turbo
```bash
python3 .agent/skills/evolution-core/scripts/memory_manager.py capture "Fixed: [root cause description]" -t bug_fix
```

### Phase 4.5: Fix Self-Review

Before declaring done, answer:
- Does the fix explain ALL symptoms, not just some?
- Did I consider ≥ 2 alternative hypotheses?
- Am I fixing the root cause or a symptom?
- Would this fix survive the [Debiasing Checklist](references/cognitive-debiasing.md)?

---

## Phase 5: Deploy Verification

After local fixes pass, verify the full pipeline:

### 5a. Local gates pass

// turbo-all

```bash
bun run check
```

```bash
bun run lint:check
```

```bash
bun run test
```

### 5b. Commit and push

After local gates pass, commit and push to trigger CI/CD:

```bash
git add -A && git status
```

### 5c. Monitor GitHub Actions

// turbo

```bash
sleep 5 && gh run list --repo GrupoUS/neondash -L 1 --json status,conclusion,name,headBranch --template '{{range .}}{{.name}} | {{.headBranch}} | {{.status}} | {{.conclusion}}{{"\n"}}{{end}}'
```

If pipeline fails again → return to Phase 0b, collect new CI/CD errors, iterate.

### 5d. VPS Health Check (after deploy completes)

```bash
ssh -o BatchMode=yes root@31.97.170.4 "docker ps --format 'table {{.Names}}\t{{.Status}}' | grep neondash"
```

---

## Red Flag Check

**STOP and return to Phase 1 if you catch yourself:**

- Proposing fixes before completing investigation
- Adding multiple changes at once
- Thinking "just try this and see"
- Skipping reproduction steps
- Not reading error messages completely
- **Guessing deploy failure cause without reading GitHub Actions logs**
- **Fixing code locally without checking if CI/CD also fails**

---

## MCP Routing

| Tool                  | When to Use                              |
| --------------------- | ---------------------------------------- |
| `sequential-thinking` | Multi-step diagnosis, complex logic      |
| `mcp-server-neon`     | SQL diagnostics, query plans             |
| `context7`            | Official library behavior reference      |
| `tavily`              | External fallback research               |

---

## Skill Cross-References

| Domain             | Skill                                    | When                              |
|--------------------|------------------------------------------|-----------------------------------|
| Docker / Deploy    | `.agent/skills/docker-deploy/SKILL.md`   | Container, Traefik, CI/CD, VPS    |
| Auth / Database    | `.agent/skills/clerk-neon-auth/SKILL.md` | Clerk sync, Drizzle, Neon         |
| Backend            | `.agent/skills/backend-design/SKILL.md`  | tRPC, services, middleware        |

---

## References

- `.agent/skills/debug/SKILL.md` (Iron Law, Red Flags, Rationalizations, Debiasing)
- `.agent/skills/debug/references/debug-methodology.md` (4-phase detailed process)
- `.agent/skills/debug/references/root-cause-tracing.md` (backward trace, fault isolation)
- `.agent/skills/debug/references/cognitive-debiasing.md` (5 biases, self-interrogation)
- `.agent/skills/debug/references/regression-prevention.md` (postmortem, prevention checklist)
- `.agent/skills/debug/references/defense-in-depth.md` (4-layer validation)
- `.agent/skills/debug/references/condition-based-waiting.md` (flaky test fixes)
- `.agent/skills/docker-deploy/SKILL.md` (Docker, Traefik, CI/CD pipeline, VPS operations)
- `.agent/skills/backend-design/SKILL.md` (backend domain authority)

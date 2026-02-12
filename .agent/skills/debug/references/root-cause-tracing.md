# Root Cause Tracing

> Trace bugs backward through the call chain to find the original trigger. Fix at source, not at symptom.

## When to Use

- Error appears deep in execution (not at entry point)
- Stack trace shows a long call chain
- Unclear where invalid data originated
- Need to find which test/code triggers shared state pollution

## The 5-Step Backward Trace

### 1. Observe the Symptom

```
Error: Query failed — column "mentorado_id" does not exist
```

### 2. Find Immediate Cause

**What code directly causes this?**

```typescript
db.select().from(metricas).where(eq(metricas.mentorado_id, id));
```

### 3. Ask: What Called This?

```
metricasRouter.getByMentorado(id)
  → called by Dashboard.useMetricas()
  → called by route loader at /dashboard
  → id comes from useMentoradoContext()
```

### 4. Keep Tracing Up

**What value was passed?**

- `id = undefined` — context not yet loaded
- Query fires before auth resolves
- Root: missing `enabled` guard on tRPC query

### 5. Find Original Trigger

Trace until you reach the **source**, not just the **symptom**.

```typescript
// Root cause: query fires without mentoradoId
const { data } = trpc.metricas.getByMentorado.useQuery(
  { mentoradoId },
  { enabled: !!mentoradoId } // ← Fix at source
);
```

---

## Adding Stack Traces

When manual tracing is insufficient, add instrumentation:

```typescript
// Before the problematic operation
async function dangerousOperation(input: string) {
  const stack = new Error().stack;
  console.error("DEBUG trace:", {
    input,
    cwd: process.cwd(),
    nodeEnv: process.env.NODE_ENV,
    stack,
  });
  // ... proceed
}
```

**Tips:**

- Use `console.error()` in tests — logger may be suppressed
- Log **before** the dangerous operation, not after it fails
- Include context: directory, cwd, environment variables
- `new Error().stack` shows the complete call chain

---

## Finding Test Pollution

When something appears during tests but the source is unknown:

```bash
# Run tests one at a time to find the polluter
for f in src/**/*.test.ts; do
  echo "Testing: $f"
  bun test "$f" 2>&1 | grep -q "FAIL" && echo "POLLUTER: $f" && break
done
```

---

## Fault Isolation Techniques

When backward tracing alone isn't enough, use these systematic isolation methods.

### Binary Search Debugging

Instead of linear search through code, halve the problem space:

1. **Identify the boundary** — Find a working state and a broken state
2. **Split the difference** — Check the midpoint
3. **Narrow** — Repeat on the failing half

```
Working state ←──[check midpoint]──→ Broken state
              ←──[narrow]──→
              ←[found]→
```

### Git Bisect for Regressions

When something "used to work," find the exact breaking commit:

```bash
git bisect start
git bisect bad                    # Current state is broken
git bisect good HEAD~20           # This commit was working
# Git checks out midpoint — test and mark:
git bisect good                   # or: git bisect bad
# Repeat until: "first bad commit is..."
git bisect reset                  # Return to original HEAD
```

**Automate with a test script:**

```bash
git bisect start HEAD HEAD~20
git bisect run bun test path/to/failing.test.ts
```

### Delta Debugging Principle

For complex failures with many variables, systematically minimize:

1. **List all variables** (inputs, config, state, env)
2. **Remove half** — does it still fail?
3. **If yes** → remove half of remaining
4. **If no** → restore and remove the other half
5. **Repeat** until minimal reproducing set

---

## Environment Isolation

When bugs are environment-dependent:

| Technique | How |
|-----------|-----|
| **Clean state** | Reset DB, clear caches, restart server |
| **Minimal reproduction** | Strip away everything unrelated |
| **Environment diff** | Compare working vs broken env (vars, deps, versions) |
| **Fresh install** | `rm -rf node_modules && bun install` |

**Checklist:**
- [ ] Same Node/Bun version?
- [ ] Same environment variables?
- [ ] Same database state?
- [ ] Same dependency versions (`bun.lock`)?

---

## Key Principle

```
Found immediate cause
  → Can trace one level up? → YES → Trace backwards
    → Is this the source? → NO → Keep tracing
    → Is this the source? → YES → Fix at source
      → Add defense-in-depth validation at each layer
  → Can trace one level up? → NO → Fix here + add validation
```

**NEVER fix just where the error appears.** Trace back to find the original trigger.

---

## Combine with Defense-in-Depth

After fixing at source, add validation at every layer the data passes through. See `defense-in-depth.md`.

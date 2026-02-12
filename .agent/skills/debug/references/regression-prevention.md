# Regression Prevention Protocol

> Fix the bug AND fix the system that allowed it.

For L6+ bugs, fixing the symptom is insufficient. The same class of bug will recur unless the system is hardened.

---

## When to Apply

| Bug Level | Required Actions |
|-----------|-----------------|
| L1-L4     | Fix + test (standard flow) |
| L5        | Fix + test + regression risk note |
| L6+       | Fix + test + full postmortem + prevention measures |

---

## Regression Risk Assessment

After identifying the root cause, classify the regression risk:

| Risk | Definition | Example |
|------|-----------|---------|
| **High** | Same bug class likely in other modules | Missing auth check on one route → others unchecked too |
| **Medium** | Bug could recur if related code changes | Race condition in specific async flow |
| **Low** | Isolated incident, unlikely to recur | Typo in config value |

**High risk** → scan codebase for same pattern. Fix ALL instances, not just the reported one.

---

## Postmortem Template (L6+)

```markdown
## Bug Postmortem: [Brief Title]

**Date:** YYYY-MM-DD
**Severity:** P1/P2/P3/P4
**Time to Resolve:** Xh

### Timeline
1. Bug reported/detected: [when, how]
2. Root cause identified: [when, technique used]
3. Fix implemented: [when]
4. Fix verified: [when, how]

### Root Cause
[1-2 sentences. Be specific. "Missing input validation on X endpoint
 allowed Y to pass through unchecked."]

### Why It Escaped
- [ ] Missing test coverage for this path
- [ ] Insufficient defense-in-depth
- [ ] Edge case not considered during review
- [ ] Environment difference (dev vs prod)
- [ ] Other: ___

### Prevention Measures
1. [Test added] — describe the test
2. [Guard added] — describe the validation/check
3. [Pattern fix] — if High risk, list other instances fixed

### Lessons Learned
What would have caught this earlier?
```

---

## Prevention Checklist

Before closing a L5+ bug, verify:

- [ ] **Test exists**: A test that fails WITHOUT the fix and passes WITH it
- [ ] **Guard added**: Defense-in-depth validation at the appropriate layer
- [ ] **Pattern scan**: If High regression risk, scanned for same pattern elsewhere
- [ ] **Documentation**: Root cause documented in commit message
- [ ] **Knowledge captured**: Fix logged for evolution-core learning

---

## Fix Verification Criteria

A fix is verified when ALL are true:

1. **Reproducible**: The original bug can be reproduced on demand
2. **Test-proven**: A test fails without the fix, passes with it
3. **Isolated**: The fix changes only what's necessary (no shotgun changes)
4. **Gate-passing**: All validation gates pass (`check`, `lint`, `test`)
5. **Non-regressive**: No previously passing tests now fail

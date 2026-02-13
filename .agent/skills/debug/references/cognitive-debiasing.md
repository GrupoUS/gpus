# Cognitive Debiasing Protocol

> Debugging is hypothesis-driven science. Biases corrupt hypotheses.

The top 3 cognitive biases in software engineering (Mohanani et al., 65 studies) are **confirmation**, **anchoring**, and **fixation**. All three directly sabotage debugging.

---

## The 5 Debugging Biases

### 1. Confirmation Bias

**What it is:** Seeking evidence that PROVES your hypothesis, ignoring evidence that disproves it.

**In debugging:** Writing tests that confirm the fix works instead of tests that try to *break* it.

**Countermeasure:**
- For every hypothesis, ask: "What evidence would **disprove** this?"
- Write the *disproving* test first
- If you can't think of a disproving test, the hypothesis is too vague

### 2. Anchoring Bias

**What it is:** Over-relying on the first piece of information (the initial error message, the first suspicious line).

**In debugging:** Fixating on the first error in a stack trace when the root cause is deeper.

**Countermeasure:**
- Generate **3 hypotheses** before committing to any single one
- Read the ENTIRE error output before forming any hypothesis
- Ask: "What if the first thing I noticed is a symptom, not the cause?"

### 3. Fixation Bias

**What it is:** Persisting with an approach despite mounting evidence it's wrong.

**In debugging:** Trying variations of the same fix instead of reconsidering the root cause.

**Countermeasure:**
- **2-strike rule**: If the same approach fails twice, change the approach entirely
- Step back and re-read the original error from scratch
- Use the Self-Interrogation Protocol (below)

### 4. Ownership Bias (IKEA Effect)

**What it is:** Treating your own code as more correct than it is.

**In debugging:** "This part is fine, I wrote it" — skipping investigation of your own code.

**Countermeasure:**
- Treat your own code with the *same scrutiny* as unfamiliar code
- Use `git blame` — if you wrote the broken code, acknowledge the bias

### 5. Optimism Bias

**What it is:** Believing the fix is correct before verifying.

**In debugging:** "That should fix it" without running the test suite.

**Countermeasure:**
- Assume the fix is wrong until the test suite passes
- Run validation gates EVERY time, no exceptions

---

## Self-Interrogation Protocol (Rubber Duck)

When stuck for > 5 minutes, answer these 3 questions in writing:

```
1. What SHOULD happen? (expected behavior, exact values)
2. What ACTUALLY happens? (observed behavior, exact values)
3. WHERE do they diverge? (the specific point of divergence)
```

**Why it works:** Articulating the problem forces you to:
- Surface unstated assumptions
- Identify the exact divergence point
- Catch gaps in understanding

**When to use:**
- After ≥ 2 failed hypotheses
- When the error message "doesn't make sense"
- When you catch yourself saying "this shouldn't be possible"

---

## Quick Debiasing Checklist

Before committing to a fix, verify:

- [ ] I generated ≥ 2 alternative hypotheses
- [ ] I read the COMPLETE error output (not just the first line)
- [ ] I have evidence that DISPROVES other hypotheses (not just proves mine)
- [ ] I treated my own code with the same scrutiny as unfamiliar code
- [ ] My fix addresses the ROOT CAUSE, not a symptom
- [ ] I ran the full test suite (not just the one test)

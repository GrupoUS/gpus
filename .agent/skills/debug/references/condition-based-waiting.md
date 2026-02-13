# Condition-Based Waiting

> Replace arbitrary timeouts with condition polling. Wait for what you actually care about.

## When to Use

- Tests have arbitrary delays (`setTimeout`, `sleep`)
- Tests are flaky (pass sometimes, fail under load)
- Tests timeout when run in parallel
- Waiting for async operations to complete

**Don't use when:**

- Testing actual timing behavior (debounce, throttle intervals)
- If using timeout, document WHY with a comment

---

## Core Pattern

```typescript
// ❌ BEFORE: Guessing at timing
await new Promise((r) => setTimeout(r, 50));
const result = getResult();
expect(result).toBeDefined();

// ✅ AFTER: Waiting for condition
await waitFor(() => getResult() !== undefined);
const result = getResult();
expect(result).toBeDefined();
```

---

## Quick Patterns

| Scenario        | Pattern                                              |
| --------------- | ---------------------------------------------------- |
| Wait for event  | `waitFor(() => events.find(e => e.type === 'DONE'))` |
| Wait for state  | `waitFor(() => machine.state === 'ready')`           |
| Wait for count  | `waitFor(() => items.length >= 5)`                   |
| Wait for DOM    | `waitFor(() => document.querySelector('.loaded'))`   |
| Complex         | `waitFor(() => obj.ready && obj.value > 10)`         |

---

## Implementation

```typescript
async function waitFor<T>(
  condition: () => T | undefined | null | false,
  description: string,
  timeoutMs = 5000,
): Promise<T> {
  const startTime = Date.now();

  while (true) {
    const result = condition();
    if (result) return result;

    if (Date.now() - startTime > timeoutMs) {
      throw new Error(
        `Timeout waiting for ${description} after ${timeoutMs}ms`,
      );
    }

    await new Promise((r) => setTimeout(r, 10)); // Poll every 10ms
  }
}
```

---

## Common Mistakes

| Mistake                  | Fix                                              |
| ------------------------ | ------------------------------------------------ |
| Polling too fast (1ms)   | Poll every 10ms                                  |
| No timeout               | Always include timeout with descriptive error    |
| Stale data (cached)      | Call getter inside loop for fresh data           |
| No description           | Include what you're waiting for in error message |

---

## When Arbitrary Timeout IS Correct

```typescript
// Tool ticks every 100ms — need 2 ticks to verify partial output
await waitForEvent(manager, "TOOL_STARTED"); // First: wait for condition
await new Promise((r) => setTimeout(r, 200)); // Then: wait for timed behavior
// 200ms = 2 ticks at 100ms intervals — documented and justified
```

**Requirements:**

1. First wait for triggering condition
2. Based on known timing (not guessing)
3. Comment explaining WHY

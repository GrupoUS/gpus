# Defense-in-Depth Validation

> After fixing a bug, add validation at EVERY layer data passes through. Make the bug structurally impossible.

## Why Multiple Layers

Single validation: "We fixed the bug."
Multiple layers: "We made the bug **impossible**."

Different layers catch different cases:

- Entry validation catches most bugs
- Business logic catches edge cases
- Environment guards prevent context-specific dangers
- Debug logging helps when other layers fail

---

## The Four Layers

### Layer 1: Entry Point Validation

**Purpose:** Reject invalid input at the API boundary.

```typescript
// tRPC procedure with Zod validation
export const create = mentoradoProcedure
  .input(z.object({
    nome: z.string().min(1, "Nome é obrigatório"),
    email: z.string().email().optional(),
    telefone: z.string().min(10, "Telefone inválido"),
  }))
  .mutation(async ({ ctx, input }) => {
    // Input already validated by Zod
  });
```

### Layer 2: Business Logic Validation

**Purpose:** Ensure data makes sense for the operation.

```typescript
async function createMentorado(ctx: Context, input: CreateInput) {
  // Business rule: nome_completo cannot be duplicate per mentor
  const existing = await ctx.db
    .select()
    .from(mentorados)
    .where(and(
      eq(mentorados.userId, ctx.userId),
      eq(mentorados.nome_completo, input.nome),
    ));

  if (existing.length > 0) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Mentorado com este nome já existe",
    });
  }
}
```

### Layer 3: Environment Guards

**Purpose:** Prevent dangerous operations in specific contexts.

```typescript
// In tests, refuse destructive DB operations on production
if (process.env.NODE_ENV === "test") {
  const dbUrl = process.env.DATABASE_URL ?? "";
  if (!dbUrl.includes("localhost") && !dbUrl.includes("neon.tech/neondb_test")) {
    throw new Error("Refusing destructive operation on non-test database");
  }
}
```

### Layer 4: Debug Instrumentation

**Purpose:** Capture context for forensics when other layers fail.

```typescript
async function riskyDbOperation(table: string, data: unknown) {
  console.error("DEBUG db-op:", {
    table,
    dataKeys: Object.keys(data as Record<string, unknown>),
    timestamp: new Date().toISOString(),
    stack: new Error().stack,
  });
  // ... proceed
}
```

---

## Applying the Pattern

When a bug is fixed:

1. **Trace the data flow** — Where does the bad value originate? Where is it used?
2. **Map all checkpoints** — List every point data passes through
3. **Add validation at each layer** — Entry, business, environment, debug
4. **Test each layer** — Try to bypass Layer 1, verify Layer 2 catches it

---

## Key Insight

All four layers are necessary. During testing, each layer catches bugs the others miss:

- Different code paths bypass entry validation
- Mocks bypass business logic checks
- Edge cases on different platforms need environment guards
- Debug logging identifies structural misuse

**Don't stop at one validation point.** Add checks at every layer.

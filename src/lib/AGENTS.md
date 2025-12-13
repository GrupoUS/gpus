# Utilities Development Rules

## Conventions
- **Purity**: Prefer pure functions (deterministic, no side effects).
- **Testing**: Aim for 100% test coverage for logic in `lib`.
- **Naming**: Use descriptive names (camelCase for functions, PascalCase for classes/types).

## Organization
- Group related utilities into files (e.g., `date-utils.ts`, `string-utils.ts`).
- Avoid "god files" like `utils.ts` if possible; break them down.

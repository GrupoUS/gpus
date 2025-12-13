# Hooks Development Rules

## Conventions
- **Naming**: Always prefix with `use` (e.g., `useAuth`, `useTheme`).
- **Typing**: Explicitly type arguments and return values.
- **Composition**: Break down complex logic into smaller, reusable hooks.
- **Testing**: Test hooks in isolation using `renderHook` from `@testing-library/react-hooks` (or equivalent).

## Common Patterns
- **Data Fetching**: Use `useQuery` or `useMutation` (Convex/TanStack Query) for data.
- **State**: Use `useState` for local state, `useStore` (if available) for global.

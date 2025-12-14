# Development Commands

## Package Manager
**⚠️ IMPORTANT**: Always use `bun` - never npm, yarn, or pnpm

```bash
# Install dependencies
bun install

# Add a dependency
bun add package-name

# Add dev dependency
bun add -D package-name
```

## Development

```bash
# Start full development (Convex + Vite)
bun run dev

# Web development only
bun run dev:web

# TypeScript watch mode
bun run dev:ts

# Convex development only
bun run dev:convex
```

## Building & Type Checking

```bash
# Build (includes type checking)
bun run build

# Type check only
tsc --noEmit
```

## Code Quality

```bash
# Lint and auto-fix
bun run lint

# Lint check only
bun run lint:check

# Format code
bun run format

# Format check only
bun run format:check
```

## Testing

```bash
# Run all tests
bun run test

# Watch mode
bun run test:watch

# UI mode
bun run test:ui

# With coverage
bun run test:coverage
```

## Convex Operations

```bash
# Deploy to production
bun run deploy:convex

# View dashboard
bunx convex dashboard
```

## Git

```bash
# Check status
git status

# See changes
git diff

# See staged changes
git diff --cached

# Log
git log --oneline -5

# Current branch
git rev-parse --abbrev-ref HEAD
```

## Utilities

```bash
# Find component
rg -n "export.*function.*ComponentName" src/components

# Find route
rg -n "createFileRoute" src/routes

# Find Convex function
rg -n "export const" convex/

# Find type definitions
rg -n "interface|type.*=" src/
```

## Adding shadcn Components

```bash
bunx shadcn@latest add [component-name]
```

## Common Workflows

### 1. Add New Feature
```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Start development
bun run dev

# 3. Make changes
# ...edit files...

# 4. Check and fix code
bun run lint
bun run test
bun run build

# 5. Commit
git add .
git commit -m "feat: add new feature"

# 6. Push and create PR
git push origin feature/new-feature
```

### 2. Deploy Changes
```bash
# 1. Deploy Convex backend
bun run deploy:convex

# 2. Deploy frontend ( Railway - automatic)
git push origin main
```

### 3. Add New Route
```bash
# 1. Create route file
touch src/routes/new-feature.tsx

# 2. TanStack Router generates types automatically
bun run dev  # routeTree.gen.ts updated

# 3. Add navigation in sidebar if needed
```

### 4. Add New Component
```bash
# 1. Create component file
touch src/components/new-component.tsx

# 2. Export in index if needed
# 3. Import where needed
import { NewComponent } from '@/components/new-component'
```
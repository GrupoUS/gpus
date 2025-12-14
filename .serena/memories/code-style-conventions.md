# Code Style & Conventions

## Formatting (Biome)
- **Indentation**: Tabs (width: 2)
- **Line width**: 100 characters
- **Line endings**: LF
- **Quotes**: Single quotes
- **Semicolons**: Always
- **Trailing commas**: All

## TypeScript Rules
- **Strict mode**: Enabled
- **No `any` types**: Enforced by Biome
- **Type hints**: Required for function parameters and return types
- **Imports**: Use `import type` for types only
- **File naming**: camelCase, PascalCase, or kebab-case

## React Patterns
- **Functional components only** (no classes)
- **Files**: `.tsx` for components with JSX, `.ts` for utilities
- **Exports**: Default export for components, named exports for utilities
- **Hooks**: Custom hooks start with `use` prefix
- **Props**: TypeScript interfaces defined inline or nearby

## Project Structure
```
src/
├── components/      # Reusable UI components
│   ├── ui/          # shadcn/ui components
│   ├── layout/       # Layout components
│   ├── crm/         # CRM-specific components
│   ├── chat/        # Chat components
│   ├── students/     # Student management
│   └── dashboard/   # Dashboard components
├── routes/          # TanStack Router pages
│   └── _authenticated/  # Protected routes
├── lib/             # Utilities and helpers
├── hooks/           # Custom React hooks
└── styles/          # Global styles
```

## Convex Patterns
- **Schema**: All tables in `convex/schema.ts`
- **Functions**: Separated by domain (leads.ts, students.ts, etc.)
- **Validation**: Use `v` from `convex/values`
- **Indexes**: Define for frequently queried fields
- **Mutations**: Return the created/updated ID when applicable

## Naming Conventions
- **Components**: PascalCase (e.g., `LeadCard.tsx`)
- **Functions**: camelCase (e.g., `createLead`)
- **Constants**: UPPER_SNAKE_CASE
- **Interfaces**: PascalCase with `I` prefix discouraged, use descriptive names
- **Enums**: PascalCase
- **Variables**: camelCase

## Import Organization
```typescript
// 1. React & next-themes
import { useState } from 'react'
import { useTheme } from 'next-themes'

// 2. Third-party libraries
import { z } from 'zod'
import { toast } from 'sonner'

// 3. Convex
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'

// 4. Internal components
import { Button } from '@/components/ui/button'
import { LeadCard } from '@/components/crm/lead-card'

// 5. Utilities
import { cn } from '@/lib/utils'
```

## Git Hooks & Pre-commit
- **Pre-commit**: Biome auto-fixes formatting and linting
- **Commit message**: Conventional Commits format
- **Branch strategy**: `main` for production, feature branches for development
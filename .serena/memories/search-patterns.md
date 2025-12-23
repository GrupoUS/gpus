# Efficient Search Patterns

## Finding Components

### By Component Name
```bash
# Symbol search
find_symbol -n "LeadCard" -p "src/components"

# Pattern search for exports
search_for_pattern -s "export.*LeadCard" -p "src/components"
```

### By UI Component (shadcn)
```bash
# All UI components overview
get_symbols_overview -p "src/components/ui"

# Find specific UI component
find_symbol -n "Button" -p "src/components/ui"
```

### By Feature Area
```bash
# CRM components
find_symbol -n ".*" -p "src/components/crm" -d 1

# Chat components
find_symbol -n ".*" -p "src/components/chat" -d 1

# Student components
find_symbol -n ".*" -p "src/components/students" -d 1
```

## Finding Routes

### All Routes Overview
```bash
get_symbols_overview -p "src/routes"
```

### Specific Route
```bash
# Dashboard route
find_symbol -n "dashboard" -p "src/routes"

# CRM route
find_symbol -n "crm" -p "src/routes/_authenticated"

# Dynamic routes ($parameter)
find_symbol -n "\\$.*" -p "src/routes"
```

## Finding Convex Functions

### By Domain
```bash
# Lead functions
get_symbols_overview -p "convex/leads"

# Student functions
get_symbols_overview -p "convex/students"

# All Convex files overview
get_symbols_overview -p "convex" -d 1
```

### By Function Type
```bash
# Find all mutations
search_for_pattern -s "export const.*= mutation" -p "convex"

# Find all queries
search_for_pattern -s "export const.*= query" -p "convex"

# Find actions
search_for_pattern -s "export const.*= action" -p "convex"
```

## Finding Hooks

### Custom Hooks
```bash
# All hooks overview
get_symbols_overview -p "src/hooks"

# Specific hook
find_symbol -n "use.*" -p "src/hooks"
```

## Finding Types/Schemas

### Convex Schema
```bash
# Find specific table definition
search_for_pattern -s "defineTable.*leads" -p "convex/schema"

# Find all tables
search_for_pattern -s "defineTable" -p "convex/schema"
```

### TypeScript Types
```bash
# Find type definitions
search_for_pattern -s "(interface|type).*=" -p "src"

# Find enums
search_for_pattern -s "enum" -p "src"
```

## Finding Utilities

### Lib Functions
```bash
# All utilities
get_symbols_overview -p "src/lib"

# Specific utility
find_symbol -n "cn" -p "src/lib"  // className utility
find_symbol -n "format" -p "src/lib"  // formatters
```

## Performance Tips

### Use Relative Paths
Always specify `relative_path` to limit search scope:
- `src/components` - faster than searching entire project
- `convex/leads` - much faster than `convex`
- Specific file path for exact matches

### Use Symbol Search First
1. `find_symbol` or `get_symbols_overview` for structure
2. `find_referencing_symbols` to see usage
3. Only then use `search_for_pattern` for complex patterns

### Common Search Patterns

1. **Component with state**: `useState|useEffect`
2. **API calls**: `useQuery|useMutation`
3. **Form handlers**: `onSubmit|handleSubmit`
4. **Event handlers**: `onClick|onChange`
5. **Route definitions**: `createFileRoute`
6. **Exports**: `export.*function|export const`

### Example Workflow

1. Find all CRM lead components:
```bash
get_symbols_overview -p "src/components/crm" -d 2
```

2. Find where LeadCard is used:
```bash
find_referencing_symbols -n "LeadCard" -p "src/components/crm/lead-card.tsx"
```

3. Search for specific pattern in leads:
```bash
search_for_pattern -s "temperature.*=.*quente" -p "src/components/crm"
```

4. Find related schema in Convex:
```bash
search_for_pattern -s "leads.*defineTable" -p "convex/schema"
```

---

## Semantic Search with mgrep

**mgrep** uses AI embeddings (Mixedbread AI) for semantic/conceptual code search, unlike serena's LSP-based exact matching.

### When to Use mgrep vs Serena

| Query Type | Use Tool | Example |
|------------|----------|---------|
| Exact symbol name | `find_symbol` | "Find LeadCard component" |
| Conceptual question | `mgrep` | "How does authentication work?" |
| Regex pattern in code | `search_for_pattern` | "Find all useState hooks" |
| Architecture understanding | `mgrep` | "Error handling patterns" |
| Find all usages | `find_referencing_symbols` | "Where is LeadCard used?" |
| Similar code patterns | `mgrep` | "Form validation approaches" |

### mgrep Query Patterns

**Effective queries** (conceptual, natural language):
```bash
mgrep search "authentication flow with Clerk"
mgrep search "error handling patterns in mutations"
mgrep search "form validation with Zod schema"
mgrep search "real-time updates with Convex useQuery"
mgrep search "CRM lead pipeline kanban board"
mgrep search "student enrollment workflow"
```

**Less effective queries** (too literal - use serena instead):
```bash
# DON'T: Exact function names (use find_symbol)
mgrep search "useAuth"  # ❌

# DON'T: File paths (use read_file or get_symbols_overview)
mgrep search "src/components/ui/button.tsx"  # ❌

# DON'T: Import statements (use search_for_pattern)
mgrep search "import { Button } from"  # ❌
```

### Project-Specific mgrep Examples

```bash
# Convex patterns
mgrep search "Convex mutation with authentication check"
mgrep search "real-time subscription data fetching"
mgrep search "database index query optimization"

# React patterns
mgrep search "form component with validation errors"
mgrep search "loading state skeleton UI"
mgrep search "modal dialog with confirmation"

# TanStack Router
mgrep search "protected route authentication guard"
mgrep search "route loader data fetching"

# Business domain
mgrep search "lead temperature classification hot warm cold"
mgrep search "student enrollment status tracking"
mgrep search "conversation messaging WhatsApp"
```

### Combined Workflow: mgrep + Serena

1. **Conceptual search** (understand the area):
   ```bash
   mgrep search "lead management CRM pipeline"
   ```

2. **Symbol resolution** (find exact code):
   ```bash
   find_symbol -n "LeadCard" -p "src/components/crm"
   ```

3. **Usage tracking** (see where it's used):
   ```bash
   find_referencing_symbols -n "LeadCard" -p "src/components/crm/lead-card.tsx"
   ```

4. **Pattern search** (find similar patterns):
   ```bash
   search_for_pattern -s "temperature.*quente" -p "src/components/crm"
   ```

### Fallback Strategy

```
mgrep (conceptual) 
  → serena find_symbol (exact) 
  → serena search_for_pattern (regex)
  → gh_grep (external examples)
```

Use this order when researching unfamiliar code areas.
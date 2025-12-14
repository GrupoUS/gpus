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
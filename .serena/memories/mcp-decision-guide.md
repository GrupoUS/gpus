# MCP Decision Guide

Quick reference for choosing the right MCP tool in this project (Portal Grupo US).

## Decision Tree

```
Need to find code?
├── Know exact symbol name? → serena find_symbol
├── Conceptual/architecture question? → mgrep
├── Regex pattern match? → serena search_for_pattern
├── Find all usages of X? → serena find_referencing_symbols
└── Need external examples? → gh_grep

Need documentation?
├── Official library docs? → context7
├── Current community practices? → tavily
└── Specific URL content? → fetch

Need to reason/analyze?
└── Complex multi-step problem? → sequential-thinking
```

## Tool Comparison Matrix

| Tool | Type | Best For | Avoid When |
|------|------|----------|------------|
| `serena find_symbol` | LSP | Exact symbol names, locations | Conceptual questions |
| `serena find_referencing_symbols` | LSP | All usages of a symbol | Broad pattern search |
| `serena search_for_pattern` | Regex | Code patterns, imports | Semantic meaning |
| `serena get_symbols_overview` | LSP | File structure overview | Detailed code |
| `mgrep` | Embeddings | Architecture, "how does X work" | Exact function names |
| `gh_grep` | GitHub | External production examples | Project-specific code |
| `context7` | Docs | Official API documentation | Community solutions |
| `tavily` | Web | Latest practices, discussions | Authoritative specs |
| `fetch` | Web | Specific URL content | General research |
| `sequential-thinking` | AI | Complex analysis, debugging | Simple lookups |

## Fallback Chains

### Code Search Fallback
```
1. serena find_symbol (exact match)
   ↓ not found
2. mgrep (semantic search)
   ↓ not found
3. serena search_for_pattern (regex)
   ↓ not found
4. gh_grep (external examples)
```

### Research Fallback
```
1. mgrep (project context)
   ↓ need more
2. serena get_symbols_overview (structure)
   ↓ need external
3. context7 (official docs)
   ↓ need current practices
4. tavily (web search)
```

### Documentation Fallback
```
1. context7 (authoritative)
   ↓ not found
2. gh_grep (real examples)
   ↓ need more context
3. tavily (community)
```

## Project-Specific Patterns

### Convex Backend

```bash
# Find mutation/query by name
serena find_symbol -n "createLead" -p "convex"

# Understand Convex patterns
mgrep search "Convex mutation with authentication"

# Find schema definitions
serena search_for_pattern -s "defineTable.*leads" -p "convex/schema"

# Find all usages of a Convex function
serena find_referencing_symbols -n "createLead" -p "convex/leads.ts"
```

### React Components

```bash
# Find component by name
serena find_symbol -n "LeadCard" -p "src/components"

# Understand component patterns
mgrep search "form component with Zod validation"

# Find component usage
serena find_referencing_symbols -n "LeadCard" -p "src/components/crm/lead-card.tsx"

# Find hooks usage pattern
serena search_for_pattern -s "useQuery.*api\\.leads" -p "src"
```

### TanStack Router

```bash
# Find route definition
serena find_symbol -n "Route" -p "src/routes/crm"

# Understand routing patterns
mgrep search "protected route with auth guard"

# Find all routes
serena search_for_pattern -s "createFileRoute" -p "src/routes"
```

### Clerk Authentication

```bash
# Find auth usage
serena search_for_pattern -s "useAuth|useUser|useClerk" -p "src"

# Understand auth patterns
mgrep search "authentication guard role-based access"
```

## Common Scenarios

### Scenario 1: "How does feature X work?"
```bash
1. mgrep search "feature X workflow"  # Conceptual understanding
2. serena get_symbols_overview -p "relevant/path"  # Structure
3. serena find_symbol -n "MainComponent"  # Key code
```

### Scenario 2: "Find where Y is used"
```bash
1. serena find_symbol -n "Y"  # Locate Y
2. serena find_referencing_symbols -n "Y" -p "file.ts"  # All usages
```

### Scenario 3: "Implement feature like Z library"
```bash
1. context7 get-library-docs "library-name"  # Official docs
2. gh_grep search "library usage pattern"  # Real examples
3. mgrep search "similar pattern in project"  # Project context
```

### Scenario 4: "Debug error in function F"
```bash
1. serena find_symbol -n "F"  # Locate function
2. serena find_referencing_symbols -n "F"  # Call sites
3. mgrep search "error handling similar function"  # Patterns
4. sequential-thinking (analyze error)  # Deep analysis
```

### Scenario 5: "Refactor component C"
```bash
1. serena find_symbol -n "C" -d 2  # Component + children
2. serena find_referencing_symbols -n "C"  # All usages
3. mgrep search "refactoring pattern for C type"  # Best practices
4. gh_grep search "modern C pattern"  # External examples
```

## Quick Reference Card

| I need to... | Use this |
|--------------|----------|
| Find a function/component | `serena find_symbol` |
| See where X is used | `serena find_referencing_symbols` |
| Search by regex | `serena search_for_pattern` |
| Understand how X works | `mgrep` |
| See file structure | `serena get_symbols_overview` |
| Get official docs | `context7` |
| Find GitHub examples | `gh_grep` |
| Search web for solutions | `tavily` |
| Analyze complex problem | `sequential-thinking` |

# Serena + GPU Project Integration Guide

## Quick Start Workflow

### 1. Initial Project Setup
```bash
# Ensure project is activated
serena activate_project /Users/sacha/projetos/gpus

# Check onboarding status
serena check_onboarding_performed
```

### 2. Daily Development
```bash
# Start development
bun run dev

# In another terminal, check memory
serena list_memories
```

### 3. Common Tasks with Serena

#### Adding New Component
```bash
# 1. Find similar component first
get_symbols_overview -p "src/components/crm" -d 1

# 2. Check existing patterns
find_symbol -n "Button" -p "src/components/ui" -include_body true

# 3. Create new component
# Use Serena insert_after_symbol or create new file
```

#### Updating Convex Schema
```bash
# 1. Find current schema
find_symbol -n "leads" -p "convex/schema" -include_body true

# 2. Check references
find_referencing_symbols -n "leads" -p "convex/schema"

# 3. Update schema
# Use serena_replace_symbol_body for table definition
```

#### Working with Routes
```bash
# 1. Find route structure
get_symbols_overview -p "src/routes/_authenticated"

# 2. Find specific route
find_symbol -n "dashboard" -p "src/routes/_authenticated/dashboard.tsx"

# 3. Check navigation references
search_for_pattern -s "to='/dashboard'" -p "src"
```

## Memory System Usage

### Read Relevant Memory
```bash
# Read project overview
serena read_memory project-overview.md

# Read coding conventions
serena read_memory code-style-conventions.md

# Read common patterns
serena read_memory common-development-patterns.md

# Read search patterns
serena read_memory search-patterns.md
```

### Update Memory
```bash
# Add new pattern discovered
serena edit_memory common-development-patterns.md
  -needle "PATTERNS" 
  -repl "NEW PATTERN HERE" 
  -mode regex
```

## Efficient Search Workflow

### 1. Start Broad
```bash
# Overview of area
get_symbols_overview -p "src/components/chat"
```

### 2. Get Specific
```bash
# Symbol details
find_symbol -n "useConversation" -p "src/hooks" -include_body true

# Find usage
find_referencing_symbols -n "useConversation" -p "src"
```

### 3. Pattern Search
```bash
# Complex pattern matching
search_for_pattern -s "useState.*conversation" -p "src/components/chat"
```

## Integration with IDE

### VSCode Integration
Project is already configured for VSCode with:
- Serena tools available
- Git integration active
- TypeScript strict mode

### Command Palette Access
- `Ctrl/Cmd + Shift + P` → "Serena"
- Quick access to:
  - Activate project
  - List memories
  - Search symbols

## Best Practices

### Memory-First Development
1. Check memories before starting new feature
2. Update memories when discovering new patterns
3. Use search patterns for efficient navigation

### Progressive Disclosure
1. Use `get_symbols_overview` for high-level understanding
2. Use `find_symbol` for specific implementation
3. Only use `search_for_pattern` when patterns are unclear

### Symbol Relationships
1. Use `find_referencing_symbols` before refactoring
2. Check all usages before breaking changes
3. Update all references when modifying symbols

## Common Workflows with GPU Project

### CRM Development
```bash
# 1. Understand lead pipeline
read_memory project-overview.md  # Check business context

# 2. Find existing CRM components
get_symbols_overview -p "src/components/crm"

# 3. Check schema
find_symbol -n "leads" -p "convex/schema"

# 4. Implement new feature
# Use patterns from common-development-patterns.md
```

### Chat System Development
```bash
# 1. Check message schema
search_for_pattern -s "messages.*defineTable" -p "convex/schema"

# 2. Find chat components
list_dir -r src/components/chat

# 3. Check WebSocket/real-time patterns
search_for_pattern -s "useSubscription|useQuery" -p "src/components/chat"
```

### Student Management
```bash
# 1. Understand student data model
read_memory project-overview.md

# 2. Check enrollment schema
find_symbol -n "enrollments" -p "convex/schema"

# 3. Find student components
get_symbols_overview -p "src/components/students"
```

### Dashboard Metrics
```bash
# 1. Check stats calculations
find_symbol -n "dailyMetrics" -p "convex/stats"

# 2. Find dashboard components
get_symbols_overview -p "src/components/dashboard"

# 3. Check chart usage
search_for_pattern -s "recharts" -p "src/components/dashboard"
```

## Troubleshooting Integration

### If Tools Not Available
```bash
# Check project activation
serena get_current_config

# Reactivate if needed
serena activate_project /Users/sacha/projetos/gpus
```

### If Memory Not Found
```bash
# List available memories
serena list_memories

# Create if missing
serena write_memory new-memory.md "content"
```

### If Search Is Slow
```bash
# Use specific paths
find_symbol -n "exactName" -p "src/precise/path"

# Use include/exclude patterns
search_for_pattern -s "pattern" -p "src/components" -exclude "tests"
```

## Advanced Tips

### Multi-File Analysis
```bash
# Search across domains
search_for_pattern -s "useMutation" -p "src/components" -p "src/hooks" -p "src/routes"

# Follow relationships
find_referencing_symbols -n "api.leads.create" -r
```

### Performance Optimization
- Use `-d` depth parameter for symbol overview
- Use `-include_body false` for quick scanning
- Use specific `relative_path` whenever possible

### Learning New Codebase
1. Read project-overview.md for context
2. Explore high-level structure with list_dir
3. Dive into specific areas with get_symbols_overview
4. Understand patterns from common-development-patterns.md
5. Use task-completion-checklist.md for quality assurance
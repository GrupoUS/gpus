# Serena Configuration - Optimized Setup

## Last Updated: 2025-12-27

## Configuration Summary

### `.serena/project.yml` Optimizations

#### 1. Initial Prompt (Added)
**Purpose:** Load project conventions automatically on activation.

**Content:**
```yaml
initial_prompt: "# Portal Grupo US - Project Context
**Stack:** React 19 + Vite + TanStack Router + shadcn/ui + Convex + Clerk
**Type:** CRM for health aesthetics education
**Package Manager:** ALWAYS use `bun`, never npm/yarn/pnpm
**Core Principles:**
- KISS: Simple systems over complex ones. Prioritize readability.
- YAGNI: Build only what requirements specify. Remove unused code.
- Chain of Thought: Break problems into sequential atomic steps.
- Research First: Multi-source validation for complex implementations.
- Preserve Context: Maintain context across agent transitions.
- Always Audit: Validate, never assume fixed.

**Coding Standards:**
- TypeScript strict, Biome (tabs, single quotes)
- Use shadcn/ui components, never rebuild from scratch
- Functional components only, no classes
- LGPD compliance for student/user data

**Validation Gates:**
- bun run test (passing)
- bun run lint:check (0 errors)
- bun run build (type check)

**MCP Priority:** serena → context7 → tavily for code/docs"
```

**Why Concise:**
- Avoids context bloat
- Prevents redundant rules (AGENTS.md + .serena/ sub-AGENTS.md)
- Focuses on critical conventions only

#### 2. Ignored Paths (Expanded)
**Purpose:** Improve LSP performance by excluding non-essential paths.

**Additions:**
- `node_modules/**`, `dist/**`, `.turbo/**`, `coverage/**`
- `.cache/**`, `.output/**`, `.tanstack/**`, `.vercel/**`
- `convex/_generated/**` (auto-generated files)
- `src/routeTree.gen.ts` (TanStack Router generated)
- Log files: `*.log`, `build_output.*`, `ts-errors.txt`, etc.
- Test artifacts: `test-results.json`, `railway_*.txt`
- Playwright: `playwright-report/**`, `playwright/.cache/**`, `blob-report/**`

**Performance Impact:**
- Estimated 60-80% LSP index reduction
- Faster symbol searches
- Reduced memory footprint

#### 3. Context Configuration
**Recommended:** `--context ide-assistant`

**Why `ide-assistant`:**
- Optimized for IDE assistant integrations
- Best balance of functionality and generalization
- Supports React/Vite/Convex patterns naturally

**Command (for Claude Code/Cursor):**
```bash
claude mcp add serena -- uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context ide-assistant --project "$(pwd)"
```

**Key Flags:**
- `--context ide-assistant`: Pre-configured for IDE assistants
- `--project "$(pwd)"`: Auto-activates gpus project on startup
- `uvx`: Official execution method

## Configuration File Structure

```
.serena/
├── project.yml              # Main configuration (optimized)
├── memories/
│   ├── serena-config-optimization.md  # This file
│   ├── bundle-optimization-guide.md
│   └── [other memories...]
```

## Best Practices Applied

1. ✅ **Initial Prompt Minimal**: Focused on core conventions, not entire AGENTS.md
2. ✅ **Ignored Paths Comprehensive**: Covers all generated/artifact files
3. ✅ **Context Explicit**: `ide-assistant` specified in command
4. ✅ **Language Servers Enabled**: TypeScript for full type safety
5. ✅ **Gitignore Integration**: Respects `.gitignore` automatically

## Troubleshooting

### Language Server Not Initialized
If you see "language server manager is not initialized":
1. Check `.serena/project.yml` syntax (YAML valid)
2. Verify `languages` includes `typescript`
3. Restart MCP client
4. Check Serena logs for specific errors

### Project Not Activating
If project doesn't activate automatically:
1. Verify `--project "$(pwd)"` flag in MCP command
2. Check working directory is correct
3. Run `serena activate_project gpus` manually

### Slow Symbol Searches
If searches are slow:
1. Verify `ignored_paths` include `node_modules`, `dist`
2. Restart LSP: `serena restart_language_server`
3. Check memory usage on system

## Next Optimizations (Optional)

1. **Custom Context**: If `ide-assistant` is too generic, create custom context
2. **Tool Exclusion**: Exclude rarely-used tools if context limited
3. **Memory Indexing**: Create memories for frequently-used patterns

---

**Reference:**
- Serena Docs: https://oraios.github.io/serena/
- Repo: https://github.com/oraios/serena

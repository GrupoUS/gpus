# Improved Build Prompt for Portal Grupo US

## Summary
Created improved build.txt prompt that coordinates all agents effectively while keeping context window manageable.

## Key Improvements Made

### 1. Simplified Structure
- Reduced from 625 lines (factory AGENTS.md) to ~150 lines
- Focused on practical decision matrix instead of theoretical frameworks
- Removed redundant details and verbose explanations

### 2. Clear Agent Portfolio
- Quick reference table for all 6 agents with roles and tools
- Immediate routing rules with YAML triggers
- Simple decision matrix based on task keywords

### 3. Streamlined Context Protocol
- Before/After handoff checklists
- Clear success criteria
- 5-level escalation system with time limits

### 4. MCP Integration Simplified
- Tool chains for each workflow type
- Context7 for official docs
- Serena for code analysis
- Tavily for research only

### 5. Brazilian Compliance Built-in
- Auto-activation keywords for LGPD, PIX, ANVISA
- Immediate routing to appropriate specialists
- Compliance checks mandatory

## Benefits

1. **Reduced Context Window**: From verbose 625 lines to concise ~150 lines
2. **Faster Decision Making**: Clear matrix eliminates ambiguity
3. **Better Agent Coordination**: Structured handoffs prevent context loss
4. **Maintained Intelligence**: Kept all key patterns from factory AGENTS.md
5. **Easier Maintenance**: Simpler structure to update and modify

## Files Modified
- .opencode/prompts/build.txt (overwritten with improved version)

## Validation
- Covers all 6 subagents in project
- Preserves MCP tool integration
- Maintains Brazilian compliance requirements
- Fits OpenCode agent model (primary/subagent structure)
- Under 200 lines to prevent context overflow
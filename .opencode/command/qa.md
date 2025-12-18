---
description: Pipeline completo de QA + Deploy com monitoramento e fix automático
agent: code-reviewer
---

# 🔍 Quality Control - Modern Web Stack

**Complete quality control pipeline for Bun + Vite + Convex + TanStack Router applications with Railway deployment verification.**

---

## 🏗️ ARCHITECTURAL OVERVIEW

### System Components
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DEPLOYMENT ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐          ┌─────────────────┐                        │
│  │   FRONTEND      │          │    BACKEND      │                        │
│  │                 │          │                 │                        │
│  │ Railway (Docker)│◄────────►│    Convex       │                        │
│  │ Vite Build      │  Auth    │ Real-time DB    │                        │
│  │ Static Hosting  │◄────────►│ + Functions     │                        │
│  │                 │  Clerk   │                 │                        │
│  └─────────────────┘          └─────────────────┘                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Tech Stack Integration
- **Runtime**: Bun (package manager + execution)
- **Frontend**: React 19 + Vite + TanStack Router
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Backend**: Convex (database + real-time functions)
- **Auth**: Clerk (authentication)
- **Deploy**: Railway (frontend) + Convex (backend)

---

# Code Quality Review

Perform comprehensive code quality review: $ARGUMENTS

## Task

Follow these steps to conduct a thorough code review:

1. **Code Quality Assessment**
   - Scan for code smells, anti-patterns, and potential bugs
   - Check for consistent coding style and naming conventions
   - Identify unused imports, variables, or dead code
   - Review error handling and logging practices

2. **Security Review**
   - Look for common security vulnerabilities (SQL injection, XSS, etc.)
   - Check for hardcoded secrets, API keys, or passwords
   - Review authentication and authorization logic
   - Examine input validation and sanitization

3. **Performance Analysis**
   - Identify potential performance bottlenecks
   - Check for inefficient algorithms or database queries
   - Review memory usage patterns and potential leaks
   - Analyze bundle size and optimization opportunities

4. **Architecture & Design**
   - Evaluate code organization and separation of concerns
   - Check for proper abstraction and modularity
   - Review dependency management and coupling
   - Assess scalability and maintainability

5. **Testing Coverage**
   - Check existing test coverage and quality
   - Identify areas lacking proper testing
   - Review test structure and organization
   - Suggest additional test scenarios

6. **Documentation Review**
   - Evaluate code comments and inline documentation
   - Check API documentation completeness
   - Review README and setup instructions
   - Identify areas needing better documentation

7. **Recommendations**
   - Prioritize issues by severity (critical, high, medium, low)
   - Provide specific, actionable recommendations
   - Suggest tools and practices for improvement
   - Create a summary report with next steps

Remember to be constructive and provide specific examples with file paths and line numbers where applicable.

## 📍 PHASE 1: LOCAL QUALITY CHECKS

> **⚠️ CRITICAL GATE**: Do NOT proceed to deployment if ANY check fails

### 1.1 Code Quality & Linting
```bash
# Check code formatting and lint rules
bun run lint:check

# Expected: 0 errors, 0 warnings
# If issues found: bun run lint to auto-fix
```

### 1.2 Type Safety & Build Verification
```bash
# Type checking (included in build)
bun run build

# Expected: Clean build with no TypeScript errors
# This command runs both Vite build and tsc --noEmit
```

### 1.3 Test Coverage
```bash
# Run tests with coverage
bun run test:coverage

# Expected: All tests pass, coverage metrics maintained
# Coverage report generated in coverage/ directory
```

### 1.4 Local Development Validation
```bash
# Verify local development setup
bun run dev

# Expected: Application starts successfully on http://localhost:5173
# No runtime errors in browser console
```

### 1.5 MCP-Powered Error Detection & Analysis

> **🔬 INTELLIGENT RESEARCH**: When errors are detected, use MCPs to research authoritative solutions before manual fixes

### Research-Driven Error Resolution

This phase activates automatically when Phase 1 detects errors. MCP tools research solutions from multiple authoritative sources before applying fixes.

#### Research Workflow

```yaml
MCP_RESEARCH_WORKFLOW:
  trigger: "Any error detected in Phase 1"
  
  parallel_research:
    official_docs:
      tool: "context7 get-library-docs"
      libraries: ["typescript", "vite", "react", "convex", "railway"]
      topics: "Error type or component"
      confidence: "≥95% (official documentation)"
    
    current_solutions:
      tool: "tavily-search"
      query: "Error message + stack + solution 2024 2025"
      depth: "advanced"
      max_results: 10
      confidence: "≥90% (cross-validated)"
    
    codebase_analysis:
      tool: "serena search_for_pattern"
      pattern: "Error pattern or similar code"
      context_lines: 10
      output: "Existing patterns in codebase"
  
  synthesis:
    tool: "sequential-thinking"
    input: "All research results"
    process: ["Analyze solutions", "Compare approaches", "Select best fix", "Validate confidence"]
    output: "Recommended solution with ≥95% confidence"
```

## 📍 PHASE 2: DEPLOYMENT VALIDATION

> **✅ PREREQUISITE**: Phase 1 must pass completely (or Phase 1.5 completed if errors were fixed)

#### Deployment Status Verification
```bash
# Check current deployment status
railway status

# Expected: Service running, healthy status
# Note the public URL for validation
```

#### Trigger Deployment (if needed)
```bash
# Push changes to trigger deployment
git add .
git commit -m "chore: update deployment"
git push origin main

# Railway will automatically deploy on push
```

#### Frontend Health Checks
```bash
# Retrieve public URL from Railway dashboard or status command
PUBLIC_URL=$(railway status | grep -o 'https://[^[:space:]]*\.railway\.app')

# Verify root path loads without errors
curl -f "$PUBLIC_URL" || echo "❌ Frontend health check failed"

# Open in browser for visual verification
open "$PUBLIC_URL"
```

#### 📋 Railway Log Analysis
```bash
# Check recent deployment logs (last 50 lines)
railway logs --lines 50

# Check extended logs for more context
railway logs --lines 200

# Stream logs in real-time (for monitoring)
railway logs --follow

# Get logs from a specific service (if multiple)
railway logs --service <service-name>

# Look for common error patterns:
# - Build errors ("Error:", "BUILD FAILED")
# - Runtime errors ("Uncaught", "Exception")
# - Missing environment variables ("undefined", "VITE_")
# - Convex connection issues ("convex", "WebSocket")
# - Docker/container issues ("OOMKilled", "Crashloop")
```

#### 🔴 Railway Error Detection & Debugging
```bash
# Check deployment status with details
railway status

# Get deployment history
railway deployments

# Check environment variables are set correctly
railway variables list

# Filter logs for errors specifically
railway logs --lines 100 2>&1 | grep -iE "error|failed|exception|warning|undefined"

# Check for build failures
railway logs --lines 100 2>&1 | grep -iE "build failed|npm err|bun err|exit code"

# Check for container health issues
railway logs --lines 100 2>&1 | grep -iE "oom|killed|crash|restart"
```

### Backend Deployment (Convex)

> **🔧 CONVEX CLI INTEGRATION**: Use the Convex CLI for comprehensive deployment verification, log analysis, and error detection.

#### Schema & Function Deployment
```bash
# Deploy Convex schema and functions to production
bun run deploy:convex

# Alternative: Direct Convex CLI deployment
bunx convex deploy --prod

# Expected: Successful deployment confirmation
# Note the deployment URL/ID
```

#### Active Deployment Verification
```bash
# List all Convex deployments with status
bunx convex deployments list

# Get detailed deployment information
bunx convex deployment info

# Verify current deployment URL
bunx convex env get CONVEX_URL

# Expected: Your deployment appears as 'Active'
# Verify CONVEX_DEPLOYMENT in .env.local matches active deployment
```

#### 📋 Convex Log Analysis
```bash
# View real-time Convex logs
bunx convex logs

# View logs from production deployment
bunx convex logs --prod

# View logs with more detail (last 100 entries)
bunx convex logs --prod --limit 100

# Stream logs in real-time (for monitoring)
bunx convex logs --prod --follow

# Filter logs by function name
bunx convex logs --prod --function "api.leads.list"

# Look for error patterns:
# - "Error:" prefixed lines
# - "Uncaught" exceptions
# - "Schema validation failed"
# - "Function execution failed"
```

#### 🔴 Convex Error Detection
```bash
# Check for deployment errors
bunx convex deploy --prod --dry-run 2>&1 | grep -i "error\|failed\|warning"

# Validate schema before deployment
bunx convex dev --typecheck-only

# Check function exports are valid
bunx convex codegen

# Common error patterns to look for:
# - "Invalid schema definition"
# - "Type mismatch in function"
# - "Missing required field"
# - "Function not exported"
# - "Validator error"
```

#### Backend Function Validation
```bash
# Test key Convex functions are accessible
bunx convex run --prod api.leads.list
bunx convex run --prod api.users.list

# Test with specific arguments
bunx convex run --prod api.leads.get --args '{"id": "test-id"}'

# Expected: Functions execute without errors
# May need authentication for some functions
```

## 📊 SUCCESS METRICS

### Quality Gates
- ✅ **0 lint errors** (`bun run lint:check`)
- ✅ **0 type errors** (`bun run build`)
- ✅ **100% tests pass** (`bun run test:coverage`)
- ✅ **Clean deployment** (Railway status: healthy)
- ✅ **Backend functions accessible** (Convex CLI tests)

### Performance Benchmarks
- 🚀 **Page load**: < 3 seconds
- 🚀 **Route transitions**: < 500ms
- 🚀 **API responses**: < 1 second
- 🚀 **Build time**: < 2 minutes

### Reliability Indicators
- 🟢 **All phases pass without intervention**
- 🟢 **No manual environment fixes needed**
- 🟢 **End-to-end workflows functional**
- 🟢 **No console errors in production**

---

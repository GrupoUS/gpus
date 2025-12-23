# Zed Debug Configurations

This directory contains Zed debugger configurations for the Portal Grupo US project.

## Available Configurations

### 📊 Convex Backend

- **Convex: Debug Functions** - Start Convex development server with file watching
- **Convex: Run Specific Function** - Execute a specific Convex function for debugging (requires function name as argument)

### 🎨 Frontend Development

- **Vite: Development Server** - Start Vite dev server on port 5173
- **Vite: Debug Mode** - Start Vite with Node.js inspector enabled

### 🧪 Testing

- **Tests: Run Vitest** - Execute test suite with verbose output
- **Tests: Vitest Watch Mode** - Run tests in watch mode for development
- **Tests: Vitest with Coverage** - Run tests with coverage report
- **Tests: Run Playwright E2E** - Execute E2E tests with headed browser
- **Tests: Playwright Debug Mode** - Debug Playwright tests with extended timeout
- **Tests: Playwright UI Mode** - Run tests with Playwright UI

### 🔍 Quality Control

- **QA: Build Check** - Validate production build
- **QA: Lint Check** - Run Biome linting without auto-fix
- **QA: Full Quality Pipeline** - Execute complete QA pipeline (lint → build → test)

### 🚀 Deployment

- **Deploy: Railway Debug** - Monitor Railway deployment logs
- **Deploy: Convex Debug** - Monitor Convex deployment logs

### 🎯 Component Development

- **Debug: Component Storybook** - Start Storybook for component development

### 🔧 MCP Debugging

- **MCP: Serena Debug Mode** - Enable MCP debugging with Serena tool

## Usage

1. Open the command palette in Zed (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Type "Debug: " and select from the list
3. The debugger will launch with the specified configuration

## Environment Variables

Configurations automatically use environment variables from `.env.local`:
- `VITE_CONVEX_URL` - Convex backend URL
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk authentication key
- `CONVEX_DEPLOYMENT` - Convex deployment identifier

## Custom Scripts

### Convex Function Runner
Run specific Convex functions for debugging:
```bash
bun debug/convex-runner.js api.leads.list '{"stage": "novo"}'
```

### MCP Debug Mode
Debug with MCP tools:
```bash
bun run debug:mcp serena debug
```

## Notes

- All configurations use `node` adapter as they run through Bun/Node.js
- Most configurations are hidden (`presentation: "hidden"`) as they're terminal-based
- Terminal output is integrated into Zed's panel (`console: "integratedTerminal"`)
- Environment-specific configurations use the `NODE_ENV` variable

## Troubleshooting

If a configuration doesn't work:

1. Check if the required packages are installed (`bun install`)
2. Verify environment variables in `.env.local`
3. Ensure Convex functions are properly exported
4. Check Zed's debug console for error messages

## Documentation

- [Zed Debugger Documentation](https://zed.dev/docs/debugger)
- [QA Command Reference](../.opencode/command/qa.md)
- [Testing Command Reference](../.opencode/command/test.md)
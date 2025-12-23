# Bundle Optimization Guide

## Last Updated: 2024-12-17

## Overview

The Portal Grupo US project uses Vite manual chunking to optimize bundle sizes and avoid the 1000KB warning threshold.

## Current Chunk Configuration

Located in `vite.config.ts` under `build.rollupOptions.output.manualChunks`:

| Chunk Name | Libraries | Approx Size |
|------------|-----------|-------------|
| `vendor` | react, react-dom, @tanstack/react-router, @tanstack/react-query | ~88 KB |
| `ui` | @radix-ui/*, lucide-react, sonner, date-fns | ~275 KB |
| `forms` | react-hook-form, @hookform/resolvers, zod | ~87 KB |
| `charts` | recharts | ~372 KB |
| `auth` | @clerk/clerk-react | ~79 KB |
| `backend` | convex, convex/react | ~69 KB |
| `animation` | framer-motion | ~123 KB |
| **index (main)** | Application code | ~800 KB |

## Why This Matters

- Vite warns when any chunk exceeds 1000KB (1MB)
- Code splitting improves initial load time
- Chunks can be cached independently by browsers
- Main bundle should contain only application-specific code

## When to Update

Add new chunks when:
1. A new large dependency (>50KB) is added
2. Main bundle exceeds 1000KB
3. Related libraries can be grouped together

## Commands

```bash
# Build with size analysis
bun run build

# Check for bundle warnings
bun run build 2>&1 | grep -i "warning\|exceed"
```

## Historical Changes

### 2024-12-17
- Added `charts` chunk for recharts (371.95 KB)
- Added `auth` chunk for @clerk/clerk-react (79.19 KB)
- Added `backend` chunk for convex (68.78 KB)
- Added `animation` chunk for framer-motion (123.24 KB)
- **Result**: Main bundle reduced from 1.4MB to 800KB (43% reduction)

## Future Optimization Options

If bundle size grows again:
1. **Lazy Loading Routes**: Use React.lazy() for heavy pages (dashboard, reports, CRM)
2. **Dynamic Imports**: Load charts/animations only when needed
3. **Tree Shaking**: Ensure imports are specific (not `import * from`)
4. **Analyze Bundle**: Use `npx vite-bundle-analyzer` for detailed breakdown

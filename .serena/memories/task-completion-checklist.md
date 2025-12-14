# Task Completion Checklist

## Before Creating PR

### Code Quality
- [ ] All tests pass (`bun run test`)
- [ ] No linting errors (`bun run lint:check`)
- [ ] Type checking passes (`bun run build`)
- [ ] Code formatted (`bun run lint`)

### Functionality
- [ ] No console errors in browser
- [ ] Responsive design tested (mobile + desktop)
- [ ] All forms validate properly
- [ ] Loading states implemented for async operations
- [ ] Error handling implemented (try/catch, toast notifications)
- [ ] Accessibility checks passed (ARIA labels, keyboard navigation)

### Performance
- [ ] No unnecessary re-renders (useMemo, useCallback where needed)
- [ ] Images optimized (lazy loading)
- [ ] Bundle size checked (avoid large imports)
- [ ] Convex queries optimized (indexes defined)

### Security
- [ ] No sensitive data in client-side code
- [ ] API routes protected (authentication)
- [ ] Input validation on all forms
- [ ] No console.log left in production code

### Testing
- [ ] Unit tests written for new functions
- [ ] Integration tests for user flows
- [ ] Edge cases tested (empty states, errors)
- [ ] Coverage meets minimum standards

## After Task Completion

### Git Workflow
```bash
# 1. Check what changed
git status
git diff

# 2. Stage relevant files
git add src/components/new-feature.tsx
git add convex/schema.ts
git add docs/new-feature.md

# 3. Commit with conventional message
git commit -m "feat: add new CRM lead filtering feature

- Add status filter to pipeline
- Update Convex schema with new index
- Implement filter UI with shadcn components
- Add tests for filter functionality

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>"

# 4. Check current branch
git branch

# 5. Push to remote if ready
git push origin feature/branch-name
```

### Documentation (if needed)
- [ ] Update README.md with new features
- [ ] Add comments to complex code
- [ ] Update AGENTS.md in relevant directories

### Deployment Steps
```bash
# 1. Deploy Convex backend
bun run deploy:convex

# 2. Check Convex deployment
bunx convex dashboard

# 3. Frontend deployment (automatic on push to main)
git checkout main
git merge feature/branch-name
git push origin main
```

## Common Last Checks

### Browser DevTools
- [ ] Network tab: No failed requests
- [ ] Console: No errors or warnings
- [ ] Elements: Responsive design breakpoints

### Mobile Testing
- [ ] Test on actual device (not just simulator)
- [ ] Touch interactions work
- [ ] Sidebar collapses properly
- [ ] All modals/dialogs fit screen

### Data Flow
- [ ] Convex mutations create/update correctly
- [ ] Real-time subscriptions work
- [ ] Optimistic updates implemented
- [ ] Cache invalidation handled

### Edge Cases
- [ ] Empty data states handled
- [ ] Network errors show user-friendly messages
- [ ] Large datasets paginate or virtualize
- [ ] Concurrent operations don't conflict

## Quick Commands Before Finalizing

```bash
# Full quality check
bun run lint:check && bun run test && bun run build

# Check only staged changes
git diff --cached --stat

# Look for TODOs or FIXMEs
rg -n "TODO|FIXME|HACK|XXX" src/
```

## Rollback Plan (if issues arise)

```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo commit and changes
git reset --hard HEAD~1

# Go back to specific commit
git checkout [commit-hash]

# Revert merge
git revert -m 1 [merge-commit-hash]
```
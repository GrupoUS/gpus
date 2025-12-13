## Fix Calendar DnD Context Error Following Reference Implementation

**Analysis**: After examining the reference implementation from origin-space/ui-experiments, I can see the correct pattern for implementing `useDndMonitor` with `DragOverlay`. The issue is that our current implementation calls `useDndMonitor` at the component level, but it needs to be called within a child component of `<DndContext>`.

**Solution**: Refactor to follow the reference pattern:
1. **Create a `CalendarDndProvider` component** that wraps the entire calendar with `DndContext`
2. **Move all drag-and-drop logic** into this provider component
3. **Use the provider pattern** to share DnD state across components
4. **Remove direct `useDndMonitor` usage** from the main component

**Key changes**:
1. **Create `CalendarDndProvider`** similar to reference implementation
2. **Wrap calendar content** with this provider
3. **Move drag handlers and overlay** into the provider
4. **Update component structure** to follow the reference pattern

**Files to modify**:
- `src/components/ui/event-calendar/event-calendar.tsx` - Main refactor
- Possibly create `src/components/ui/event-calendar/calendar-dnd-provider.tsx` - New provider component

**Expected outcome**: Calendar will work correctly with drag-and-drop functionality and overlay, following the proven pattern from the reference implementation.
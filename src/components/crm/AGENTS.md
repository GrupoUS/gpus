# CRM Components

This directory contains components for the CRM (Customer Relationship Management) module.

## Core Components

- `lead-detail.tsx`: Main sheet component displaying lead details, timeline, notes, and objections.
- `lead-filters.tsx`: Filter component for the lead pipeline.
- `pipeline-kanban.tsx`: Kanban board for visualizing and managing leads by stage.
- `lead-form.tsx`: Form for creating and editing leads.

## Tags System

We implement a flexible tagging system for leads.

- `tag-section.tsx`: Container for the tags interface in `LeadDetail`.
- `tag-autocomplete.tsx`: Command-based autocomplete for searching and creating tags.
- `tag-badge.tsx`: Visual representation of a tag with remove functionality.

### Usage
```tsx
<TagSection leadId={leadId} />
```

## Objections System

We provide a system to track and resolve sales objections.

- `objections-tab.tsx`: Main tab content for managing objections.
- `objections-list.tsx`: Displays a chronological list of objections.
- `objection-form.tsx`: Inline form for adding or editing objections.

### Usage
```tsx
<ObjectionsTab leadId={leadId} />
```

## Dependencies

- **Convex**: All data fetching and mutations via `convex/react`.
- **Shadcn UI**: Uses `Command`, `Popover`, `Badge`, `Sheet`, `Tabs`, `Button`, `Textarea`.
- **Lucide React**: Icons (`Tag`, `Check`, `Plus`, `X`, etc.).

## Notes

- Tags supports optimistic updates via Convex.
- Objections are secured: only creators and admins can edit/delete.

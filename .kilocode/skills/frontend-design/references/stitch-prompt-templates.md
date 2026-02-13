# Stitch Prompt Templates

> Ready-to-use prompt templates adapted to the GPUS theme (Navy/Gold palette).
> Copy, customize the `[placeholders]`, and send to `mcp_stitch_generate_screen_from_text`.

---

## Template: Dashboard Page

```markdown
A professional performance dashboard for a mentorship platform.
Clean, data-rich layout with generous whitespace and subtle depth.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, Desktop-first
- Theme: Dark, sophisticated, with warm gold accents
- Background: Deep Navy (#0a0f1c) for page background
- Surface: Dark Surface (#111827) for cards and containers
- Primary Accent: Electric Gold (#f5a623) for highlights and CTAs
- Secondary Accent: Muted Teal (#2dd4bf) for charts and positive metrics
- Text Primary: Off-White (#f9fafb) for headings
- Text Secondary: Cool Gray (#9ca3af) for labels and descriptions
- Destructive: Soft Red (#ef4444) for negative metrics and alerts
- Buttons: Subtly rounded (8px), gold accent for primary, outline for secondary
- Cards: Rounded (12px), dark surface, whisper-soft shadow for elevation
- Border: Faint (#1f2937) for card separators

**Page Structure:**
1. **Header:** Logo, breadcrumbs, notification bell, user avatar dropdown
2. **KPI Cards Row:** [Number] metric cards showing [metric names] with trend arrows
3. **Charts Section:** [Chart type] chart showing [data description]
4. **Data Table:** [Table description] with sortable columns and row actions
5. **Footer:** Minimal status bar
```

---

## Template: Settings / Form Page

```markdown
A clean settings page for a mentorship platform.
Minimal, organized with clear section groupings and inline validation.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, Desktop-first
- Theme: Dark, minimal, professional
- Background: Deep Navy (#0a0f1c)
- Surface: Dark Surface (#111827) for form cards
- Primary Accent: Electric Gold (#f5a623) for save buttons and active states
- Text Primary: Off-White (#f9fafb) for section headings
- Text Secondary: Cool Gray (#9ca3af) for input labels
- Input Background: Darker Surface (#0d1117) with faint border (#1f2937)
- Buttons: Gold primary "Save", outline "Cancel", rounded (8px)
- Cards: Rounded (12px), grouped by section with subtle dividers

**Page Structure:**
1. **Header:** Page title "Settings", breadcrumbs
2. **Profile Section:** Avatar upload, name, email fields
3. **Preferences Section:** [Preference options with toggles]
4. **Notification Section:** Email/push notification toggles
5. **Danger Zone:** Account deletion with red destructive button
6. **Sticky Footer:** Save/Cancel buttons, fixed at bottom
```

---

## Template: Data Table Page

```markdown
A data management page showing a filterable, sortable table.
Dense but readable, with clear hierarchy and interactive elements.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, Desktop-first
- Theme: Dark, utilitarian, data-focused
- Background: Deep Navy (#0a0f1c)
- Surface: Dark Surface (#111827) for table container
- Primary Accent: Electric Gold (#f5a623) for action buttons
- Text Primary: Off-White (#f9fafb) for column headers
- Text Secondary: Cool Gray (#9ca3af) for cell content
- Row Hover: Slightly lighter (#1a2332)
- Status Badges: Teal (#2dd4bf) for active, Gray (#6b7280) for inactive, Red (#ef4444) for critical
- Buttons: Small, rounded (6px), icon-only for row actions

**Page Structure:**
1. **Header:** Page title, search bar, filter dropdowns, "Add New" button
2. **Table:** [Column names] with sortable headers
3. **Row Actions:** Edit, delete, view details (icon buttons)
4. **Pagination:** Page numbers, items per page selector
5. **Empty State:** Illustration + "No [items] found" message
```

---

## Template: Component Edit/Modify

For editing an existing Stitch screen — targeted changes only:

```markdown
[Describe the specific change to make]

**Specific changes:**
- Location: [Where in the existing design]
- Style: [Visual properties — shape, color, size]
- Behavior: [Interactive behavior if applicable]

**Context:**
This is a targeted edit. Make only this change while preserving all existing elements.
```

**Example:**

```markdown
Add a notification bell icon to the header navigation.

**Specific changes:**
- Location: Header, right side before user avatar
- Style: Bell icon with badge counter, gold (#f5a623) badge for unread
- Behavior: Dropdown panel on click showing recent notifications

**Context:**
This is a targeted edit. Make only this change while preserving all existing elements.
```

---

## Template: CRM / Kanban Board

```markdown
A CRM kanban board for lead management in a mentorship platform.
Interactive, colorful columns with draggable cards.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, Desktop-first
- Theme: Dark, dynamic, interactive
- Background: Deep Navy (#0a0f1c)
- Column Background: Darker Surface (#0d1117) with faint top border as column accent
- Column Accents: Different color per column (Blue #3b82f6, Gold #f5a623, Green #22c55e, Red #ef4444)
- Cards: Dark Surface (#111827), rounded (10px), subtle shadow on hover
- Text Primary: Off-White (#f9fafb) for card titles
- Text Secondary: Cool Gray (#9ca3af) for card metadata
- Drag Handle: Faint dots pattern, visible on hover

**Page Structure:**
1. **Header:** "CRM" title, search bar, "Add Lead" button
2. **Column Headers:** Column name, card count, color accent bar
3. **Kanban Columns:** Horizontal scrollable, [column names]
4. **Lead Cards:** Name, contact info, value, last interaction date
5. **Quick Actions:** Right-click menu on cards for status change
```

---

## Template: Patient/Record Detail Page

```markdown
A detailed patient record page for a health mentorship platform.
Clean medical-grade layout with clear information hierarchy.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, Desktop-first
- Theme: Dark, clinical, organized
- Background: Deep Navy (#0a0f1c)
- Surface: Dark Surface (#111827) for information cards
- Primary Accent: Electric Gold (#f5a623) for action buttons
- Info Accent: Calm Blue (#3b82f6) for informational badges
- Success: Teal (#2dd4bf) for completed/positive status
- Warning: Amber (#f59e0b) for pending items
- Text Primary: Off-White (#f9fafb) for patient name and headings
- Text Secondary: Cool Gray (#9ca3af) for field labels

**Page Structure:**
1. **Header:** Back button, patient name, status badge, action buttons
2. **Patient Summary:** Photo, key info (age, contact), tags
3. **Tabs:** Medical Info | Procedures | Documents | Photos | AI Chat
4. **Tab Content:** [Content based on active tab]
5. **Sidebar:** Quick stats, upcoming appointments, notes
```

---

## Light Mode Variant

For any template above, swap the DESIGN SYSTEM block:

```markdown
**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, Desktop-first
- Theme: Light, clean, professional
- Background: Warm White (#fafafa)
- Surface: Pure White (#ffffff) for cards with soft shadow
- Primary Accent: Deep Navy (#0a0f1c) for primary buttons
- Secondary Accent: Electric Gold (#f5a623) for highlights
- Text Primary: Near Black (#111827) for headings
- Text Secondary: Medium Gray (#6b7280) for labels
- Border: Light Gray (#e5e7eb) for card borders
- Buttons: Rounded (8px), navy primary, outline secondary
- Cards: Rounded (12px), white, soft shadow (0 1px 3px rgba(0,0,0,0.1))
```

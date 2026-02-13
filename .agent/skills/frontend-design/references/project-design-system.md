# Neondash Project Design System

> Definitive reference for our GPUS theme tokens, component architecture, and page patterns.
> Source of truth: [`client/src/index.css`](file:///home/mauricio/neondash/client/src/index.css)

---

## GPUS Color Palette

### Light Mode

| Token | HSL | Hex | Purpose |
|-------|-----|-----|---------|
| `--background` | `210 40% 98%` | `#f8fafc` | Page background |
| `--foreground` | `203 65% 26%` | `#0f4c75` | Azul Petróleo text |
| `--primary` | `38 60% 45%` | — | GPUS Gold buttons/links |
| `--primary-foreground` | `0 0% 100%` | `#ffffff` | Text on gold |
| `--secondary` | `38 50% 85%` | — | Gold Light |
| `--accent` | `38 60% 95%` | — | Gold Accent highlights |
| `--muted` | `210 40% 96%` | — | Muted backgrounds |
| `--muted-foreground` | `215 25% 40%` | — | Muted text |
| `--destructive` | `0 84.2% 60.2%` | — | Error states |
| `--border` | `214 32% 91%` | — | Borders |
| `--ring` | `38 60% 45%` | — | Gold focus ring |

### Dark Mode

| Token | HSL | Hex | Purpose |
|-------|-----|-----|---------|
| `--background` | `222 47% 6%` | `#020617` | Deep Slate 950 |
| `--foreground` | `210 40% 98%` | — | Slate 50 text |
| `--primary` | `43 96% 56%` | `#fbbf24` | Glowing Gold (Amber 400) |
| `--primary-foreground` | `222 47% 10%` | — | Dark on gold |
| `--secondary` | `217 33% 17%` | — | Deep navy |
| `--accent` | `217 33% 17%` | — | Navy hover states |
| `--muted-foreground` | `215 20% 65%` | — | Slate 400 |
| `--border` | `217 33% 17%` | — | Slate 800 |
| `--ring` | `43 96% 56%` | — | Gold ring |

### Chart Colors

| Variable | Light | Dark | Color |
|----------|-------|------|-------|
| `--chart-1` | `38 60% 45%` | `43 96% 56%` | Gold |
| `--chart-2` | `142 76% 36%` | `217 91% 60%` | Green / Blue |
| `--chart-3` | `38 92% 50%` | `142 76% 36%` | Bright Gold / Green |
| `--chart-4` | `0 84% 60%` | `280 84% 60%` | Red / Purple |
| `--chart-5` | `217 91% 60%` | `0 84% 60%` | Blue / Red |

### Sidebar Colors

| Variable | Light | Dark |
|----------|-------|------|
| `--sidebar` | `0 0% 98%` | `222 47% 7%` |
| `--sidebar-primary` | `38 60% 45%` | `43 96% 56%` |
| `--sidebar-accent` | `38 60% 95%` | `217 33% 17%` |

---

## Brand Extensions

Custom color tokens beyond the semantic palette:

| Token | Light | Dark | Purpose |
|-------|-------|------|---------|
| `--color-neon-petroleo` | `#0f4c75` | `#0ea5e9` | Azul Petróleo brand |
| `--color-neon-petroleo-light` | `#3282b8` | `#38bdf8` | Light petróleo |
| `--color-neon-petroleo-dark` | `#1b262c` | `#0369a1` | Dark petróleo |
| `--color-neon-gold` | `#b45309` | `#fbbf24` | Gold brand |
| `--color-neon-gold-bright` | — | `#fcd34d` | Bright gold (dark only) |
| `--color-neon-blue-light` | — | `#64b5f6` | Light blue accent |
| `--color-neon-blue-highlight` | — | `#90caf9` | Highlight blue |

### Chat Theme

| Token | Value | Purpose |
|-------|-------|---------|
| `--color-chat-bubble-sent` | `#10b981` | Sent message bubble |
| `--color-chat-bubble-received` | `#334155` | Received message |
| `--color-chat-online` | `#10b981` | Online status |
| `--color-chat-ai-primary` | `#06b6d4` | AI chat accent |

---

## Custom Utility Classes

Defined in `index.css` via `@utility`:

| Class | CSS Property |
|-------|-------------|
| `bg-neon-blue-dark` | `background-color: var(--color-neon-blue-dark)` |
| `bg-neon-blue` | `background-color: var(--color-neon-blue)` |
| `bg-neon-gold` | `background-color: var(--color-neon-gold)` |
| `bg-neon-gray` | `background-color: var(--color-neon-gray-light)` |
| `text-neon-blue-dark` | `color: var(--color-neon-blue-dark)` |
| `text-neon-blue` | `color: var(--color-neon-blue)` |
| `text-neon-gold` | `color: var(--color-neon-gold)` |
| `text-neon-petroleo` | `color: var(--color-neon-petroleo)` |
| `text-neon-petroleo-light` | `color: var(--color-neon-petroleo-light)` |
| `text-neon-gold-bright` | `color: var(--color-neon-gold-bright)` |
| `text-neon-blue-light` | `color: var(--color-neon-blue-light)` |
| `border-neon-blue` | `border-color: var(--color-neon-blue)` |
| `border-neon-gold` | `border-color: var(--color-neon-gold)` |
| `border-neon-border` | `border-color: var(--color-neon-border)` |

---

## Typography

| Property | Value |
|----------|-------|
| **Font family** | `Manrope`, Inter, system-ui (via `@fontsource/manrope`) |
| **Mono** | `Fira Code`, JetBrains Mono |
| **Radius** | `0.5rem` (8px) base |
| **Border style** | `outline-ring/50` on all elements |

---

## Component Architecture

### Directory Structure

```
client/src/components/
├── ui/              # 86 shadcn/ui primitives (owned, not node_modules)
├── admin/           # Admin panel components
├── agenda/          # Calendar/scheduling
├── ai-chat/         # AI assistant chat
├── auth/            # Authentication flows
├── chat/            # WhatsApp/messaging
├── crm/             # CRM Kanban board (leads, pipeline)
├── dashboard/       # Dashboard KPI cards, charts
├── facebook-ads/    # Facebook Ads integration
├── financeiro/      # Financial management
├── instagram/       # Instagram integration
├── landing/         # Landing page sections
├── marketing/       # Marketing tools
├── mentor/          # Mentor impersonation
├── pacientes/       # Patient management
├── settings/        # Settings page cards
├── shared/          # Shared utilities
└── whatsapp/        # WhatsApp integration
```

### Core Layout Components

| Component | File | Purpose |
|-----------|------|---------|
| `DashboardLayout` | `DashboardLayout.tsx` | Main layout: sidebar + ScrollArea + header |
| `PageContainer` | `PageContainer.tsx` | Consistent page padding wrapper |
| `AdaptiveCard` | `AdaptiveCard.tsx` | Auto-adapting card with responsive sizing |
| `MonthYearFilter` | `MonthYearFilter.tsx` | Reusable month/year selector |
| `ErrorBoundary` | `ErrorBoundary.tsx` | React error boundary wrapper |

### Naming Conventions

| Pattern | Convention | Example |
|---------|-----------|---------|
| Page component | `PascalCase` + descriptive | `LeadsPage.tsx` |
| Feature component | `PascalCase` + feature prefix | `LeadDetailModal.tsx` |
| UI component | `PascalCase` (shadcn native) | `button.tsx`, `card.tsx` |
| Hook | `use` prefix | `useDebounce.ts` |
| Layout wrapper | `Layout` suffix | `DashboardLayout.tsx` |

---

## Page Design Patterns

### Dashboard (KPI Cards + Charts)

```
┌─────────────────────────────────────────┐
│ Header: Page title + MonthYearFilter    │
├────────┬────────┬────────┬──────────────┤
│ KPI 1  │ KPI 2  │ KPI 3  │ KPI 4        │
│ (Card) │ (Card) │ (Card) │ (Card)       │
├────────┴────────┴────────┴──────────────┤
│ Charts (Recharts 2) - Grid layout       │
│ ┌──────────────┐ ┌──────────────┐       │
│ │ Line Chart   │ │ Bar Chart    │       │
│ └──────────────┘ └──────────────┘       │
├─────────────────────────────────────────┤
│ Data Table (TanStack Table)             │
└─────────────────────────────────────────┘
```

- Grid: `grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6`
- Cards: `w-full` with responsive padding `p-4 lg:p-6`
- Use `ScrollArea` for main content scroll

### CRM Kanban

```
┌─────────────────────────────────────────┐
│ Header: Filters + Create Lead button    │
├──────┬──────┬──────┬──────┬─────────────┤
│ Col1 │ Col2 │ Col3 │ Col4 │ Col5        │
│ Lead │ Lead │ Lead │      │             │
│ Lead │      │      │      │             │
└──────┴──────┴──────┴──────┴─────────────┘
```

- Horizontal scroll with drag-and-drop
- Column headers with card count badges
- Lead cards with avatar, name, status

### Settings (Responsive Grid)

```
┌─────────────────────────────────────────┐
│ Settings Header                         │
├──────────────┬──────────────────────────┤
│ Profile Card │ Subscription Card        │
├──────────────┼──────────────────────────┤
│ AI Agent 1   │ AI Agent 2              │
├──────────────┼──────────────────────────┤
│ WhatsApp     │ Financial Coach         │
└──────────────┴──────────────────────────┘
```

- Grid: `grid grid-cols-1 lg:grid-cols-2 gap-6`
- All cards: `h-full` for equal height
- Framer Motion stagger animation on mount

### Patient Detail (Tabbed)

```
┌─────────────────────────────────────────┐
│ Patient Header: Avatar + Name + Status  │
├─────────────────────────────────────────┤
│ Tabs: Info | Medical | Procedures | ... │
├─────────────────────────────────────────┤
│ Tab Content (natural scroll)            │
└─────────────────────────────────────────┘
```

- Tab container with natural flow (NO `h-full` + `min-h-0`)
- Content scrolls via `ScrollArea` at page level

---

## Global CSS Rules

From `index.css` base layer:

```css
/* All interactive elements get cursor-pointer */
button:not(:disabled), [role="button"], a[href], select, input[type="checkbox"], input[type="radio"] {
  cursor-pointer;
}

/* Container: responsive padding + max-width */
.container {
  width: 100%; margin: 0 auto;
  padding: 1rem;           /* mobile */
  @sm: padding: 1.5rem;   /* tablet */
  @lg: padding: 2rem; max-width: 1280px; /* desktop */
}

/* Flex items: prevent overflow by default */
.flex { min-height: 0; min-width: 0; }
```

---

## Color Usage Rules

| ✅ Do | ❌ Don't |
|-------|---------|
| `bg-primary` | `bg-[#b45309]` |
| `text-foreground` | `text-[#0f172a]` |
| `border-border` | `border-gray-300` |
| `text-neon-petroleo` | `text-[#0f4c75]` |
| `bg-destructive` | `bg-red-500` |

**Rule:** Always use semantic tokens or custom utility classes. Never hardcode hex values.

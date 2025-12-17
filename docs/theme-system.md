# Theme System Documentation

## Overview
The Theme System provides:
- Light/Dark/System mode support
- Persistent preferences (localStorage)
- **View Transition API** animations (Circle Expand)
- WCAG 2.1 AA compliant colors
- Dropdown UI with active indicators

## Components

### ThemeProvider
Wraps the application to provide theme context.

```tsx
import { ThemeProvider } from "@/components/theme-provider"

export default function RootLayout({ children }) {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      {children}
    </ThemeProvider>
  )
}
```

### ThemeToggle
A dropdown component to switch themes.

```tsx
import { ThemeToggle } from "@/components/theme-toggle"

export function Navbar() {
  return (
    <nav>
      <ThemeToggle />
    </nav>
  )
}
```

### useTheme Hook
Access current theme state.

```tsx
import { useTheme } from "@/components/theme-provider"

const { theme, setTheme } = useTheme()
```

## View Transitions
The system automatically uses the View Transition API if supported.
To trigger a transition manually with the circular effect, use `useThemeTransition`:

```tsx
import { useThemeTransition } from "@/lib/theme-transitions"

const { animateThemeChange } = useThemeTransition()

const toggle = (e) => {
  animateThemeChange(
    "dark",
    () => setTheme("dark"),
    { x: e.clientX, y: e.clientY } // Optional: for circular reveal
  )
}
```

## Accessibility
- Colors are optimized for >4.5:1 contrast.
- `prefers-reduced-motion` will disable the View Transition animation.
- Semantic HTML and ARIA labels are used in the toggle.

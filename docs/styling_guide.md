# Physica AI — Styling Guide

## Design Language

Premium, academic, sophisticated. Feels closer to scientific publications and luxury editorial than typical startups.

## Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#020204` | Page / modal base |
| Surface | `#0c0c0e` | Cards, containers |
| Elevated | `rgba(255,255,255,0.04)` | Interactive surfaces |
| Border subtle | `rgba(255,255,255,0.08)` | Default borders |
| Border medium | `rgba(255,255,255,0.15)` | Hover/active borders |
| Text primary | `rgba(255,255,255,0.85)` | Body text |
| Text secondary | `rgba(255,255,255,0.55)` | Subtle text |
| Text muted | `rgba(255,255,255,0.32)` | Icon defaults |
| White hover | `#ffffff` | Hover backgrounds (inverts to dark) |
| Dark text | `#020204` | Text on white surfaces |

## Glassmorphism

```css
.glass {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.25),
    inset 0 -1px 1px rgba(0, 0, 0, 0.3),
    0 10px 25px rgba(0, 0, 0, 0.3);
}
```

## Animation Curve

All animations use Apple-style spring curve:

```css
cubic-bezier(0.16, 1, 0.3, 1)
```

## Typography

| Property | Value |
|----------|-------|
| Font family | `var(--font-sans)` (San Francisco stack) |
| Body size | `0.82rem` – `0.9rem` |
| Small | `0.78rem` |
| Headings | System font, semi-bold |

## Icon Colors

| State | Value |
|-------|-------|
| Default | `rgba(255, 255, 255, 0.32)` |
| Hover | `rgba(255, 255, 255, 0.75)` |
| Active (like) | `#f59e0b` (amber) |
| Active (dislike) | `#f87171` (coral) |
| Active (copy) | `#22c55e` (green) |
| Active (PDF) | `#60a5fa` (blue) |

## Animation Properties

- **Scale hover:** `transform: scale(1.12)`
- **Scale click:** `transform: scale(0.88)`
- **Transition:** `all 0.2s cubic-bezier(0.16, 1, 0.3, 1)`
- **GPU acceleration:** Use `transform: translateZ(0)` or `contain: paint` to promote layers

## CSS Architecture

- Component-specific CSS files co-located with components
- Global styles in `src/index.css` (`::selection`, base resets)
- No CSS-in-JS or CSS modules — plain CSS with BEM-like class names

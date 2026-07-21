# Physica AI — Accessibility

## Current State

Minimal accessibility considerations. The app is primarily a research tool for desktop use.

## Keyboard Navigation

- Composer input is focusable and supports standard keyboard input
- Modal close buttons are focusable
- No explicit tab order defined

## ARIA

- Not currently implemented
- Modal overlays lack `role="dialog"` and `aria-modal="true"`

## Recommendations

| Area | Improvement |
|------|-------------|
| Modals | Add `role="dialog"`, `aria-modal="true"`, focus trap, escape-to-close |
| Buttons | Add `aria-label` to icon-only buttons (close, send, actions) |
| Live regions | Add `aria-live="polite"` for streaming AI output |
| Color contrast | Verify contrast ratios for all text layers |
| Focus indicators | Ensure visible focus rings on all interactive elements |
| Reduced motion | Respect `prefers-reduced-motion` for animations |

# Physica AI — Contributing

## Code Style

- TypeScript strict mode
- Components co-located with their CSS files
- No CSS-in-JS or CSS modules — plain CSS with descriptive class names
- Use `motion/react` (not `framer-motion`) for all new animations
- Use `cubic-bezier(0.16, 1, 0.3, 1)` for custom animation curves
- GPU-accelerate with `transform`/`opacity` only (no animating `width`, `height`, `top`, `left`)

## Conventions

- Props: explicit TypeScript interfaces, no `any`
- State: lifted to `ChatPage.tsx` when shared across components
- CSS: BEM-like naming, `.component-name-element-state`
- Icons: inline SVGs (not icon font libraries for interactivity)
- Markdown: use `MarkdownRenderer` component, not raw `dangerouslySetInnerHTML`

## Model Name

The AI assistant is named **Jessie**. This name is used in system roles, documentation, and all user-facing references. Do not replace it.

## Pull Requests

- One feature per PR
- Update relevant docs in `docs/`
- Test manually before requesting review
- No secrets, API keys, or credentials in commits

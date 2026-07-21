# Physica AI — Routing

## Approach

Hash-based routing via `window.location.hash`. No React Router or external routing library.

## Routes

| Hash | Component | Description |
|------|-----------|-------------|
| (empty) | Landing Page | Marketing site with hero, features, CTA |
| `#chat` | Chat Page | Main research workspace |

## Implementation

Routing logic lives in `src/App.tsx`:

```ts
const [hash, setHash] = useState(window.location.hash);

useEffect(() => {
  const onHashChange = () => setHash(window.location.hash);
  window.addEventListener('popstate', onHashChange);
  return () => window.removeEventListener('popstate', onHashChange);
}, []);
```

## Navigation

- Landing page CTA buttons set `window.location.hash = '#chat'`
- "Go to Dashboard" in sidebar clears the hash (`window.location.hash = ''`)
- All navigation is client-side, no page reload

## Deep Linking

No deep link support. Chat sessions are not addressable by URL.

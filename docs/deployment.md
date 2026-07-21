# Physica AI — Deployment

## Build

```bash
npm run build
```

Runs `tsc -b` for type checking, then `vite build` for production bundle.

Output is in the `dist/` directory — a static site ready for any static host.

## Preview

```bash
npm run preview
```

Serves the production build locally for verification.

## Hosting

The app is a fully static client-side SPA. Compatible with:

- Vercel
- Netlify
- Cloudflare Pages
- GitHub Pages
- Any static file server

## Environment

Set the API key as an environment variable on the hosting platform.

## CI/CD

No CI/CD configured. Deployment is manual via build + upload.

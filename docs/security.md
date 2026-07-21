# Physica AI — Security

## API Key

- The API key is stored in `.env` (gitignored)
- Never commit `.env` or expose the key in client-side source code
- The key is accessed only via `import.meta.env.VITE_GEMINI_API_KEY`
- On production hosts, set the key as an environment variable (never in code)

## Data

- All user data lives in `localStorage` — no backend, no external transmission
- Chat messages and memories never leave the browser except during AI API calls
- No user authentication or accounts — no PII collected
- No cookies, tracking, or analytics

## Dependencies

- Dependencies are pinned in `package.json`
- Run `npm audit` regularly to check for vulnerabilities
- Only well-known, maintained packages are used

## Best Practices

- No `eval()`, `Function()`, or dynamic code execution
- Markdown rendering uses `MarkdownRenderer` (not `dangerouslySetInnerHTML` with raw HTML)
- User-provided text is always rendered through safe components

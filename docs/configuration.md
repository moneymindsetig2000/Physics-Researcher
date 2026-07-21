# Physica AI — Configuration

## Environment Variables

| Variable | Required | Source | Description |
|----------|----------|--------|-------------|
| `VITE_GEMINI_API_KEY` | Yes | `.env` | API key |

The `.env` file is gitignored and never committed.

## Application Config (`src/utils/ai/config.ts`)

| Constant | Default | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | `import.meta.env.VITE_GEMINI_API_KEY` | API key |
| `DEFAULT_TEMPERATURE` | `0.7` | Model temperature |
| `DEFAULT_TOP_P` | `0.90` | Nucleus sampling |
| `TOP_K` | `5` | Max memories in trace display |
| `RELEVANCE_THRESHOLD` | `0.55` | Minimum memory relevance score |
| `SEMANTIC_WEIGHT` | `0.7` | Embedding similarity weight |
| `KEYWORD_WEIGHT` | `0.3` | Keyword overlap weight |
| `IMPORTANCE_BOOST_FACTOR` | `50` | Importance score divisor |
| `RECENCY_WEIGHT` | `0.05` | Recency boost weight |
| `RECENCY_DECAY_DAYS` | `365` | Recency full decay period |
| `CANDIDATE_POOL_SIZE` | `10` | Max memories in candidate pool |
| `MAX_CONTEXT_MEMORIES` | `3` | Max memories in system context |

## Vite Config

All Vite settings in `vite.config.ts`. Key plugins:

- `@vitejs/plugin-react` — React Fast Refresh

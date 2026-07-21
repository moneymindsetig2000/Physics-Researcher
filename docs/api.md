# Physica AI — API Integration

## API Endpoints

| Endpoint | Method | Purpose | Method |
|----------|--------|---------|--------|
| `models/Jessie:streamGenerateContent?alt=sse` | POST | Main model streaming | Raw REST (`fetch`) |
| Embedding API | POST | Query/memory embedding | AI SDK |
| File API (`/files/upload`, `/files/{name}`) | POST, GET | PDF upload + status polling | AI SDK |

## Request Format (Streaming)

```json
{
  "contents": [{ "role": "user/model", "parts": [{ "text": "..." }] }],
  "systemInstruction": { "role": "system", "parts": [{ "text": "..." }] },
  "tools": [{ "webSearch": {} }],
  "generationConfig": {
    "thinkingConfig": { "thinkingLevel": "HIGH" },
    "temperature": 0.7,
    "topP": 0.90
  }
}
```

## Request Format (Embedding)

```json
{
  "model": "embedding-model",
  "content": { "parts": [{ "text": "..." }] }
}
```

## Key Headers

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer <key from .env>` |

## Fallback Behavior

- Web search grounding fails (500) → falls back to `useSearchTool = false`
- Streaming retries on: 500, 503, UNAVAILABLE, INTERNAL, RESOURCE_EXHAUSTED
- Memory search failure → proceeds without memory context
- PDF upload failure → skips file, continues with others

## Retry Strategy

| Layer | Retries | Delay | Trigger |
|-------|---------|-------|---------|
| Generic (`callWithRetry`) | 4 | 1500ms (doubles) | 500, 503, INTERNAL, UNAVAILABLE, RESOURCE_EXHAUSTED, 429 |
| Stream inner | 2 | 1000ms | Same |
| Stream outer loop | 3 | 1500ms | Any streaming error |
| Search fallback | 0 | Immediate | 500 on search request |

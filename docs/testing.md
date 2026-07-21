# Physica AI — Testing

## Current Status

No test suite is configured.

## Recommended Approach

| Type | Tool | Coverage |
|------|------|----------|
| Unit | Vitest | Utilities, pipeline functions, config |
| Component | Vitest + React Testing Library | Components, modals, message rendering |
| E2E | Playwright | Full chat flow, PDF upload, memory persistence |

## Areas to Test

- Pipeline memory ranking (`pipeline.ts`)
- Memory XML parsing (`gemini.ts` — `parseMemoryActionXml`)
- Message display (user vs AI, images, PDFs, markdown)
- Modal open/close (image preview, PDF preview)
- Selection toolbar appearance and dismissal
- Tagged text flow (select → tag → send)
- Retry and error handling in streaming

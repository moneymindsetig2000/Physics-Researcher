# Physica AI — Performance

## Current Optimizations

### Rendering

- `React.memo` on `MessageItem` with custom comparison to skip unnecessary re-renders
- `contain: paint` / `contain: strict` on modals and iframes to isolate paints
- `requestAnimationFrame` throttling on `selectionchange` handler to prevent layout thrashing

### CSS

- `backdrop-filter: blur()` used sparingly — removed from elements inside opaque containers
- `box-shadow` blur radii kept small (≤30px) to reduce GPU compositing cost
- Animations limited to `transform` and `opacity` only (GPU-composited, no layout/paint triggers)
- `contain` properties set on modals, viewers, and scrollable containers

### Streaming

- Server-sent events parsed with manual SSE generator
- Chunk throttled at 35ms intervals via `throttledOnChunk` to avoid React batching floods
- AbortController for clean mid-stream cancellation

## Recommended Optimizations

| Area | Suggestion |
|------|------------|
| Message list | Virtualization via `react-window` for long conversations |
| PDF rendering | Replace iframe with PDF.js canvas rendering |
| Bundle size | Dynamic import for Three.js, OGL, and other heavy deps |
| Image loading | Lazy loading (`loading="lazy"`) for attached images |
| Memory | Compress memory embeddings (Float32 → Float16 quantization) |

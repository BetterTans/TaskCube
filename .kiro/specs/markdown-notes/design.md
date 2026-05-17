# Design — Markdown 笔记

## Architecture
Use `marked` library (~20KB, minimal) + DOMPurify for sanitization.

```typescript
// utils/markdown.ts
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export function renderMarkdown(text: string): string {
  return DOMPurify.sanitize(marked.parse(text));
}
```

## UI
- Description area: toggle between edit/textarea and preview
- Toolbar: bold, italic, heading, list, code, link, todo
- Click toolbar → insert Markdown syntax around selection

## Markdown → Subtask sync (Phase 2)
- Parse `- [ ] task` in description
- Auto-create matching subtasks
- Checkbox toggle syncs both ways

## Data Compat
- description remains plain text string
- Old descriptions render as-is (no Markdown parse error)
- No schema change

# Design — 暗色模式完善

## Checkpoints
1. System inputs: `dark:color-scheme-dark` on all date/time inputs
2. Modals: Ensure all `dark:` variants on modal backgrounds
3. Scrollbar: CSS custom scrollbar with `@media (prefers-color-scheme: dark)`
4. Contrast: Audit all `text-gray-*` and `text-zinc-*` usage

## Scrollbar CSS
```css
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #d1d5db; border-radius: 3px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #52525b;
}
```

## Files
- Modify: All `.tsx` files with `<input type="date">` — add dark class
- Modify: `components/ConfirmDialog.tsx` — dark backdrop
- Modify: `components/ToastContainer.tsx` — dark toast
- Add to: `index.html` — scrollbar CSS

## Data Compat
- Pure visual. No impact.

# Design — 视图动画

## Approach
Tailwind v4 built-in `animate-in` utilities. No Framer Motion.

## Transitions
| View | Transition |
|------|-----------|
| 四象限 | `animate-in fade-in duration-200` |
| 月视图 | `animate-in zoom-in-95 fade-in duration-300` |
| 日视图 | `animate-in slide-in-from-right-4 fade-in duration-300` |
| 列表 | `animate-in fade-in duration-200` |

## Micro-interactions
- Task card: `hover:scale-[1.02] transition-transform duration-150`
- Toggle complete: CSS animation via `transition-opacity`
- Empty state: `animate-in fade-in` + pulse button

## Files
- Modify: `App.tsx` renderCurrentView (wrap in animated div)
- Modify: `components/FullCalendar.tsx` (task card hover)
- Modify: `components/MatrixView.tsx` (quadrant card hover)
- CSS: `index.html` (custom animation keyframes if needed)

## Data Compat
- Pure CSS/visual. No data impact.

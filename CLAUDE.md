# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NextDo is a React-based task management application with AI integration. It offers both web and desktop (Tauri) versions, using IndexedDB for local-first data storage with no cloud dependencies.

**Key Technologies:**
- React 19 with TypeScript
- Vite for build tooling
- IndexedDB (via Dexie.js) for local storage
- Tauri for desktop packaging
- TanStack Virtual for performance optimization
- Tailwind CSS for styling
- lucide-react for icons
- No cloud services - 100% local storage

**Current Version:** v3.4.0

## Version History

| Version | Highlights |
|---------|-----------|
| v3.4.0 | Design token unification, undo/redo, browser reminders, view transitions, dark mode polish |
| v3.3.0 | Panel/Modal merge (TaskEditorCore), global search, tag management, unified logger |
| v3.2.0 | Initial SDD spec system, calendar hub, filter fix |

## Prerequisites

**For Development & Desktop Builds:**
- Node.js 18+
- Run `npm install` to install dependencies

**For Web-only Usage:**
- Any local web server (see docs/QUICK_START.md for options)

## Key Commands

### Development
```bash
# Web development
npm run dev                    # Start Vite dev server (port 3000)
npm run build                  # Build production bundle
npm run preview                # Preview production build

# Desktop development (Tauri)
npm run tauri:dev             # Start both Vite dev server and Tauri
npm run tauri:build           # Build for current platform

# Desktop distribution builds
npm run tauri:build:mac       # Build macOS installer (.dmg)
npm run tauri:build:win       # Build Windows portable package (.zip)
npm run tauri:build:linux     # Build Linux packages
```

### Code Quality
```bash
# Dead code analysis (devDependencies)
npx depcheck                  # Check unused dependencies
npx knip                      # Find unused files, exports, and dependencies
npx ts-prune                  # Identify unused TypeScript exports

# TypeScript check
npx tsc --noEmit              # Type check without emitting files
```

## Architecture

### Modular Design Pattern
The codebase follows a modular architecture with clear separation:

- **Entry Points:**
  - `index.html` - Web entry point (see docs/QUICK_START.md for server requirements)
  - `src-tauri/src/main.rs` - Desktop entry point (Rust)
  - `src-tauri/tauri.conf.json` - Tauri configuration
  - `App.tsx` - Main React application root

- **Navigation & Layout:**
  - `components/ViewTabs.tsx` - Header tab bar for view switching (四象限/月视图/日视图/列表)
  - `components/Sidebar.tsx` - Filter sidebar (project/quadrant filters) + management entries
  - `components/FilterIndicator.tsx` - Active filter status banner for non-calendar views

- **Data Layer:**
  - `db.ts` - Database abstraction using Dexie.js over IndexedDB
  - `types.ts` - Shared TypeScript interfaces for all data models
  - Supports database migrations via Dexie version system (current: v5, includes `_meta` table for backup handles)

- **Service Layer:**
  - `services/aiService.ts` - AI integration and task processing
  - `services/recurringService.ts` - Recurring task logic
  - `services/autoBackup.ts` - Auto-backup with File System Access API + download fallback

- **Config Layer:**
  - `config/taskColors.ts` - Unified color mapping (priority, progress, quadrant, tag colors with light/dark variants)
  - `config/storageKeys.ts` - localStorage key constants
  - `config/defaultValues.ts` - Default settings values

- **Component Structure:**
  - `components/*.tsx` - 20+ React components organized by feature
  - Each view (Calendar, Timeline, Matrix, Table) is a separate component
  - Modal-based UI for detailed editing (TaskDetailModal, ProjectDetailModal)
  - CommandPalette for keyboard-driven navigation

- **Task Progress Feature:**
  - Added in database v4 with automatic migration
  - Six progress states: Initial, In Progress, On Hold, Blocked, Completed, Delayed
  - Displayed as colored badge pills in all views
  - Filterable in TableView
  - Compatible with import/export and backward compatible with v1.0 data

- **Unified Color System:**
  - Single source of truth in `config/taskColors.ts`
  - Priority: HIGH=red, MEDIUM=amber, LOW=sky
  - Progress: badge pills with light/dark variants
  - Quadrant: background tint (ISO style, no left border)
  - Tags: hash-based 10-color palette

- **Auto-Backup System:**
  - Two-tier strategy based on browser capability
  - Tier 1 (Windows Chrome/Edge): `showDirectoryPicker` auto-backup to local folder
  - Tier 2 (macOS Chrome/others): one-click download backup
  - 5s debounce on data changes + beforeunload final backup
  - Auto-restore from backup when IndexedDB empty on startup
  - `navigator.storage.persist()` requested on startup
  - Directory handle stored in IndexedDB `_meta` table (v5)
  - Toast notifications (z-[90]) + ConfirmDialog replace all alert/confirm

### Data Storage Strategy
The app implements a local-first approach with two deployment modes:

1. **Web Mode:**
   - Uses browser's IndexedDB
   - Vite dev server for development (`npm run dev`)
   - Requires local web server due to browser security
   - Data stored in browser profile (may be cleared)

2. **Desktop Mode (Tauri):**
   - Uses OS-specific user data directories
   - Persistent storage independent of browser
   - Windows: `%APPDATA%/com.nextdo.app/`
   - macOS: `~/Library/Application Support/com.nextdo.app/`
   - Linux: `~/.local/share/com.nextdo.app/`

### Build & Deployment
- **Package.json:** Set to ES modules (`"type": "module"`)
- **Tauri:** Rust backend with ES module frontend integration
- **Vite:** Configured for React with environment variable support
  - Path alias: `@` maps to project root (use `@/types.ts` for imports)
  - Build modes: default (web) vs `tauri` (uses `vite-tauri.html` entry)
- **tauri-bundler:** Generates installers for all platforms (`src-tauri/target/release/bundle/`)

### Windows Build Special Requirements
**WebView2 Runtime:** Windows builds embed the full WebView2 runtime (261MB) to ensure compatibility on systems without internet access:
- Uses `fixedRuntime` mode in `tauri.conf.json`
- Embeds Microsoft.WebView2.FixedVersionRuntime.144.0.3719.93.x64.cab
- Produces portable `.zip` package (268MB total)
- No installation required - extract and run

**Build output location:**
- Cross-compilation (macOS → Windows): `src-tauri/target/x86_64-pc-windows-gnu/release/`
- Native Windows build: `src-tauri/target/release/bundle/msi/` or `nsis/`

**Distribution files:**
- `nextdo.exe` - Main application (18MB)
- `webview2/` directory - Complete WebView2 runtime (261MB)
- Combined in `nextdo-windows-x64.zip` for easy distribution

## Critical Development Notes

### Module System Handling
The project uses ES modules (package.json: `"type": "module"`), and Tauri has a Rust backend with frontend in ES modules:
- Frontend uses Vite for bundling and development
- Rust backend handles platform-specific features and security
- IPC communication via Tauri's invoke API for desktop features

### Local-First Constraints
- No backend server or API calls (except user-configured AI endpoints)
- All data stored in IndexedDB
- Avoid external dependencies that require network
- Remove any `console.log(SECRET)` to prevent data leakage

### AI Integration
AI settings stored in local storage (not in repo):
- Base URL for AI API endpoint
- API key (user-provided)
- Model selection (defaults to gemini-1.5-flash)

## Testing

No automated test framework is currently configured. Manual testing is required for all changes.

## IDE Support

- **VS Code**: Install Live Server extension for easy web development
- **WebStorm**: Built-in support for opening index.html in browser
- **Other editors**: Any IDE with TypeScript support works well

## Design Token System

All components follow a unified Tailwind-native token system defined in `.kiro/specs/design-tokens/design.md`:

| Category | Light | Dark |
|----------|-------|------|
| Page bg | `#F7F7F7` | `#121217` (zinc-925) |
| Card/Surface | `bg-white` | `dark:bg-zinc-900` |
| Card border | `border-gray-200` | `dark:border-zinc-800` |
| Primary text | `text-gray-900` | `dark:text-white` |
| Body text | `text-gray-500` | `dark:text-zinc-400` |
| Muted/secondary | `text-gray-400` | `dark:text-zinc-500` |
| Primary button | `bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl` | same |
| Danger/Delete | `text-red-500 hover:bg-red-50` | `dark:hover:bg-red-900/20` |
| Input bg | `bg-gray-50` | `dark:bg-zinc-800/50` |
| Input focus | `focus:border-indigo-300` | `dark:focus:border-indigo-600` |

**Rules:** No `shadow-md`/`shadow-lg` on buttons, no decorative `backdrop-blur`, `dark:` text always zinc (never gray), `font-semibold` for section labels (never `font-bold`), `rounded-xl` for buttons/cards.

## Feature Inventory (v3.4)

| Feature | Component/File |
|---------|---------------|
| Four-quadrant view | `MatrixView.tsx` |
| Calendar month view | `FullCalendar.tsx` |
| Day/time view with drag | `DayTimeView.tsx` |
| Table view with filters | `TableView.tsx` |
| Task editor (Panel + Modal) | `TaskDetailPanel.tsx`, `TaskDetailModal.tsx` → shared `TaskEditorCore.tsx` |
| Global search (⌘K) | `CommandPalette.tsx` + `hooks/useSearchIndex.ts` |
| Tag management | `TagsManager.tsx` (in Settings) |
| Recurring tasks | `RecurringManager.tsx`, `RecurringOptions.tsx` |
| Undo/Redo (Ctrl+Z) | `hooks/useUndoStack.ts` |
| Browser notifications | `services/reminderService.ts` |
| AI task breakdown | `services/aiService.ts` |
| Auto-backup | `services/autoBackup.ts` |
| Project management | `ProjectDetailModal.tsx`, `ProjectListModal.tsx` |
| Event popover | `EventPopover.tsx` |
| Unified logger | `utils/logger.ts` |

## Spec-Driven Development

All features follow Kiro-style SDD with specs in `.kiro/specs/<feature>/`:

```
requirements.md → design.md → tasks.md → implementation → verification
```

Active specs: `design-tokens` (implemented), `calendar-hub` (done), `filter-fix-and-polish` (done).
Level 1-2 complete (9 specs implemented). Level 3 deferred (see `evolution-roadmap`).

## Testing Distribution Builds

When creating desktop builds, always test the installer before distribution to catch module loading errors early.

## Troubleshooting

**Quick fixes:**
- Module errors: `rm -rf node_modules && npm install`
- Tauri build fails: Check Rust toolchain and system dependencies (Linux needs libgtk-3-dev, libwebkit2gtk-4.0-dev)
- IndexedDB issues: Clear browser data or check desktop app's user data directory permissions

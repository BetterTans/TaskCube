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
- Zero-build architecture using native ES modules and `esm.sh/run`

**Current Version:** v3.1.2

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

## Architecture

### Modular Design Pattern
The codebase follows a modular architecture with clear separation:

- **Entry Points:**
  - `index.html` - Web entry point (see docs/QUICK_START.md for server requirements)
  - `src-tauri/src/main.rs` - Desktop entry point (Rust)
  - `src-tauri/tauri.conf.json` - Tauri configuration
  - `App.tsx` - Main React application root

- **Data Layer:**
  - `db.ts` - Database abstraction using Dexie.js over IndexedDB
  - `types.ts` - Shared TypeScript interfaces for all data models
  - Supports database migrations via Dexie version system (current: v4)

- **Service Layer:**
  - `services/aiService.ts` - AI integration and task processing
  - `services/recurringService.ts` - Recurring task logic

- **Component Structure:"
  - `components/*.tsx` - 20+ React components organized by feature
  - Each view (Calendar, Timeline, Matrix, Table) is a separate component
  - Modal-based UI for detailed editing (TaskDetailModal, ProjectDetailModal)
  - CommandPalette for keyboard-driven navigation

- **Task Progress Feature:**
  - Added in database v4 with automatic migration
  - Six progress states: Initial, In Progress, On Hold, Blocked, Completed, Delayed
  - Editable in TaskDetailModal with dropdown selector
  - Displayed in all views (Table, Calendar, Matrix, DayTimeView)
  - Filterable in TableView
  - Compatible with import/export and backward compatible with v1.0 data

### Data Storage Strategy
The app implements a local-first approach with two deployment modes:

1. **Web Mode (Zero-Build):**
   - Uses browser's IndexedDB
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
- Frontend remains pure ES modules with zero-build architecture
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

## Testing Distribution Builds
The repository includes test scripts for verifying installer builds:
- `test-installer.sh` - Validates Windows installer functionality
- `pack.sh` - Handles build packaging and validation

When creating desktop builds, always test the installer before distribution to catch module loading errors early.

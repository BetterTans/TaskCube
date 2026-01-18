# TaskCube - Your Private, AI-Powered Task Hub

TaskCube is a modern, local-first to-do application built with React 19. It combines an elegant, keyboard-driven interface with the power of a flexible AI assistant, ensuring your data remains private and your workflow is lightning-fast.

<!-- ![TaskCube Interface Screenshot](placeholder.png) -->

**Latest Version: v2.5**

## 💡 Why TaskCube?

*   **🔒 Local First & Private**: Your tasks, projects, and notes are stored directly on your device using IndexedDB. No cloud, no sign-ups, no data collection.
*   **🤖 Bring Your Own AI**: You are in control. Connect to any OpenAI-compatible API—be it OpenAI, Google Gemini, a self-hosted local model, or any other provider.
*   **⚡️ Built for Speed**: Inspired by professional developer tools, TaskCube is designed for keyboard-first operation. With a global command palette and customizable hotkeys, you'll fly through your tasks.
*   **✨ Visually Intuitive**: Switch between a powerful infinite-scroll calendar, a detailed daily timeline, or a versatile table view to manage your work the way you want.

---

## ✨ Key Features

### 🚀 Efficiency & Workflow
*   **Command Palette**: Press `Cmd/Ctrl + K` anywhere to instantly search tasks, create new ones, switch views, or access any core feature without touching your mouse.
*   **Customizable Keyboard Shortcuts**: Assign your own hotkeys for actions like "New Task" (`N`), "Go to Today" (`T`), and more for a truly personalized experience.
*   **Inline Table Editing**: Quickly modify task properties like priority, project, and due date directly within the list view, minimizing clicks and interruptions.

### 🧠 Flexible AI Assistant
*   **Model Agnostic Engine**: Configure your preferred AI provider in the settings. Just enter your API Base URL, Key, and Model Name.
*   **Natural Language Input**: Type "Schedule a team meeting tomorrow at 10am" and let the AI automatically parse the title, date, and time.
*   **Smart Task Breakdown**: Turn a complex task like "Launch new marketing campaign" into actionable sub-tasks with a single click.
*   **AI Project Planner**: Kickstart new projects by having the AI generate an initial list of key tasks and milestones.

### 🗂️ Powerful Organization
*   **Multiple Views**: Seamlessly switch between a feature-rich **Month Calendar** (with multi-day events), a focused **Day Timeline**, and a data-rich **Table View**.
*   **Project Management**: Group tasks into projects, track progress with a visual bar, and keep a log of important updates.
*   **Advanced Recurring Tasks**: Set up tasks that repeat daily, weekly, monthly, or at custom intervals.
*   **Tags, Priorities & Quadrants**: Organize your work with custom tags, Low/Medium/High priorities, and the Eisenhower Matrix (Important/Urgent).

---

## 🛠️ Technical Stack

*   **Framework**: React 19
*   **Language**: TypeScript
*   **Database**: **Dexie.js (IndexedDB)** for robust, local-first storage.
*   **Styling**: Tailwind CSS for a utility-first, modern design.
*   **Icons**: Lucide React for crisp, beautiful icons.

---

## 🚀 Getting Started (Web)

1.  **No installation needed**: The app runs directly in the browser using ES Modules.
2.  **Run Locally**:
    *   Use a simple web server. If you have VS Code, the `Live Server` extension is perfect.
    *   Alternatively, using Python: `python3 -m http.server 8000`
3.  **Configure AI**:
    *   Open the app and click the **Settings (⚙️)** icon.
    *   Enter your AI provider's **Base URL**, **API Key**, and **Model Name**. This works with any OpenAI-compatible endpoint.

## 📦 Desktop App (Electron)

For a more permanent, browser-independent experience, you can package TaskCube as a desktop application. This ensures your data is safely stored in your user directory.

See the full guide: [ELECTRON_GUIDE.md](./ELECTRON_GUIDE.md)

## 🗺️ Roadmap

Curious about what's next? Check out our public [ROADMAP.md](./ROADMAP.md) to see upcoming features like drag-and-drop scheduling, task dependencies, and more!

## 📝 License

MIT License
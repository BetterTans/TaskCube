# NextDo - 你的私人 AI 智能任务中心

NextDo 是一款使用 React 构建的现代化、本地优先的待办事项应用。它将优雅的、以键盘为中心的操作界面与灵活强大的 AI 助手相结合，确保您的数据安全私密，工作流程迅捷高效。

**当前版本: v3.2.0**

## 💡 为什么选择 NextDo?

*   **🔒 本地优先 & 隐私安全**: 你的任务、项目和笔记都直接存储在你的设备上（使用 IndexedDB）。没有云端，无需注册，不收集任何数据。
*   **🤖 自定义 AI 模型**: 你拥有完全的控制权。你可以连接到任何兼容 OpenAI 接口的 API——无论是 OpenAI 官方、Google Gemini、自托管的本地模型，还是任何其他供应商。
*   **⚡️ 为效率而生**: 设计灵感源于专业开发者工具。通过全局指令面板 (`Cmd/Ctrl+K`) 和可自定义的热键，你将能行云流水般地处理任务。
*   **✨ 直观的可视化**: 通过四个强大的、相互关联的视图（日历、时间轴、四象限看板、列表）来管理你的工作。

---

## ✨ 核心功能

### 🧠 灵活的 AI 助手
*   **自然语言输入**: 输入"明天上午10点安排一个团队会议"，AI 将自动解析出标题、日期和时间。
*   **智能任务拆解**: 一键将复杂任务拆解为可执行的子任务。
*   **AI 项目规划**: 自动生成关键任务和里程碑。

### 🗂️ 强大的组织能力
*   **顶部视图切换**: 四象限、月视图、日视图、列表——通过 Header Tab 栏一键切换，清晰直观。
*   **智能筛选系统**: 侧边栏支持按项目和象限全局筛选，在所有视图中保持一致，非月视图显示筛选指示条。
*   **任务依赖关系**: 设置任务的前后置关系，被阻塞的任务将自动显示锁定图标。
*   **无限滚动视图**: 包含无限滚动的月历和每日 24h 时间轴，支持拖拽任务以快速排期。
*   **四象限看板**: 基于艾森豪威尔矩阵（重要/紧急）自动分类，支持拖拽调整。
*   **高性能列表**: 使用虚拟化技术，即使处理上千个任务也能保持极致流畅。

---

## 🚀 快速启动

### Web 开发

```bash
npm install          # 安装依赖
npm run dev          # 启动 Vite 开发服务器（端口 3000）
npm run build        # 构建生产版本
npm run preview      # 预览构建结果
```

### Tauri 桌面应用

```bash
npm run tauri:dev           # 启动开发环境
npm run tauri:build         # 构建当前平台安装包
npm run tauri:build:mac     # 构建 macOS .dmg
npm run tauri:build:win     # 构建 Windows 安装包
npm run tauri:build:linux   # 构建 Linux AppImage
```

---

## 🛠️ 技术栈

*   **前端**: React 19 + TypeScript
*   **构建**: Vite
*   **样式**: Tailwind CSS v4
*   **存储**: Dexie.js (IndexedDB)
*   **桌面**: Tauri (Rust)
*   **性能**: TanStack Virtual (列表虚拟化)
*   **图标**: lucide-react

---

## 📚 文档中心

*   **[快速入门](./docs/QUICK_START.md)**: 开发和部署指南
*   **[演进路线图](./.kiro/specs/evolution-roadmap/requirements.md)**: v3.2 → v4.0 SDD 规约
*   **[SDD Specs](./.kiro/specs/)**: 12 个特性规约（需求→设计→任务）
*   **[打包指南](./docs/PACKAGING.md)**: 桌面应用打包和分发
*   **[贡献指南](./docs/CONTRIB.md)**: 开发环境和工作流
*   **[任务进展功能](./docs/PROGRESS_FEATURE.md)**: 任务进展跟踪功能说明
*   **[产品路线图](./docs/ROADMAP.md)**: 开发计划和里程碑
*   **[Bug 修复日志](./docs/BUG_FIX_LOG.md)**: 已解决的问题记录

## 📝 许可证
MIT License
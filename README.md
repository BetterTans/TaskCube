# TaskCube - 你的私人 AI 智能任务中心

![Version](https://img.shields.io/badge/version-v3.1.2-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-actively--developed-brightgreen)

TaskCube 是一款使用 React 构建的现代化、本地优先的待办事项应用。它将优雅的、以键盘为中心的操作界面与灵活强大的 AI 助手相结合，确保您的数据安全私密，工作流程迅捷高效。

---

## ✨ 核心功能

### 🧠 AI 驱动 (AI-Powered)
*   **自然语言输入**: 输入“明天上午10点安排一个团队会议”，AI 将自动解析出标题、日期和时间。
*   **智能任务拆解**: 面对复杂任务（如“规划一次家庭旅行”）？一键将其智能拆解为一系列可执行的子任务。
*   **AI 项目规划**: 为新项目构思行动计划。AI 可为你自动生成关键的任务和里程碑建议。

### 🗂️ 强大组织力 (Powerful Organization)
*   **任务依赖关系**: 设置任务的前后置关系。被阻塞的任务将自动显示 🔒 锁定图标，在所有视图中都无法被完成，确保项目按正确顺序推进。
*   **多维视图系统**:
    *   **无限滚动月历**: 支持拖拽任务以快速排期。
    *   **24h 时间轴**: 精准规划每一天的日程。
    *   **四象限看板**: 基于艾森豪威尔矩阵自动分类，通过拖拽即可调整任务的紧急和重要程度。
    *   **高性能列表**: 使用虚拟化技术，即使处理上千个任务也能保持极致流畅的滚动和筛选体验。

### ⚡️ 极致效率 (Built for Speed)
*   **零构建架构**: 采用原生浏览器 ES Modules 和 `esm.sh/run` 运行时。**无需安装 Node.js、无需 `npm install`**，直接在浏览器中打开即可运行，极致轻量。
*   **全局指令面板**: 按下 `Cmd/Ctrl+K`，即可快速搜索任务、执行命令，实现真正的“键盘驱动”工作流。
*   **自定义快捷键**: 为常用操作配置你最习惯的快捷键。

### 🔒 隐私与开放 (Private & Open)
*   **本地优先 & 隐私安全**: 你的所有数据都直接存储在你的设备上（使用 IndexedDB）。没有云端，无需注册，不收集任何数据。
*   **自定义 AI 模型**: 你拥有完全的控制权。你可以连接到任何兼容 OpenAI 接口的 API——无论是 OpenAI 官方、Google Gemini、自托管的本地模型（如 Llama），还是任何其他供应商。

---

## 🚀 快速启动

本应用采用“零构建”架构，**无需安装任何依赖**。但由于浏览器安全限制（`file://` 协议无法运行 `import`），你不能直接双击 `index.html` 文件打开它，必须通过一个本地 Web 服务器来运行。

以下是几种最简单的方法：

### 方式 A: VS Code + Live Server 扩展 (推荐)
1.  在 VS Code 中打开项目文件夹。
2.  前往“扩展”面板，搜索并安装 **Live Server** 扩展。
3.  安装后，在文件浏览器中右键点击 `index.html` 文件。
4.  选择 **"Open with Live Server"**。

### 方式 B: WebStorm (或其他 JetBrains IDE)
1.  在 WebStorm 中打开项目文件夹。
2.  右键点击 `index.html` 文件。
3.  选择 **Open in Browser** -> **Chrome** (或你喜欢的浏览器)。

### 方式 C: 使用 Python (如果已安装)
1.  在项目根目录下打开你的终端或命令行工具。
2.  运行以下命令启动一个简单的服务器：
    ```bash
    # Python 3
    python -m http.server 8000
    ```
3.  然后在浏览器中打开 `http://localhost:8000`。

---

## 🛠️ 技术细节

*   **运行时**: `esm.sh/run` (处理 `.tsx` 文件的实时浏览器编译)
*   **存储**: `Dexie.js` (IndexedDB 封装)
*   **UI**: `Tailwind CSS` (JIT CDN 模式)
*   **性能**: `TanStack Virtual` (列表虚拟化)

---

## 📚 文档中心

*   **[🏛️ 设计与架构](./docs/DESIGN_DOC.md)**: 深入了解应用的技术架构和运行机制。
*   **[🗺️ 产品路线图 (Roadmap)](./docs/ROADMAP.md)**: 查看即将推出的新功能。
*   **[✨ 优化与改进](./docs/OPTIMIZATIONS.md)**: 追踪性能和 UI/UX 的持续打磨。
*   **[🐞 Bug 修复日志](./docs/BUG_FIX_LOG.md)**: 已解决的问题记录。
*   **[📦 桌面端打包指南](./docs/ELECTRON_GUIDE.md)**: 如何将应用打包为桌面程序。

## 📝 许可证
MIT License
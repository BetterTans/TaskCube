
# 🚀 TaskCube 开发路线图 (Roadmap)

本文档记录了 TaskCube 项目未来的架构演进方向与功能迭代计划。

## 📅 阶段一：数据安全与基础体验 (v2.1)

### 1. 数据导入/导出 (Backup & Restore)
*   **现状**: 目前应用为纯本地架构 (Local-First)，无后端数据库。如果用户清除浏览器缓存或更换设备，数据将丢失。
*   **目标**: 提供最基础的数据安全保障。
*   **方案**:
    *   **导出**: 将 `Tasks`, `Projects`, `RecurringRules`, `Settings` 打包为一个 `.json` 文件下载。
    *   **导入**: 解析 JSON 文件并覆盖/合并本地 IndexedDB/LocalStorage 数据。
    *   **自动备份**: (可选) 每天首次打开时自动下载备份到本地下载文件夹。

### 2. PWA 渐进式应用支持 (Mobile Experience)
*   **现状**: 仅有基础的 iOS meta 标签，无法离线使用，也没有安装入口。
*   **目标**: 让网页在移动端像原生 App 一样运行。
*   **方案**:
    *   **Manifest.json**: 配置 App 名称、图标、启动画面背景色、`display: standalone` (隐藏浏览器地址栏)。
    *   **Service Worker**: 缓存核心 HTML/CSS/JS 资源，实现**离线打开**。
    *   **Install Prompt**: 引导用户将应用添加到主屏幕。

---

## 💾 阶段二：架构升级 (v2.2)

### 3. 持久层迁移 (LocalStorage -> IndexedDB)
*   **现状**: 数据全量序列化存储在 `localStorage`。
    *   *缺点*: 同步阻塞 UI 线程；容量限制 (5MB)；无法高效查询（必须遍历全数组）。
*   **目标**: 支撑 10,000+ 任务量的流畅运行。
*   **方案**:
    *   引入 **Dexie.js** (IndexedDB 封装库)。
    *   建立索引: `tasks.where('date').equals(today)`，大幅提升日视图渲染性能。
    *   实现 `useLiveQuery` 钩子，替代目前的 `useEffect` + `JSON.parse` 模式。

---

## 🎨 阶段三：交互深化 (v2.3)

### 4. 拖拽交互 (Drag & Drop)
*   **现状**: 调整时间或状态只能通过点击表单。
*   **目标**: 提供直观的物理操作感。
*   **方案**:
    *   技术选型: **dnd-kit** (轻量、模块化、移动端触控支持好)。
    *   **日视图 (Timeline)**:
        *   长按拖动任务块修改 `startTime`。
        *   拖动任务块底部边缘修改 `duration`。
    *   **看板视图 (Kanban)**:
        *   在不同象限间拖拽以改变 `quadrant`。
    *   **列表视图**:
        *   拖拽排序任务优先级。

---

## 🧠 阶段四：AI 2.0 (v3.0)

### 5. 上下文感知 AI (Context-Aware Assistant)
*   **现状**: `aiService` 是无状态的。解析 "明早9点开会" 时，AI 不知道该时段是否冲突。
*   **目标**: AI 充当真正的助理，而不仅仅是解析器。
*   **方案**:
    *   **RAG (简易版)**: 在构建 Prompt 时，注入当前的 Context。
    *   **场景示例**:
        *   *用户*: "帮我安排明早 9 点的会议"
        *   *System Prompt 注入*: `Current Schedule (Tomorrow): 09:00-10:00 [Gym]`
        *   *AI 回复*: "明早 9 点您已经安排了健身，建议调整到 10:30？"
    *   **每日智能简报**: 结合昨天的 `ProjectLog` 和今天的 `Tasks`，自动生成晨间简报。

---

## 🛠 待定技术债 (Tech Debt)

*   **Virtualization (虚拟列表)**: 如果单日任务超过 100 个，考虑引入 `react-window` 优化 `TableView` 和 `FullCalendar` 的渲染性能。
*   **测试覆盖**: 为核心的 `recurringService` (周期规则计算) 添加单元测试，确保闰年、月底等边界情况准确无误。

# Design Tokens — 设计文档

## 设计决策

### D1: 保持 Tailwind 原生风格，不做抽象
**决定:** 不引入 CSS 变量或 @theme 系统，继续用 Tailwind 类名直接写 token。
**理由:** TaskCube 是 1-3 人项目，CDN + inline config 模式不适合引入构建时代的 token 管道。Tailwind 原生已经是项目既定风格。
**满足:** 用户明确选择"第一种风格"（Tailwind 原生）。

### D2: Dark Mode 中性色从 gray → zinc 的理由
**决定:** 暗黑模式下所有文字色统一使用 zinc 色系。
**理由:**
- zinc 比 gray 偏暖（微棕基调），在暗黑背景下文字感知度更好
- 项目中已经混用两者，zinc 占比更大（token 文档也要求 zinc）
- Tailwind 官方推荐 dark mode + zinc 配对
**满足:** Requirement 1

### D3: 按钮阴影的处理策略
**决定:** 按钮上移除所有 `shadow-md`/`shadow-lg`，保留 Hover 状态通过背景色变化来反馈。
**理由:**
- shadcn/ui 和 Linear 的主流做法都是纯色 hover
- 阴影在 light mode 下会产生视觉重影，尤其是 indigo 色阴影
- 现有关键按钮（Modal 保存按钮、Panel 删除按钮）已经不用阴影，App.tsx 新建按钮是唯一例外
**满足:** Requirement 2

### D4: 毛玻璃的分级处理
**决定:** 区分"装饰性毛玻璃"和"功能性毛玻璃"。

| 类型 | 位置 | 处理 |
|------|------|------|
| 功能性（保留） | sticky header、modal overlay | 保留 `backdrop-blur` — 内容滚到下面时需要看清 |
| 装饰性（移除） | Sidebar 主体、弹窗/下拉内容 | 移除 `backdrop-blur` — 背景不可见于当前上下文 |

**满足:** Requirement 3

### D5: 圆角统一方案
**决定:** 三档圆角体系：

| Token | 值 | 用途 |
|-------|-----|------|
| `rounded-lg` | 8px | 小按钮、标签、chips、list item |
| `rounded-xl` | 12px | 卡片、按钮、输入框、设置区块 |
| `rounded-2xl` | 16px | Modal、大型浮动面板 |

消除 `rounded-md`(6px)、`rounded-[6px]`、`rounded`(4px) 等非标准值。
**满足:** Requirement 4

### D6: 字重统一方案
**决定:** 三档字重体系：

| Token | 用途 | 例外 |
|-------|------|------|
| `font-medium` | 正文、列表、标签 | — |
| `font-semibold` | 小标题、分区标签、卡片标题 | — |
| `font-bold` | 页面主标题（text-xl+）、统计数字 | 约 5-8 处 |

**满足:** Requirement 5

## Token 速查表

### 颜色 — Light Mode

| 用途 | 类名 |
|------|------|
| 页面背景 | `bg-[#F7F7F7]` |
| 卡片/Surface | `bg-white` |
| 卡片边框 | `border-gray-200` |
| 主文字 | `text-gray-900` |
| 正文 | `text-gray-500` / `text-gray-600` |
| 辅助/次要 | `text-gray-400` / `text-gray-300` |
| 主按钮 | `bg-indigo-600 text-white hover:bg-indigo-700` |
| 次按钮 | `bg-white border-gray-300 text-gray-700 hover:bg-gray-50` |
| 删除/危险 | `text-red-500 hover:bg-red-50` |
| 输入框底 | `bg-gray-50` |
| 输入框焦点 | `focus:border-indigo-300` |

### 颜色 — Dark Mode

| 用途 | 类名 |
|------|------|
| 页面背景 | `dark:bg-[#121217]` |
| 卡片/Surface | `dark:bg-zinc-900` |
| 卡片边框 | `dark:border-zinc-800` |
| 主文字 | `dark:text-white` |
| 正文 | `dark:text-zinc-400` |
| 辅助/次要 | `dark:text-zinc-500` |
| 输入框底 | `dark:bg-zinc-800/50` |
| 输入框焦点 | `dark:focus:border-indigo-600` |
| 删除 hover | `dark:hover:bg-red-900/20` |

### 间距与形状

| 用途 | 类名 |
|------|------|
| 按钮 padding | `px-4 py-2` (标准), `px-3 py-1.5` (小) |
| 输入框 | `px-3 py-2.5 rounded-xl` |
| 分区标签 | `text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider` |
| 分区图标 | `size={14} text-gray-400 dark:text-zinc-500` |
| Card padding | `p-4` (标准) |

### Z-Index 层级

| Z-Index | 组件 |
|---------|------|
| z-10 | 日历内部日期 header |
| z-20 | App header, 日历周 header |
| z-30 | Panel header, DayTimeView header, TableView 筛选弹窗 |
| z-40 | Sidebar |
| z-50 | Modal overlay (RecurringManager, ProjectListModal) |
| z-[60] | → 改为 z-50 (ProjectDetailModal) |
| z-[70] | TaskDetailModal |
| z-[80] | SettingsModal, ConfirmDialog, TaskSelectorPopover |
| z-[90] | EventPopover, Toast |
| z-[100] | CommandPalette |

## 文件变更范围

| 文件 | 变更类型 | 涉及 |
|------|---------|------|
| App.tsx | shadow, dark:text-gray, font-bold | R2, R1, R5 |
| components/Sidebar.tsx | 毛玻璃, shadow, dark:text-gray | R3, R2, R1 |
| components/MatrixView.tsx | shadow, dark:text-gray, font-bold | R2, R1, R5 |
| components/TableView.tsx | 圆角, 毛玻璃, dark:text-gray | R4, R3, R1 |
| components/FullCalendar.tsx | dark:text-gray, font-bold | R1, R5 |
| components/DayTimeView.tsx | shadow, dark:text-gray, font-bold | R2, R1, R5 |
| components/ViewTabs.tsx | dark:text-gray | R1 |
| components/FilterIndicator.tsx | dark:text-gray | R1 |
| components/EventPopover.tsx | shadow, dark:text-gray | R2, R1 |
| components/ToastContainer.tsx | shadow | R2 |
| components/TaskDetailPanel.tsx | dark:text-gray | R1 |
| components/TaskDetailModal.tsx | dark:text-gray | R1 |
| components/TaskEditorCore.tsx | dark:text-gray, font-bold | R1, R5 |
| components/TaskSelectorPopover.tsx | 毛玻璃 | R3 |
| components/ProjectDetailModal.tsx | 圆角, z-index, dark:text-gray | R4, R1 |
| components/ProjectListModal.tsx | dark:text-gray | R1 |
| components/SettingsModal.tsx | 圆角, dark:text-gray | R4, R1 |
| components/RecurringManager.tsx | dark:text-gray | R1 |
| components/RecurringOptions.tsx | dark:text-gray | R1 |
| components/TagsManager.tsx | 圆角 | R4 |
| components/ConfirmDialog.tsx | dark:text-gray | R1 |
| components/CommandPalette.tsx | dark:text-gray | R1 |
| components/Skeletons.tsx | 圆角 (保留 rounded-md) | — |
| components/Button.tsx | 圆角 | R4 |

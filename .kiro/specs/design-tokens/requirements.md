# Design Tokens — 需求文档

## 目标

统一 TaskCube 项目的 Tailwind 原生设计 token，消除审计发现的组件间风格不一致，
但不改变项目整体的视觉基调（保留 indigo 主色、白底卡片、圆角按钮等现有风格）。

## 范围

### 纳入范围
1. 统一 dark mode 文字色：`dark:text-gray-*` → `dark:text-zinc-*`
2. 移除按钮上的阴影效果（`shadow-md` / `shadow-lg`）
3. 移除内容区（非 overlay）的毛玻璃效果（`backdrop-blur`）
4. 统一圆角：`rounded-md` → `rounded-lg`，消除非标准圆角值
5. `font-bold` → `font-semibold`

### 排除范围
- 不改变主色（保持 indigo-600）
- 不改变整体布局
- 不改变字体系统
- 不引入 CSS 变量/主题系统
- Modal overlay 的 `backdrop-blur-sm` 保留（功能性遮罩层）

## 验收标准

### Requirement 1: Dark Mode 文字统一用 zinc
**Objective:** 作为用户，我希望暗黑模式下所有灰色文字使用统一色系

1. 所有组件中 `dark:text-gray-*` 替换为对应的 `dark:text-zinc-*` 色阶
2. 替换映射：
   - `dark:text-gray-100` → `dark:text-zinc-100`
   - `dark:text-gray-200` → `dark:text-zinc-200`
   - `dark:text-gray-300` → `dark:text-zinc-300`
   - `dark:text-gray-400` → `dark:text-zinc-400`
   - `dark:text-gray-500` → `dark:text-zinc-500`
3. 替换后 npx tsc --noEmit 无新增错误

### Requirement 2: 按钮移除阴影
**Objective:** 作为用户，我希望操作按钮干净利落，无多余装饰

1. App.tsx 新建任务按钮移除 `shadow-md shadow-indigo-200`，保留 `dark:shadow-none`
2. Sidebar 折叠按钮移除 `shadow-md` 和 `hover:shadow-lg`
3. MatrixView 任务卡片移除 `hover:shadow-lg`
4. Toast 移除 `shadow-lg`
5. DayTimeView 拖拽卡片移除 `shadow-lg`

### Requirement 3: 内容区移除毛玻璃
**Objective:** 作为用户，我希望内容表面清晰不透明

1. Sidebar 主容器 `backdrop-blur-lg` → 纯色背景
2. Sidebar 折叠按钮 `backdrop-blur-sm` 移除
3. TableView 筛选弹窗 `backdrop-blur-lg` 移除
4. TaskSelectorPopover `backdrop-blur-lg` 移除
5. FullCalendar 月份头部 sticky header 保留 `backdrop-blur-sm`（功能性，防止内容穿透）
6. DayTimeView sticky header 保留 `backdrop-blur-sm`（同上）
7. Skeletons sticky header 保留 `backdrop-blur-sm`（同上）
8. SettingsModal 底部 footer 保留 `backdrop-blur-sm`（同上）
9. ProjectDetailModal 头部保留 `backdrop-blur-md`（同上）
10. App.tsx header 保留 `backdrop-blur-lg`（sticky 功能性需求）

### Requirement 4: 统一圆角
**Objective:** 作为用户，我希望所有交互元素圆角一致

1. `rounded-md` → `rounded-lg`（SettingsModal 快捷键框、TableView 按钮、ProjectDetailModal tab 按钮等）
2. `rounded-[6px]` → `rounded-md`（ProjectDetailModal tab 切换按钮）
3. Skeleton 的 `rounded-md` 保留（动画占位符，非交互元素）

### Requirement 5: 统一字重
**Objective:** 作为用户，我希望标题和标签使用统一的 semibold 而非 bold

1. 所有组件中的 `font-bold` → `font-semibold`
2. 例外：`font-bold` 保留在全尺寸标题（h1/h2 对应 text-xl 以上）—— 但需要在 design 中明确定义

## 边界上下文

- **不引入**: CSS variables、@theme、design token JSON 文件
- **不改变**: 布局结构、组件逻辑、数据流
- **谨慎处理**: sticky header 的 `backdrop-blur` 保留为功能性需求
- **兼容性**: 所有变更不影响 Tauri 桌面端构建

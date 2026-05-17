# Design Tokens — 任务清单

> 每个 Task 完成后独立 commit，commit message 与 Task 标题一致。
> 每完成一个 Task 运行 `npx tsc --noEmit | grep -v 'src-tauri' | grep -v 'getTagColor'` 确保无新增 TS 错误。

---

### Task 1: 按钮阴影移除

**Objective:** 移除所有按钮/交互元素上的 shadow-md/shadow-lg

**文件:** `App.tsx`, `components/Sidebar.tsx`, `components/MatrixView.tsx`, `components/ToastContainer.tsx`, `components/DayTimeView.tsx`, `components/EventPopover.tsx`

**修改:**

1. `App.tsx:505` — 新建任务按钮
   - Old: `shadow-md shadow-indigo-200 dark:shadow-none`
   - New: `dark:shadow-none`

2. `components/Sidebar.tsx:144` — 折叠按钮
   - Old: `shadow-md` (在 className 中)
   - New: (删除 shadow-md)
   - Old: `hover:shadow-lg` 
   - New: (删除 hover:shadow-lg)

3. `components/MatrixView.tsx:78` — 任务卡片 hover
   - Old: `hover:shadow-lg hover:-translate-y-0.5`
   - New: `hover:-translate-y-0.5` (保留微浮动，去掉阴影)

4. `components/ToastContainer.tsx:27` — Toast
   - Old: `shadow-lg`
   - New: (删除 shadow-lg)

5. `components/DayTimeView.tsx:403` — 拖拽卡片
   - Old: `opacity-80 z-30 shadow-lg`
   - New: `opacity-80 z-30`

6. `components/EventPopover.tsx:150` — popover 容器
   - Old: `shadow-2xl`
   - New: `shadow-2xl` 保留（Modal 级浮层可用）

**Verify:** `grep -rn 'shadow-md\|shadow-lg' components/ App.tsx | grep -v 'backdrop'` → 只剩 EventPopover 的 shadow-2xl 和 sticky header 的 shadow-sm

**Commit:** `style: remove shadow-md/shadow-lg from buttons and interactive elements`

---

### Task 2: Dark Mode 文字统一为 zinc

**Objective:** 所有 `dark:text-gray-*` → `dark:text-zinc-*`

**文件:** 多个，按组件逐个替换

**替换映射表:**

| 源 | 目标 |
|----|------|
| `dark:text-gray-100` | `dark:text-zinc-100` |
| `dark:text-gray-200` | `dark:text-zinc-200` |
| `dark:text-gray-300` | `dark:text-zinc-300` |
| `dark:text-gray-400` | `dark:text-zinc-400` |
| `dark:text-gray-500` | `dark:text-zinc-500` |

**受影响的文件和位置 (共 ~35 处):**

- `App.tsx:489` — `dark:text-gray-100` → `dark:text-zinc-100`
- `App.tsx:495,497` — `dark:text-gray-300` → `dark:text-zinc-300` (2处)
- `components/MatrixView.tsx:37` — `dark:text-gray-100` → `dark:text-zinc-100`
- `components/MatrixView.tsx:38,42,92,98` — `dark:text-gray-400` → `dark:text-zinc-400` (4处)
- `components/MatrixView.tsx:83` — `dark:text-gray-100` → `dark:text-zinc-100`
- `components/ViewTabs.tsx:30` — `dark:text-gray-200` → `dark:text-zinc-200`
- `components/ViewTabs.tsx:30` — `dark:text-gray-400` → `dark:text-zinc-400`
- `components/TableView.tsx:247,250,262,263,274,275,276,278,280,282,292` — 各处 (~12处)
- `components/FullCalendar.tsx:264,269,309,422` — (~4处)
- `components/DayTimeView.tsx:305,458,471` — (~4处)
- `components/TaskDetailPanel.tsx:348,443,515` — (~3处)
- `components/TaskDetailModal.tsx:403` — `dark:text-gray-200` → `dark:text-zinc-200`
- `components/SettingsModal.tsx:73,279,293,306,319,332,344,355,365,385,420,440` — (~12处)
- `components/ProjectDetailModal.tsx:151,154,158,169,184,190,191,207,224` — (~9处)
- `components/ProjectListModal.tsx:126,129` — (~2处)
- `components/RecurringManager.tsx:85,108` — (~2处)
- `components/RecurringOptions.tsx:57,58,70,100` — (~3处)
- `components/TaskSelectorPopover.tsx:86,110` — (~2处)
- `components/CommandPalette.tsx:27,92,108,126,128` — (~5处)
- `components/Sidebar.tsx:79,108` — `dark:text-gray-500` → `dark:text-zinc-500`
- `components/TaskEditorCore.tsx:78` — `dark:text-gray-200` → `dark:text-zinc-200`
- `components/ToastContainer.tsx:30` — `dark:text-gray-200` → `dark:text-zinc-200`

**方法:** 使用 search_files 确认精确位置，然后 patch 批量替换。优先使用 `replace_all=true` 在同一文件中全局替换。

**Verify:** `grep -rn 'dark:text-gray-' components/ App.tsx` → 输出为空（注意：保留 `dark:text-gray-*` 中出现但不在替换规则里的如 `dark:text-gray-*-` 带后缀变体）

**Commit:** `style: unify dark mode text to zinc scale (dark:text-gray → dark:text-zinc)`

---

### Task 3: 装饰性毛玻璃移除

**Objective:** 移除非 sticky-header/modal-overlay 场景的 backdrop-blur

**修改:**

1. `components/Sidebar.tsx:46` — Sidebar 主体
   - Old: `bg-gray-100/50 dark:bg-zinc-800/20 backdrop-blur-lg`
   - New: `bg-gray-100 dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800`

2. `components/Sidebar.tsx:144` — 折叠按钮
   - Old: `bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm`
   - New: `bg-white dark:bg-zinc-800`

3. `components/TableView.tsx:148` — 筛选弹窗
   - Old: `bg-white/90 dark:bg-zinc-800/90 backdrop-blur-lg`
   - New: `bg-white dark:bg-zinc-800`

4. `components/TaskSelectorPopover.tsx:82` — 任务选择器
   - Old: `bg-white/90 dark:bg-zinc-800/90 backdrop-blur-lg`
   - New: `bg-white dark:bg-zinc-900`

**保留的 backdrop-blur (不修改):**
- `App.tsx:483` — header sticky
- `FullCalendar.tsx:264,420` — 日历 sticky headers
- `DayTimeView.tsx:457` — day view sticky header
- `Skeletons.tsx:36` — skeleton sticky header
- `SettingsModal.tsx:439` — settings footer
- `ProjectDetailModal.tsx:120` — project detail header
- 所有 modal overlay (`bg-black/40 backdrop-blur-sm`)

**Verify:** TypeScript 编译通过

**Commit:** `style: remove decorative backdrop-blur from sidebar, popovers, and dropdowns`

---

### Task 4: 圆角统一

**Objective:** `rounded-md` → `rounded-lg`, `rounded-[6px]` → `rounded-md`

**修改:**

1. `components/SettingsModal.tsx:73` — 快捷键显示框
   - Old: `rounded-md` → New: `rounded-lg`

2. `components/SettingsModal.tsx:279` — 主题切换按钮
   - Old: `rounded-md` → New: `rounded-lg`

3. `components/SettingsModal.tsx:417` — 侧边 tab 按钮
   - Old: `rounded-md` → New: `rounded-lg`

4. `components/TableView.tsx:119` — 基础按钮
   - Old: `rounded-md` → New: `rounded-lg`

5. `components/TableView.tsx:277,279,281` — 表格 cell 标签 (3处)
   - Old: `rounded-md` → New: `rounded-lg`

6. `components/ProjectDetailModal.tsx:155,159` — 日期输入 (2处)
   - Old: `rounded-md` → New: `rounded-lg`

7. `components/ProjectDetailModal.tsx:169` — 状态按钮
   - Old: `rounded-md` → New: `rounded-lg`

8. `components/ProjectDetailModal.tsx:190,191` — tab 切换按钮 (2处)
   - Old: `rounded-[6px]` → New: `rounded-md`

9. `components/TagsManager.tsx:81,82` — 标签输入+按钮
   - Old: `rounded-lg` → 保持（已是 rounded-lg）

10. `components/RecurringManager.tsx:92,99` — 编辑/删除按钮 (2处)
    - Old: `rounded-md` → New: `rounded-lg`

11. `components/CommandPalette.tsx:125` — 命令图标
    - Old: `rounded-md` → New: `rounded-lg`

12. `components/DayTimeView.tsx:348,403` — 拖拽提示/卡片 (2处)
    - Old: `rounded-md` → New: `rounded-lg`

13. `components/FullCalendar.tsx:331` — 任务条两端
    - Old: `rounded-md` → New: `rounded-lg`

14. `components/Button.tsx:29` — Button 基础类
    - Old: `rounded-lg` → New: `rounded-xl`

15. `components/Skeletons.tsx:10` — Skeleton 占位符
    - 保留 `rounded-md`（非交互元素，动画占位符）

**Verify:** `grep -rn 'rounded-md\|rounded-\[6px\]' components/ App.tsx | grep -v 'Skeletons\|rounded-2xl'` → 只有 Skeleton 保留 rounded-md

**Commit:** `style: unify border radius — rounded-md→rounded-lg, rounded-[6px]→rounded-md`

---

### Task 5: font-bold → font-semibold

**Objective:** 将 15 处 font-bold 改为 font-semibold

**方法:** 全局搜索 + 逐个确认

**受影响的文件 (~15 处):**
- `components/FullCalendar.tsx` — 日历标题、日期
- `components/DayTimeView.tsx` — 视图标题
- `components/MatrixView.tsx` — 象限标题
- `components/TableView.tsx` — 列头
- `components/SettingsModal.tsx` — section 标题（多处）
- `components/ProjectDetailModal.tsx` — 标题
- `components/ProjectListModal.tsx` — 标题
- `components/EventPopover.tsx` — popover 标题
- `components/RecurringManager.tsx` — 管理器标题
- `components/RecurringOptions.tsx` — section 标签
- `components/ConfirmDialog.tsx` — 对话框标题
- `components/TaskEditorCore.tsx` — 优先级选项
- `App.tsx` — 日期标题

**例外（保留 font-bold）：**
- `App.tsx:489` 日期标题 `text-lg sm:text-xl font-bold` — 页面主标题保留
- `components/FullCalendar.tsx:264` `text-xl font-bold` — 日历月标题保留

**Verify:** `grep -rn 'font-bold' components/ App.tsx` → 只剩 2-3 处保留项

**Commit:** `style: font-bold → font-semibold for section labels and card titles`

---

### Task 6: ProjectDetailModal z-index 修正

**Objective:** `z-[60]` → `z-50`

**修改:**
- `components/ProjectDetailModal.tsx:117` — `z-[60]` → `z-50`

**Verify:** TypeScript

**Commit:** `fix: normalize ProjectDetailModal z-index to z-50`

---

### Task 7: 最终 TypeScript 编译 + 回归确认

**Verify:**
1. `npx tsc --noEmit 2>&1 | grep -v 'src-tauri' | grep -v 'getTagColor'` — 无新增错误
2. `npm run dev` 启动 → 浏览器打开 → 四象限 + 月视图 + 列表视图各切一遍 → 无 JS error

**Commit:** `chore: verify TypeScript and browser after token unification`

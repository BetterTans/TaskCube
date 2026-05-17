# Requirements — 合并任务编辑组件

## Introduction
当前 TaskDetailPanel (763行) 和 TaskDetailModal (691行) 是两个独立的任务编辑组件，功能大量重叠。合并为统一组件，以侧面板为主入口，弹窗为降级方案。

## Boundary
- **In scope**: 提取共享的 TaskEditor 内核组件，重构 Panel 使用之，Modal 降级为「更多选项」入口
- **Out of scope**: 修改 saveTask 逻辑、新增字段、数据库变更

## Requirements

### R1: 提取 TaskEditorCore 组件
**Objective:** 将任务字段编辑 UI 提取为纯展示组件，Panel 和 Modal 共享

#### Acceptance
1. TaskEditorCore 包含：标题、描述、日期、优先级、象限、进度、项目选择、标签、子任务、开始时间/时长
2. Panel 通过 props 控制 TaskEditorCore 的渲染模式（panel | modal）
3. 所有字段的 onChange 通过回调统一处理
4. 组件无副作用——自动保存等逻辑由外层 Panel/Modal 处理

### R2: TaskDetailPanel 使用 TaskEditorCore
**Objective:** 重构 Panel 使用共享内核，保持现有交互

#### Acceptance
1. Panel 的字段渲染全部委托给 TaskEditorCore
2. onBlur 自动保存逻辑保留在 Panel 层
3. 「更多详情」按钮仍然打开 Modal（降级入口）
4. Panel 的滑入/滑出动画不变

### R3: TaskDetailModal 降级为瘦身版
**Objective:** Modal 只处理 Panel 不方便的复杂功能（AI 拆解、周期规则、依赖关系）

#### Acceptance
1. Modal 的字段渲染也委托给 TaskEditorCore
2. Modal 保留：AI 智能填充、重复规则编辑、前置依赖管理
3. 常规字段编辑在 Panel 完成，不用再打开 Modal
4. Modal 打开时预填当前任务数据

### R4: 历史数据兼容
#### Acceptance
1. 不新增/删除 Task 字段
2. 备份导入导出的任务数据格式不变
3. 旧数据中的任务打开编辑正常工作

### R5: 代码量目标
#### Acceptance
1. TaskDetailPanel < 400 行（从 763 行缩减）
2. TaskDetailModal < 400 行（从 691 行缩减）
3. TaskEditorCore ≈ 300 行（新增）
4. 总行数 < 1100（从 1454 行减少 ~25%）

# Requirements — 任务操作撤销/重做

## Introduction
当前所有任务操作（创建/编辑/删除/拖拽）直接写入 IndexedDB，无撤销能力。必须提供 Ctrl+Z 撤销和 Ctrl+Shift+Z 重做。

## Boundary
- **In scope**: 任务增删改的撤销/重做、撤销堆栈、快捷键
- **Out of scope**: 项目/周期规则撤销、跨会话撤销

## Requirements

### R1: 撤销堆栈
**Objective:** 记录用户的任务变更操作，支持撤销

#### Acceptance
1. 每个操作记录：操作类型（create/update/delete）、操作前数据（快照）、操作后数据
2. 撤销堆栈最大 50 条（超出时移除最旧）
3. 堆栈存储在 React state（内存，会话级别）
4. 切换视图或刷新页面后堆栈清空

### R2: Ctrl+Z 撤销 / Ctrl+Shift+Z 重做
**Objective:** 标准快捷键撤销最近操作

#### Acceptance
1. Ctrl+Z（Mac Cmd+Z）：撤销最近一次任务操作
2. Ctrl+Shift+Z：重做最近撤销的操作
3. 撤销后 Toast 提示「已撤销 [操作名]」+ 「重做」按钮
4. 无操作可撤销时快捷键无响应

### R3: 可撤销操作范围
**Objective:** 明确哪些操作支持撤销

#### Acceptance
1. 任务创建 → 撤销=删除该任务（Toast「已撤销创建」）
2. 任务编辑 → 撤销=恢复编辑前数据
3. 任务删除 → 撤销=恢复该任务
4. 任务拖拽（日期变更）→ 撤销=恢复原日期
5. 子任务增/删/完成 → 撤销=恢复原子任务状态
6. 批量操作（导入覆盖）→ 不在范围内

### R4: 历史数据兼容
#### Acceptance
1. 撤销堆栈仅存在于当前会话，不持久化
2. 无 schema 变更
3. 导入导出不受影响

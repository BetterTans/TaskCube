# Requirements — 提醒与浏览器通知

## Introduction
当前无提醒功能，用户无法为任务设置到期提醒。利用浏览器 Notification API 实现系统级通知，无需后端服务。

## Boundary
- **In scope**: 浏览器通知、任务提醒时间设置、提醒触发、延后提醒
- **Out of scope**: 移动端推送、邮件提醒、日历集成

## Requirements

### R1: 浏览器通知权限
**Objective:** 首次使用时请求通知权限

#### Acceptance
1. 应用启动时检测 Notification.permission
2. 未授权时在设置页面显示「开启通知」按钮
3. 点击后调用 Notification.requestPermission()
4. 被拒绝时不反复请求，在设置中显示状态

### R2: 任务提醒设置
**Objective:** As a 用户, I want 为任务设置提醒时间

#### Acceptance
1. 在 TaskEditorCore（合并后的编辑组件）中添加「提醒」字段
2. 预设选项：任务开始时、5分钟前、15分钟前、30分钟前、1小时前、1天前、自定义
3. 提醒时间存储在 `task.reminderOffset` 字段（分钟数，负数=提前）
4. 有提醒的任务显示小铃铛图标

### R3: 提醒触发
**Objective:** 到达提醒时间时弹出系统通知

#### Acceptance
1. 使用 setInterval（60s）扫描即将到期的提醒
2. 触发时调用 `new Notification('NextDo', { body: title, icon })`
3. 通知显示任务标题和截止时间
4. 点击通知 → 切换到该任务所在视图并高亮

### R4: 延后提醒
**Objective:** 通知中可以延后提醒

#### Acceptance
1. 通知中包含「延后 5 分钟」按钮（使用 Notification actions）
2. 延后操作重置 reminderOffset 为 +5 分钟
3. 所有提醒的 Task 在视图中显示铃铛图标

### R5: 历史数据兼容
#### Acceptance
1. 新增 `task.reminderOffset` 字段 → 在 types.ts 中定义为可选（`number | undefined`）
2. 旧数据中 `reminderOffset` 为 undefined → 表示无提醒
3. 备份版本升级到 v1.2，但导入 v1.1 时自动补全字段为 undefined
4. autoBackup.ts 和 SettingsModal.tsx 的兼容检查更新到 v1.2

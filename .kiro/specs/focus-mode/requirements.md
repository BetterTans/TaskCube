# Requirements — 专注模式（番茄钟）

## Introduction
为任务添加专注计时器，帮助用户进入心流状态。记录每个任务和项目的专注时长，提供统计复盘。

## Boundary
- **In scope**: 番茄钟计时器、任务关联、专注统计、每日/周目标
- **Out of scope**: 白噪音、网站拦截

## Requirements

### R1: 番茄钟计时器
**Objective:** 标准番茄钟：25 分钟专注 + 5 分钟休息

#### Acceptance
1. 计时器 UI：大圆环倒计时 + 当前任务标题
2. 预设时长：25min（默认）/ 45min / 60min / 自定义
3. 播放开始/结束提示音（使用 Web Audio API，短促铃音）
4. 倒计时结束自动切换为休息模式

### R2: 任务关联
**Objective:** 开启专注前选择关联的任务

#### Acceptance
1. 从任务详情或列表选择「开始专注」
2. 计时期间在任务条上显示进行中的计时器
3. 完成专注后自动记录到该任务
4. 可暂停/恢复/放弃（放弃不记录）

### R3: 专注统计
**Objective:** 可视化专注数据

#### Acceptance
1. 今日专注总时长 + 完成的番茄数
2. 本周/本月趋势图（简易柱状图，纯 CSS/SVG）
3. 按项目/任务分组统计
4. 统计数据存储在 IndexedDB（新表 `focusSessions`）

### R4: 专注目标
**Objective:** 设置每日/每周专注目标

#### Acceptance
1. 默认目标：每日 4 个番茄（2h）
2. 可在设置中修改
3. 达到目标时显示庆祝动画 + Toast

### R5: 历史数据兼容
#### Acceptance
1. 新增 `focusSessions` 表（IndexedDB v6 schema）
2. 字段：id, taskId, projectId, startTime, endTime, duration, completed
3. 备份版本升级到 v2.0（含 focusSessions）
4. 导入 v1.x 备份时，focusSessions 为空数组

# Requirements — 习惯追踪

## Introduction
周期任务（每日/每周）天然适合习惯追踪。统计周期任务的连续完成天数、完成率，提供视觉化进度。

## Boundary
- **In scope**: 习惯连续完成统计、完成率可视化、习惯链（streak）、激励
- **Out of scope**: 非周期任务的习惯化、社交分享

## Requirements

### R1: 自动习惯检测
**Objective:** 周期任务自动识别为习惯

#### Acceptance
1. frequency === 'daily' 或 'weekly' 的任务自动标记为「习惯」
2. 用户可在任务详情中手动切换是否为习惯
3. 习惯任务在列表中显示特殊图标（火焰或循环箭头）

### R2: 连续完成统计（Streak）
**Objective:** 追踪习惯的连续完成天数

#### Acceptance
1. 每日自动检查周期任务是否完成（基于 task.completed）
2. 连续完成 N 天 → 显示 streak 数字
3. 中断时 streak 重置为 0，但保留历史最佳
4. 在任务条或习惯视图中显示 streak 徽章

### R3: 习惯视图
**Objective:** 专门的视图展示所有习惯

#### Acceptance
1. 新增「习惯」Tab（在 Header 导航栏中，使用火焰图标）
2. 网格排列所有习惯卡片，每个卡片显示：
   - 习惯名、最近 7 天完成状态（✓/✗ 点阵）
   - 当前 streak、最佳 streak、总完成率
3. 点击卡片展开详细统计（月度热力图）

### R4: 热力图
**Objective:** 类似 GitHub 贡献图的月度完成可视化

#### Acceptance
1. 7xN 网格（周日→周六），每格代表一天
2. 颜色深浅表示当天完成次数（绿/蓝渐变）
3. Hover 显示日期 + 完成详情
4. 仅 CSS — 不用图表库

### R5: 历史数据兼容
#### Acceptance
1. 习惯数据来源于现有 task.completed + 日期，不新增表
2. 统计实时计算（useMemo），不持久化
3. 历史任务的完成状态自然纳入统计
4. 无 schema 变更

# Requirements Document — 筛选修复与体验打磨

## Introduction

当前应用存在多个 UX 和功能问题：侧边栏项目/象限筛选只在月视图生效、项目列表溢出、视图切换与筛选/管理混在同一侧边栏。本次迭代修复这些问题，并将视图切换提升到顶部 Tab 栏，使侧边栏专注于筛选和管理。

## Boundary Context

- **In scope**: 筛选器全局生效修复、侧边栏滚动容器、hook 重命名、视图切换移至顶部 Tab 栏、筛选状态指示、侧边栏职责重组
- **Out of scope**: 新增数据字段、数据库 schema 变更、AI 功能、桌面端功能、calendar-hub spec 中未完成的任务
- **Adjacent expectations**: 不修改 Task/Project 数据模型；不破坏现有 calendar-hub 已实现的功能；保持折叠侧边栏功能

## Research Findings

调研日志：`research.md`

## Requirements

### Requirement 1: 筛选器全局生效
**Objective:** As a 用户, I want 在侧边栏选择的项目和象限筛选在所有视图中生效, so that 切换视图时筛选条件保持一致

#### Acceptance Criteria
1. When 用户在侧边栏选择项目筛选, the NextDo shall 在所有视图（月/日/四象限/列表）中仅显示该项目下的任务
2. When 用户在侧边栏选择象限筛选, the NextDo shall 在所有视图中仅显示该象限的任务
3. When 用户同时选择项目和象限筛选, the NextDo shall 在所有视图中显示同时满足两个条件的任务（AND 逻辑）
4. When 用户切换视图, the NextDo shall 保持筛选状态不变
5. While 列表视图同时有侧边栏筛选和表内筛选激活, the NextDo shall 应用两层筛选（先侧边栏全局筛选，再表内筛选）

### Requirement 2: 侧边栏项目列表可滚动
**Objective:** As a 用户, I want 在项目数量较多时侧边栏出现滚动条, so that 所有项目可见且底部按钮不被遮挡

#### Acceptance Criteria
1. When 项目列表高度超过侧边栏可视区域的 35%, the NextDo shall 在项目列表区域显示垂直滚动条
2. When 象限筛选列表高度导致整体超出, the NextDo shall 整个筛选区域可滚动
3. While 侧边栏折叠时, the NextDo shall 不显示筛选区域
4. When 侧边栏展开时, the NextDo shall 确保底部管理入口始终可见且不被遮挡

### Requirement 3: 顶部 Tab 视图切换
**Objective:** As a 用户, I want 在页面顶部通过 Tab 切换视图, so that 视图导航和筛选/管理功能在视觉和语义上清晰分离

#### Acceptance Criteria
1. The NextDo shall 在 Header 区域显示四个视图 Tab：四象限、月视图、日视图、列表
2. When 用户点击 Tab, the NextDo shall 切换到对应视图并高亮当前 Tab
3. The NextDo shall 从侧边栏移除视图切换区域
4. When 侧边栏折叠时, the NextDo shall 顶部 Tab 仍然可见和可用
5. The NextDo shall Tab 栏样式与 Notion/Linear 风格一致：底部指示条 + 平滑过渡

### Requirement 4: 侧边栏职责重组
**Objective:** As a 用户, I want 侧边栏专注于筛选和管理, so that 信息层次清晰

#### Acceptance Criteria
1. The NextDo shall 从侧边栏移除视图切换区域
2. The NextDo shall 侧边栏仅包含：NextDo Logo、筛选区（项目+象限）、管理入口（周期规则、设置）
3. While 侧边栏折叠, the NextDo shall 仅显示 Logo + 周期规则图标 + 设置图标

### Requirement 5: 筛选状态指示
**Objective:** As a 用户, I want 在非月视图中能看到筛选激活的视觉提示, so that 知道当前看到的是筛选后的数据

#### Acceptance Criteria
1. When 项目/象限筛选激活且当前非月视图, the NextDo shall 在 Header 下方显示筛选指示条
2. When 点击指示条上的 ×, the NextDo shall 清除对应筛选
3. While 无筛选激活, the NextDo shall 不显示指示条

### Requirement 6: Hook 命名修正
**Objective:** As a 开发者, I want hook 命名准确反映其用途

#### Acceptance Criteria
1. `useCalendarFilters` 重命名为 `useTaskFilters`
2. 所有引用同步更新
3. TypeScript 类型检查通过

### Requirement 7: 代码一致性校验
**Objective:** 确保修改不引入回归 bug

#### Acceptance Criteria
1. `npx tsc --noEmit` 无新增错误
2. `npm run dev` 正常启动
3. 所有视图可切换且筛选生效
4. 现有 calendar-hub 功能不受影响
5. 快捷键 `/v`（toggle_view）仍然可用

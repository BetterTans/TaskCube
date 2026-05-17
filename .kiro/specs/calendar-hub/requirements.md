# Requirements Document

## Introduction
将月视图改造为应用核心枢纽。用户主要使用月视图查看和创建任务，但功能分散在独立弹窗/视图中，创建任务需要 14 个字段的模态框。参考 Things 3 理念，让月视图成为信息中心——即时创建、侧面板详情、日历条增强、侧边栏过滤。

## Boundary Context
- **In scope**: 月视图内联创建、侧面板详情、日历条视觉增强、侧边栏过滤、保留旧版任务详情弹窗作为降级入口
- **Out of scope**: 其他视图（日/矩阵/列表）改造、数据库结构变更、新增数据字段、AI 功能、桌面端通知
- **Adjacent expectations**: 不修改 Task 数据模型；导入导出功能必须向后兼容所有历史版本备份文件（v1.0、v1.1）

## Requirements

### Requirement 1: 月视图即时创建任务
**Objective:** As a 用户, I want 在月视图上点击日期直接输入任务标题, so that 快速记录想法不用打开模态框

#### Acceptance Criteria
1. When 用户点击月视图中的日期格子空白区域, the NextDo shall 在该日期格内显示内联输入框，光标自动聚焦
2. When 用户在内联输入框中输入标题并按下回车, the NextDo shall 创建任务（默认：当天日期、中等优先级、Q2 象限、初始进度）并立即显示在日历上
3. When 用户在内联输入框中按下 Escape, the NextDo shall 取消输入且不创建任务
4. If 用户输入为空且按下回车, the NextDo shall 不创建任务并关闭输入框

### Requirement 2: 侧面板任务详情
**Objective:** As a 用户, I want 点击日历任务后在侧面板查看和编辑详情, so that 不遮挡日历即可编辑任务

#### Acceptance Criteria
1. When 用户点击日历上的任务条, the NextDo shall 在右侧滑出详情面板，日历保持可见且不遮挡
2. When 侧面板打开, the NextDo shall 显示任务的所有字段（标题、备注、日期、优先级、象限、进度、项目、标签、重复规则、子任务）
3. While 侧面板打开且用户修改任意字段, the NextDo shall 在用户离开该字段（on blur）时自动保存更改
4. When 用户点击面板外部区域或关闭按钮, the NextDo shall 关闭侧面板
5. When 用户点击另一个任务, the NextDo shall 切换侧面板内容为新任务
6. If 用户在侧面板中将任务标题清空, the NextDo shall 阻止保存并提示标题不能为空
7. When 用户在面板中点击删除, the NextDo shall 弹出确认后删除任务并关闭面板

### Requirement 3: 日历条信息增强
**Objective:** As a 用户, I want 在日历条上直接看到象限、项目和进度, so that 不用点击就能了解任务概况

#### Acceptance Criteria
1. The NextDo shall 在日历任务条上显示象限图标（Q1 闪电/Q2 星星/Q3 铃铛/Q4 咖啡）
2. The NextDo shall 在日历任务条上显示进度状态文字（如「初始」「进行中」）
3. The NextDo shall 用项目关联颜色渲染日历任务条背景色
4. When 任务已完成, the NextDo shall 以降透明度（opacity-60）显示该任务条
5. When 用户悬停在任务条上, the NextDo shall 轻微放大或高亮该条

### Requirement 4: 侧边栏过滤器
**Objective:** As a 用户, I want 在侧边栏按项目和象限过滤日历, so that 不用切换视图即可聚焦特定内容

#### Acceptance Criteria
1. When 用户点击侧边栏中的某个项目, the NextDo shall 在日历上仅显示属于该项目的任务，并高亮该项目
2. When 用户点击侧边栏中的「全部项目」, the NextDo shall 显示所有任务并取消项目筛选
3. When 用户点击某个象限筛选条件（Q1/Q2/Q3/Q4）, the NextDo shall 在日历上仅显示该象限的任务，并高亮该象限
4. When 用户点击「全部象限」, the NextDo shall 取消象限筛选
5. While 项目筛选和象限筛选同时激活, the NextDo shall 显示同时满足两个条件的任务
6. The NextDo shall 在每个筛选项旁显示匹配任务的数量

### Requirement 5: 数据向后兼容
**Objective:** As a 用户, I want 导入历史备份数据时正确识别所有版本, so that 升级后不会丢失以前的任何任务数据

#### Acceptance Criteria
1. When 用户导入 v1.0 格式备份文件（无 progress 字段）, the NextDo shall 自动补充 progress 字段：已完成→Completed、已过期→Delayed、其他→Initial
2. When 用户导入 v1.1 格式备份文件, the NextDo shall 完整恢复所有任务、项目、周期规则和 localStorage 设置
3. When 用户导入包含未知字段的高版本备份文件, the NextDo shall 忽略未知字段并正常恢复已知数据，同时提示用户版本差异
4. The NextDo shall 在导入完成后刷新页面以应用全部数据变更
5. The NextDo shall 保持导出格式版本号 v1.1 不变，不新增字段依赖

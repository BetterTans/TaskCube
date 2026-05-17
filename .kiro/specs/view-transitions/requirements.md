# Requirements — 视图切换动画与微交互

## Introduction
视图切换是即时跳变，缺乏过渡。应用整体的微交互（hover、点击、拖拽反馈）不足。引入动画系统提升品质感。

## Boundary
- **In scope**: 视图切换过渡、任务卡片动画、加载骨架屏动画、hover/click 反馈
- **Out of scope**: Framer Motion 等重量级动画库（用 CSS transitions + Tailwind 实现）

## Requirements

### R1: 视图切换过渡
**Objective:** 切换视图时平滑过渡

#### Acceptance
1. 使用 CSS `animate-in fade-in slide-in-from-right-4` (Tailwind v4 内置)
2. 视图形状：[四象限] 和 [列表] 淡入；[月视图] 缩放淡入；[日视图] 从右滑入
3. 过渡时长：200-300ms
4. 不造成布局抖动

### R2: 任务卡片微交互
**Objective:** 任务卡片在 hover/click/drag 时有视觉反馈

#### Acceptance
1. Hover：轻微放大 scale-[1.02] + 阴影增强，transition 150ms
2. Click：scale-[0.98] 按压反馈
3. Toggle 完成：划线动画 + 淡出到 opacity-60，300ms
4. 拖拽：占位符 + 其他卡片 smooth 位移

### R3: 空状态动画
**Objective:** 空视图的引导性动画

#### Acceptance
1. 无任务时显示友好的空状态插画 + 淡入动画
2. 「创建第一个任务」按钮 pulsate 脉冲动画引导
3. 创建任务后空状态平滑淡出

### R4: 侧边栏过渡
**Objective:** 折叠/展开侧边栏平滑过渡

#### Acceptance
1. 已有 transition-all duration-300 → 保持
2. 内容在折叠时优雅隐藏（opacity + width 同时过渡）
3. 折叠按钮翻转动画

### R5: 历史数据兼容
#### Acceptance
1. 纯 UI 变更，无数据影响

# Requirements — Markdown 任务笔记

## Introduction
任务描述字段当前为纯文本 textarea。升级为 Markdown 编辑器，支持富文本渲染：标题、列表、代码块、链接、待办清单。

## Boundary
- **In scope**: Markdown 渲染、简易编辑工具栏、实时预览、Markdown 安全渲染
- **Out of scope**: 文件附件、图片上传、协同编辑

## Requirements

### R1: Markdown 渲染
**Objective:** 任务描述以 Markdown 渲染显示

#### Acceptance
1. 使用轻量级 Markdown 解析器（如 marked 或自研简化版，< 10KB）
2. 支持语法：标题 (# ## ###)、粗体/斜体、列表（无序+有序）、代码块、链接、待办清单 (- [ ] / - [x])
3. 安全性：过滤 XSS（DOMPurify 或使用 marked sanitize）
4. 渲染模式与编辑模式可切换

### R2: 编辑工具栏
**Objective:** 不熟悉 Markdown 的用户可通过工具栏快速编辑

#### Acceptance
1. 工具栏按钮：粗体、斜体、标题、列表、代码、链接、待办
2. 选中文本后点击工具栏 → 自动包裹 Markdown 语法
3. 快捷键：Ctrl+B 粗体、Ctrl+I 斜体（标准编辑快捷键）
4. 移动端适配：工具栏折叠为浮动菜单

### R3: 实时预览
**Objective:** 编辑时可切换预览模式

#### Acceptance
1. 编辑/预览切换按钮（眼睛图标）
2. 预览模式：只读渲染，链接可点击
3. 预览模式下点击编辑区 → 切回编辑模式
4. 两栏模式（桌面端可选）：左编辑右预览

### R4: 子任务 Markdown 待办
**Objective:** Markdown 中的待办清单与子任务同步

#### Acceptance
1. 描述中的 `- [ ] 任务名` 自动生成子任务
2. 子任务在描述中以 Markdown 形式显示并保持同步
3. 勾选待办 → 同时更新 task.subTasks[i].completed
4. 此项为可选项（Phase 2），初版可先不做同步

### R5: 历史数据兼容
#### Acceptance
1. task.description 字段格式不变（纯文本 string）
2. 旧描述直接渲染为纯文本（无 Markdown 解析）
3. Markdown 语法对旧数据无副作用
4. 无 schema 变更

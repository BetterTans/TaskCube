# Requirements — 暗色模式完善

## Introduction
当前有基础暗色模式但部分原生系统组件（input[type=date]、select、color picker）未适配。完善所有组件对暗色模式的支持。

## Boundary
- **In scope**: 系统原生控件暗色适配、颜色语义统一、对比度检查
- **Out of scope**: 自定义主题色系统（Level 3）

## Requirements

### R1: 系统控件暗色适配
**Objective:** 所有 input/select/textarea 在暗色模式下正确显示

#### Acceptance
1. 所有 `<input type="date">` 添加 `dark:color-scheme-dark`（部分已有）
2. `<input type="time">` 同样适配
3. `<select>` 元素暗色背景+文字
4. `<textarea>` 暗色适配
5. `<input type="color">` 使用自定义 picker（CSS only）

### R2: 模态框暗色
**Objective:** 各模态框在暗色模式下风格一致

#### Acceptance
1. 确认对话框 (ConfirmDialog) 暗色背景
2. Toast 通知暗色适配
3. FilterPopover 和 CommandPalette 暗色
4. 所有半透明 backdrop (bg-black/50) 保持一致

### R3: 滚动条暗色
**Objective:** 浏览器滚动条适配暗色主题

#### Acceptance
1. 使用 `custom-scrollbar` CSS class 统一滚动条样式
2. 暗色模式下滚动条轨道深色、滑块中灰
3. 亮色模式下滚动条轨道浅灰、滑块深灰

### R4: 对比度校验
**Objective:** 确保暗色模式文本可读性

#### Acceptance
1. 所有正文文本对比度 >= 4.5:1（WCAG AA）
2. 灰色文本在暗色背景下不暗于 zinc-400
3. 链接/按钮在暗色模式下有足够区分度

### R5: 历史数据兼容
#### Acceptance
1. 纯视觉变更，无数据影响

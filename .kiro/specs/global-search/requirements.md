# Requirements — 全局全文搜索

## Introduction
当前 CommandPalette 只能按任务标题模糊匹配。扩展为全文搜索，支持标题/描述/标签/项目名，搜索结果高亮匹配关键词。

## Boundary
- **In scope**: CommandPalette 搜索逻辑扩展、搜索索引、结果高亮、键盘导航
- **Out of scope**: 全文搜索引擎（Elasticsearch 等）、服务器端搜索

## Requirements

### R1: 全文搜索
**Objective:** As a 用户, I want 输入关键词后搜索所有任务的标题、描述、标签和项目名

#### Acceptance
1. 搜索范围：任务标题、描述、标签、所属项目名
2. 实时搜索：输入即搜，无需按 Enter
3. 结果按相关度排序（标题匹配 > 标签匹配 > 描述匹配 > 项目名匹配）
4. 显示结果数量（如「找到 3 个匹配」）

### R2: 搜索结果高亮
**Objective:** 结果中匹配的关键词高亮显示

#### Acceptance
1. 关键词在标题/描述中高亮（黄色背景或下划线）
2. 描述结果截取关键词上下文（前后各 20 字符）
3. 标签匹配以标签图标标识
4. 项目名匹配以项目颜色点标识

### R3: 键盘导航
**Objective:** 搜索结果纯键盘操作

#### Acceptance
1. ↑↓ 在搜索结果间移动焦点
2. Enter 选择当前焦点结果并打开编辑
3. Escape 关闭搜索

### R4: 性能
**Objective:** 1000 个任务时搜索延迟 < 100ms

#### Acceptance
1. 使用 useMemo 缓存搜索索引
2. 搜索在 JS 主线程同步完成（数据量小，无需 Worker）
3. 输入时用 debounce 100ms 避免频繁重算

### R5: 历史数据兼容
#### Acceptance
1. 搜索仅读取已有字段，不修改任何数据
2. 无 schema 变更

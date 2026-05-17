# Requirements — 统一 Logger 迁移

## Introduction
项目中有 12 处 console.log，分布在 4 个文件中。迁移到统一的 Logger 工具，支持日志级别和开发/生产模式切换。

## Boundary
- **In scope**: 创建 Logger 工具、替换所有 console.log、生产模式静默
- **Out of scope**: 远程日志上报、Sentry 集成

## Requirements

### R1: Logger 工具
**Objective:** 创建统一的 Logger 模块

#### Acceptance
1. 路径：`utils/logger.ts`
2. 支持级别：debug / info / warn / error
3. 生产模式（`import.meta.env.PROD`）下 debug 和 info 静默
4. 保留 warn 和 error 在所有环境输出

### R2: 替换所有调用
**Objective:** 将 12 处 console.log 替换为 logger 调用

#### Acceptance
1. db.ts 的 3 处迁移日志 → `logger.info`
2. autoBackup.ts 的 6 处操作日志 → `logger.info`
3. SettingsModal.tsx 的 1 处兼容检测 → `logger.info`
4. DayTimeView.tsx 的 1 处拖拽调试 → `logger.debug`
5. 其他 1 处 → 按语义分级

### R3: 历史数据兼容
#### Acceptance
1. 无数据格式变更
2. 纯代码重构

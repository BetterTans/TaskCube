# NextDo 贡献指南

## 开发环境要求

### 前置条件
- Node.js 18+ （用于 Web 开发）
- Rust 工具链 （用于 Tauri 桌面应用构建）

### 安装依赖

```bash
npm install
```

## 可用脚本

### Web 开发命令

| 脚本 | 描述 |
|-----|-----|
| `npm run dev` | 启动 Vite 开发服务器（端口 3000） |
| `npm run build` | 构建生产环境 Web 包 |
| `npm run build:tauri` | 构建 Tauri 桌面应用的前端包 |
| `npm run preview` | 预览生产环境构建结果 |

### Tauri 桌面应用开发

| 脚本 | 描述 |
|-----|-----|
| `npm run tauri:dev` | 同时启动 Vite 开发服务器和 Tauri 桌面应用 |
| `npm run tauri` | Tauri CLI 命令 |
| `npm run tauri:build` | 构建 Tauri 桌面应用（当前平台） |
| `npm run tauri:build:win` | 构建 Windows 安装包（跨平台编译） |
| `npm run tauri:build:mac` | 构建 macOS 应用包 |
| `npm run tauri:build:linux` | 构建 Linux 应用包 |

## 开发工作流

### 1. Web 应用开发
1. 运行 `npm run dev` 启动开发服务器
2. 打开浏览器访问 `http://localhost:3000`
3. 修改代码，热重载自动生效

### 2. 桌面应用开发
1. 运行 `npm run tauri:dev` 同时启动前端和桌面应用
2. 前端代码修改会自动热重载
3. Tauri 后端代码修改会自动重启应用

### 3. 构建发布版本

**Web 应用:**
```bash
npm run build
npm run preview  # 预览构建结果
```

**桌面应用:**
```bash
npm run tauri:build          # 当前平台
npm run tauri:build:mac      # macOS
npm run tauri:build:win      # Windows
npm run tauri:build:linux    # Linux
```

## 代码结构

### 主要目录

```
NextDo/
├── index.html              # Web 入口文件
├── vite-tauri.html         # Tauri 构建入口
├── index.tsx               # React 入口
├── App.tsx                 # 应用根组件
├── types.ts                # TypeScript 类型定义
├── db.ts                   # IndexedDB 封装（Dexie.js）
├── components/             # React 组件
│   ├── Button.tsx
│   ├── CommandPalette.tsx
│   ├── DayTimeView.tsx
│   ├── EventPopover.tsx
│   ├── FullCalendar.tsx
│   ├── MatrixView.tsx
│   ├── ProjectDetailModal.tsx
│   ├── ProjectListModal.tsx
│   ├── RecurringManager.tsx
│   ├── RecurringOptions.tsx
│   ├── SettingsModal.tsx
│   ├── Skeletons.tsx
│   ├── TableView.tsx
│   ├── TaskDetailModal.tsx
│   └── TaskSelectorPopover.tsx
├── hooks/                  # React 钩子
│   └── useHotkeys.ts
├── services/               # 业务逻辑服务
│   ├── aiService.ts        # AI 集成功能
│   └── recurringService.ts # 重复任务逻辑
├── src/                    # 静态资源
│   └── index.css           # Tailwind CSS 入口
├── src-tauri/              # Tauri 桌面应用源码（Rust）
│   ├── src/main.rs         # 主应用入口
│   └── tauri.conf.json     # Tauri 配置
└── docs/                   # 项目文档
```

### 关键组件

- **App.tsx** - 应用根组件，路由分发与视图管理
- **components/** - 各种视图组件（日历、表格、矩阵视图等）
- **services/aiService.ts** - AI 集成（自然语言解析、任务拆解）
- **services/recurringService.ts** - 周期性任务生成逻辑
- **db.ts** - 本地数据库存储（IndexedDB/Dexie.js）
- **hooks/useHotkeys.ts** - 全局快捷键管理

## 数据架构

### IndexedDB 架构

应用使用 Dexie.js 封装 IndexedDB，实现本地优先数据存储。

**主要表:**
- `tasks` - 任务数据
- `projects` - 项目信息
- `recurringRules` - 周期性任务规则

**当前数据库版本:** v4（包含任务进度功能）

## AI 集成

### AI 服务配置

AI 功能通过 `aiService.ts` 实现，支持任何 OpenAI 兼容的 API。

**配置项:**
- Base URL - AI API 端点地址
- API Key - 用户提供的 API 密钥
- Model - 模型选择（默认为 gemini-1.5-flash）

**注意:** 这些设置存储在本地存储中，不在代码仓库内。

## 本地优先策略

### 无云服务架构
- 所有数据存储在本地 IndexedDB
- 无后端服务器或 API 调用（除用户配置的 AI 端点）
- 可完全离线使用

### 部署模式

**Web 模式:**
- 使用浏览器 IndexedDB
- 需要本地 Web 服务器（浏览器安全限制）
- 数据存储在浏览器配置文件中

**桌面模式（Tauri）:**
- 使用操作系统特定用户数据目录
- 持久存储，独立于浏览器
- 跨平台支持（Windows、macOS、Linux）

## 测试

当前项目未配置自动化测试框架，需要手动测试。

### 手动测试清单

- [ ] 创建新任务
- [ ] 设置重复规则
- [ ] 切换不同视图（日历、表格、矩阵）
- [ ] 导出数据
- [ ] 导入数据
- [ ] AI 功能集成
- [ ] 离线模式工作正常

## 代码风格指南

### TypeScript/JavaScript
- 使用 ES modules (package.json: `"type": "module"`)
- 组件使用 TypeScript 和 React 函数组件
- 使用 Tailwind CSS 进行样式设计

### Git 工作流程

1. 创建功能分支
2. 提交清晰、描述性的提交信息
3. 创建拉取请求进行代码审查
4. 合并到主分支

**提交信息格式:**
```
feat: 添加新功能
fix: 修复错误
docs: 文档更新
refactor: 代码重构
test: 测试更新
```

## 故障排除

### 常见问题

1. **模块加载错误**
   - 确保使用正确的 Node.js 版本（18+）
   - 重新安装依赖：`rm -rf node_modules && npm install`

2. **Tauri 构建失败**
   - 检查 Rust 工具链是否正确安装
   - Linux 需要安装 `libgtk-3-dev`、`libwebkit2gtk-4.0-dev`

3. **IndexedDB 问题**
   - 清除浏览器数据会删除任务数据
   - 桌面应用数据存储在系统用户目录，不受影响
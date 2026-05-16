# NextDo - 快速入门

## 构建文件位置

Tauri 构建输出: `src-tauri/target/release/bundle/`

---

## 获取应用

### 本地构建

```bash
npm install
npm run tauri:build
```

### 从 GitHub Releases 下载

访问 GitHub Releases 页面下载预构建版本。

---

## 各平台安装

### Windows
- 运行 `.msi` 安装程序（需要在 Windows 上构建）
- 自动安装 WebView2 运行时依赖

### macOS
- 打开 `.dmg` 文件并拖拽到 Applications

### Linux
- 安装 `.deb` (Debian/Ubuntu)
- 安装 `.rpm` (Fedora/RHEL)
- 或使用 AppImage

---

## 开发命令

```bash
# Web 开发
npm run dev                    # 启动 Vite 开发服务器（端口 3000）
npm run build                  # 构建生产版本
npm run preview                # 预览构建结果

# Tauri 桌面开发
npm run tauri:dev              # 启动开发环境
npm run tauri:build            # 构建当前平台
npm run tauri:build:mac        # macOS
npm run tauri:build:win        # Windows
npm run tauri:build:linux      # Linux
```

---

## 项目结构

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
│   ├── FullCalendar.tsx
│   ├── MatrixView.tsx
│   ├── TableView.tsx
│   ├── TaskDetailModal.tsx
│   └── ...更多组件
├── hooks/
│   └── useHotkeys.ts       # 全局快捷键
├── services/
│   ├── aiService.ts        # AI 集成
│   └── recurringService.ts # 重复任务逻辑
├── src/
│   └── index.css           # Tailwind CSS 入口
├── src-tauri/              # Tauri 后端（Rust）
│   ├── src/main.rs
│   └── tauri.conf.json
└── docs/                   # 项目文档
```

---

## 故障排除

### 构建失败？
- 确保安装 Rust：`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- 确保安装 Tauri CLI：`npm install -D @tauri-apps/cli`

### Windows WebView2 错误？
- 使用便携版：下载包含 WebView2 运行时的包
- 在 Windows 上构建：运行 `npm run tauri:build` 生成 `.msi` 安装包
- 手动安装 WebView2：从 Microsoft 官网下载并安装

### 运行问题？
- 检查 `src-tauri/tauri.conf.json` 配置
- 查看控制台和终端错误信息
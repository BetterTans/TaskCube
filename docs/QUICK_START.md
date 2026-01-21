# 🚀 NextDo Tauri 应用 - 快速入门

## ✅ 项目已迁移到 Tauri！

NextDo 已从 Electron 迁移到 Tauri，提供更快的启动速度、更小的体积和更好的系统集成。

---

## 📦 构建文件位置

**Tauri 构建输出**: `src-tauri/target/release/bundle/`

---

## 📥 获取应用

### 方式 1: 本地构建

```bash
# 安装依赖
npm install

# 构建应用
npm run tauri:build
```

### 方式 2: 从 GitHub 发布页下载

访问 GitHub Releases 页面下载预构建版本。

---

## 🖥️ 各平台安装

### Windows
#### 选项 1: 安装包（推荐 Windows 用户）
- 运行 `.msi` 安装程序（需要在 Windows 上构建）
- 自动安装 WebView2 运行时依赖

#### 选项 2: 便携版（跨平台构建）
- 下载 `nextdo-windows-x64.zip`
- 解压到任意目录
- 直接运行 `nextdo.exe`（无需安装）
- 包含完整的 WebView2 运行时，可在离线环境运行

### macOS
- 打开 `.dmg` 文件并拖拽到 Applications
- 或安装 `.app` 包

### Linux
- 安装 `.deb` (Debian/Ubuntu)
- 安装 `.rpm` (Fedora/RHEL)
- 或使用 AppImage

---

## 🛠️ 开发命令

### 常用命令
```bash
# 启动开发环境
npm run tauri:dev

# 构建生产版本
npm run tauri:build

# 平台专用构建
npm run tauri:build:mac    # macOS
npm run tauri:build:win    # Windows
npm run tauri:build:linux  # Linux
```

---

## 📄 文档指南

| 文档 | 内容 |
|------|------|
| [打包指南](./PACKAGING.md) | Tauri 打包和分发详细指南 |
| [快速入门](./QUICK_START.md) | Tauri 应用快速入门（本文档） |

---

## 📁 项目结构

```
TaskCube/
├── src-tauri/                         # Tauri 后端
│   ├── src/                          # Rust 源代码
│   ├── tauri.conf.json               # Tauri 配置
│   └── target/release/bundle/        # 构建输出
├── dist/                             # Vite 构建输出
├── public/                           # 静态资源
├── src/                              # React 源代码
│   ├── components/                   # React 组件
│   ├── db.ts                         # IndexedDB 封装
│   └── main.tsx                      # React 入口
├── package.json                      # 项目配置
└── index.html                        # Web 入口
```

---

## ⚡ 快速命令

```bash
# 1. 启动开发服务器
npm run tauri:dev

# 2. 构建应用
npm run tauri:build

# 3. 构建特定平台
npm run tauri:build:win  # Windows
```

---

## 🐛 故障排除

### 构建失败？
- 确保安装 Rust：`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- 确保安装 Tauri CLI：`npm install -D @tauri-apps/cli`

### Windows WebView2 错误？
**错误信息：** "找不到 WebView2Loader.dll" 或 "无法加载 WebView2"

**解决方案：**
1. **使用便携版**: 下载包含 WebView2 运行时的 `nextdo-windows-x64.zip`
2. **在 Windows 上构建**: 运行 `npm run tauri:build` 生成 `.msi` 安装包
3. **手动安装 WebView2**: 从 Microsoft 官网下载并安装 WebView2 运行时

**技术说明:**
- 跨平台构建（macOS→Windows）使用 `fixedRuntime` 模式嵌入 WebView2
- 构建输出位于 `src-tauri/target/x86_64-pc-windows-gnu/release/`
- 需要同时分发 `nextdo.exe` 和 `webview2/` 目录

### 运行问题？
- 检查 `src-tauri/tauri.conf.json` 配置
- 查看控制台和终端错误信息

---

## 📞 需要帮助？

1. 查看 [打包指南](./PACKAGING.md)
2. 查看 [详细构建说明](../CLAUDE.md)
3. 提交 GitHub Issue

---

**最后更新**: 2026-01-24
**Tauri 版本**: 2.9.5
**应用版本**: 3.1.2

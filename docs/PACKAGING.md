# NextDo 桌面应用打包指南

## Tauri 配置文件

1. **src-tauri/tauri.conf.json** - Tauri 配置
2. **src-tauri/Cargo.toml** - Rust 项目配置
3. **src-tauri/src/main.rs** - Tauri 主进程
4. **src-tauri/icons/** - 应用图标

## 打包应用

### macOS 桌面应用

```bash
npm run tauri:build:mac
```

**输出位置**: `src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/`

### Windows 桌面应用

```bash
# 跨平台构建（从 macOS/Linux）
npm run tauri:build:win

# Windows 原生构建（生成 MSI/NSIS 安装包）
npm run tauri:build
```

### Linux 桌面应用

```bash
npm run tauri:build:linux
```

**输出位置**: `src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/appimage/`

## 打包输出

**Windows** (MSI/NSIS 安装包):
```
src-tauri/target/release/bundle/
├── msi/                  # MSI 安装包
└── nsis/                 # NSIS 安装包
```

**macOS**:
```
src-tauri/target/aarch64-apple-darwin/release/bundle/
└── dmg/
    └── NextDo_3.1.2_aarch64.dmg
```

**Linux**:
```
src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/
└── appimage/
    └── nextdo_3.1.2_amd64.AppImage
```

## 常见问题

### 1. Windows WebView2 运行时错误

**问题**: "找不到 WebView2Loader.dll"

**解决方案**:
- 使用便携版（包含 WebView2）
- 下载 WebView2 CAB 文件并配置 `fixedRuntime` 模式
- 在 Windows 上构建 MSI 安装包

### 2. 构建失败

**检查项**:
- Node.js 版本 18+
- Rust 版本 1.77.2+
- Tauri CLI 已安装
- WebView2 CAB 文件在正确位置（Windows 构建）

### 3. 代码签名（生产环境）

**Windows**:
- 购买 Windows 代码签名证书
- 配置 `src-tauri/tauri.conf.json` 签名设置

**macOS**:
- 需要 Apple Developer 账户
- 配置签名证书

**Linux**: 通常不需要签名

## 相关文档

- [QUICK_START.md](./QUICK_START.md) - 快速入门
- [CONTRIB.md](./CONTRIB.md) - 开发环境配置
- [Tauri 官方文档](https://tauri.app/v2/guides/)

## 版本信息

- **Tauri**: 2.9.5
- **Rust**: 1.77.2+
- **Node.js**: 18+
- **应用版本**: 3.1.2
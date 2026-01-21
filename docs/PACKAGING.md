# NextDo 桌面应用打包指南

## 已完成的工作

你的 NextDo 应用已成功从 Electron 迁移到 Tauri。以下是 Tauri 打包配置：

### Tauri 配置文件

1. **src-tauri/tauri.conf.json** - Tauri 配置
2. **src-tauri/Cargo.toml** - Rust 项目配置
3. **src-tauri/src/main.rs** - Tauri 主进程
4. **src-tauri/icons/** - 应用图标（自动生成）

## 如何使用

### 1. 添加应用图标（可选）

为了更好的用户体验，可以在 `src-tauri/icons/` 目录下添加应用图标：

```bash
# 图标规格
icons/32x32.png       # 32x32
icons/128x128.png     # 128x128
icons/128x128@2x.png  # 256x256
icons/icon.icns       # macOS 图标
icons/icon.ico        # Windows 图标
```

可以使用 [tauricon](https://github.com/tauri-apps/tauricon) 自动生成所有平台图标：

```bash
npm run tauri icon /path/to/source-icon.png
```

### 2. 安装依赖

```bash
# 安装 Node.js 依赖
npm install

# Tauri CLI 会自动安装 Rust 依赖
```

### 3. 配置应用信息

编辑 `src-tauri/tauri.conf.json`：

```json
{
  "$schema": "../node_modules/@tauri-apps/cli/config.schema.json",
  "productName": "nextdo",
  "version": "0.1.0",
  "identifier": "com.nextdo.app",
  "build": {
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "NextDo",
        "width": 1200,
        "height": 800,
        "resizable": true,
        "fullscreen": false,
        "center": true,
        "decorations": true
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "windows": {
      "webviewInstallMode": {
        "type": "embedBootstrapper"
      }
    }
  }
}
```

### 4. 打包应用

根据你的操作系统选择相应的打包命令：

#### Windows 桌面应用

**手动构建**（推荐，直接使用 Cargo）：
```bash
# 进入 Tauri 目录
cd src-tauri

# 构建 Release 版本（直接生成可执行文件）
cargo build --release

# 输出位置
# 可执行文件: src-tauri/target/release/nextdo.exe
# DLL 文件: src-tauri/target/release/*.dll
```

**分发方式**：
将以下文件一起打包分发：
- `nextdo.exe` (主程序)
- `*.dll` (依赖库文件)
- 可选：创建压缩包方便分发

**Tauri 打包器构建**（可选，生成安装包）：
```bash
# 跨平台构建（从 macOS/Linux）
npm run tauri:build:win

# Windows 原生构建（生成 MSI/NSIS 安装包）
npm run tauri:build
```

#### macOS 桌面应用

```bash
npm run tauri:build:mac
```

**输出位置**: `src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/`

#### Linux 桌面应用

```bash
npm run tauri:build:linux
```

**输出位置**: `src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/appimage/`

### 5. 打包输出

打包完成后，生成的应用将在不同目录中：

**Windows** (手动构建):
```
src-tauri/target/release/
├── nextdo.exe              # 主应用
├── *.dll                   # 依赖库文件
└── resources/              # 资源文件（如果有）
```

**Windows** (Tauri 打包器):
```
src-tauri/target/x86_64-pc-windows-gnu/release/
├── nextdo.exe                                    # 主应用
├── webview2/                                     # WebView2 运行时
└── nextdo-windows-x64.zip                        # 分发包

# 或者 MSI/NSIS 安装包
src-tauri/target/release/bundle/
├── msi/                  # MSI 安装包
└── nsis/                 # NSIS 安装包
```

**macOS**:
```
src-tauri/target/aarch64-apple-darwin/release/bundle/
└── dmg/
    └── NextDo_3.1.2_aarch64.dmg                   # DMG 安装包
```

**Linux**:
```
src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/
└── appimage/
    └── nextdo_3.1.2_amd64.AppImage               # AppImage
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

### 3. 应用图标不显示

**解决方案**:
```bash
# 使用 tauricon 重新生成图标
npm run tauri icon /path/to/icon.png -- --target src-tauri/icons/
```

### 4. 跨平台构建警告

**警告**: "Cross-platform compilation is experimental"

这是正常的警告，Tauri 的交叉编译功能已足够稳定用于生产。

### 5. 代码签名（生产环境）

对于生产发布，建议对应用程序签名：

**Windows**:
- 购买 Windows 代码签名证书
- 配置 `src-tauri/tauri.conf.json`:
```json
{
  "bundle": {
    "windows": {
      "certificateThumbprint": "YOUR_CERT_THUMBPRINT",
      "digestAlgorithm": "sha256",
      "timestampUrl": ""
    }
  }
}
```

**macOS**:
- 需要 Apple Developer 账户
- 配置签名证书

**Linux**: 通常不需要签名

## 下一步建议

1. **添加自定义图标**
   - 使用 tauricon 生成所有平台图标
   - 放置在 `src-tauri/icons/`

2. **设置代码签名**（生产环境）
   - 购买签名证书
   - 配置 Tauri 签名设置
   - 消除安全警告

3. **配置自动更新**
   - 设置更新服务器
   - 配置 Tauri 更新插件
   - 测试更新流程

4. **在不同平台测试**
   - Windows 10/11
   - macOS Intel/Silicon
   - Linux Ubuntu/Fedora

5. **CI/CD 自动化**
   - GitHub Actions 自动构建
   - 多平台并行构建
   - 自动发布到 GitHub Releases

## 技术细节

### 架构对比

**Tauri vs Electron**:

| 特性 | Tauri | Electron |
|------|-------|----------|
| 应用大小 | ~18MB | ~97MB |
| 内存占用 | 低 | 高 |
| 启动速度 | 快 | 中等 |
| 安全 | 内置权限系统 | 需要配置 |
| 开发语言 | Rust + JS | Node.js + JS |

### 配置说明

**WebView2 固定版本**:
```json
{
  "bundle": {
    "windows": {
      "webviewInstallMode": {
        "type": "fixedRuntime",
        "path": "./Microsoft.WebView2.FixedVersionRuntime.144.0.3719.93.x64.cab"
      }
    }
  }
}
```

**目标平台**:
- Windows: x86_64-pc-windows-gnu
- macOS: aarch64-apple-darwin
- Linux: x86_64-unknown-linux-gnu

### 构建命令

```bash
# 开发
npm run tauri:dev

# 构建（当前平台）
npm run tauri:build

# 跨平台构建
npm run tauri:build:win    # Windows
npm run tauri:build:mac    # macOS
npm run tauri:build:linux  # Linux

# 分发包
npm run build              # 构建前端
```

## 相关文档

- [QUICK_START.md](./QUICK_START.md) - 快速入门
- [Tauri 官方文档](https://tauri.app/v2/guides/) - 完整 Tauri 文档

## 版本信息

- **Tauri**: 2.9.5
- **Rust**: 1.77.2+
- **Node.js**: 18+
- **WebView2**: 144.0.3719.93 (Windows)
- **应用版本**: 3.1.2

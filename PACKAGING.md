# NextDo Desktop App 打包指南

## 已完成的工作

我已经为你创建了 Electron 打包所需的所有配置文件：

1. **electron/main.ts** - Electron 主进程文件
2. **electron-builder.yml** - Electron 构建配置
3. **tsconfig.electron.json** - TypeScript 配置文件
4. 更新了 **package.json** - 添加了 Electron 打包脚本

## 如何使用

### 1. 添加应用图标（可选）

为了更好的用户体验，建议在 `build/` 目录下添加应用图标：

- Windows: `build/icon.ico` (256x256)
- macOS: `build/icon.icns` (512x512)
- Linux: `build/icon.png` (512x512)

如果没有图标，Electron 会使用默认图标。

### 2. 安装 Electron 和相关依赖

首先清理并重新安装依赖：

```bash
# 清理旧的 node_modules
rm -rf node_modules package-lock.json

# 重新安装所有依赖
npm install

# 安装 Electron 相关依赖
npm install electron electron-builder --save-dev
```

### 3. 编译 Electron 主进程

```bash
npx tsc -p tsconfig.electron.json
```

### 4. 打包应用

根据你的操作系统选择相应的打包命令：

#### Windows (生成 .exe 文件)
```bash
npm run dist:win
```

#### macOS (生成 .dmg 文件)
```bash
npm run dist:mac
```

#### Linux (生成 .AppImage 或 .deb)
```bash
npm run dist:linux
```

#### 全平台打包
```bash
npm run dist
```

### 5. 打包输出

打包完成后，生成的应用将在 `dist-app/` 目录中：

```
dist-app/
├── NextDo Setup 0.0.0.exe    # Windows 安装程序
├── NextDo-0.0.0.dmg          # macOS 安装包
└── NextDo-0.0.0.AppImage     # Linux 可执行文件
```

## 常见问题

### 1. 如何在 macOS 上打包 Windows 应用？

在 macOS 上直接打包 Windows 应用需要安装 `wine`：

```bash
brew install wine
npm run dist:win
```

或者，你可以在 Windows 虚拟机或 Windows 电脑上运行打包命令。

### 2. Electron 安装失败

如果遇到 Electron 安装错误，尝试：

```bash
npm config set electron_mirror https://npmmirror.com/mirrors/electron/
npm install electron --save-dev
```

### 3. 代码签名问题

对于生产环境，建议为应用程序签名：

- **Windows**: 需要代码签名证书
- **macOS**: 需要 Apple Developer 账户和证书
- **Linux**: 通常不需要签名

### 4. 应用更新

配置文件中已设置为支持自动更新。你需要配置自己的更新服务器。

## 下一步建议

1. 添加应用图标以提高专业性
2. 设置代码签名证书（用于生产发布）
3. 配置自动更新服务器
4. 在 Windows 系统上测试打包后的应用
5. 考虑使用 CI/CD 自动化打包流程

## 已配置的 npm 脚本

- `npm run dev` - 开发模式启动 Vite
- `npm run build` - 构建前端应用
- `npm run preview` - 预览构建结果
- `npm run electron:dev` - 开发模式启动 Electron
- `npm run electron:build` - 构建并打包 Electron 应用
- `npm run dist` - 打包所有平台
- `npm run dist:win` - 打包 Windows 平台
- `npm run dist:mac` - 打包 macOS 平台
- `npm run dist:linux` - 打包 Linux 平台

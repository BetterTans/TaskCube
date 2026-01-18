# NextDo 桌面端打包指南 (Electron)

本文档详细说明如何将 NextDo **零构建 (Zero-Build)** 网页版应用打包为 Windows (.exe) 和 macOS (.dmg) 桌面应用程序。

通过 Electron 打包，应用将拥有独立的数据存储环境，不受浏览器缓存清理策略的影响，从而实现**数据持久化**。

## 核心原理

Web 应用在浏览器中运行时，IndexedDB 数据存储在浏览器的临时目录中，容易被用户误清理或被浏览器自动回收。
Electron 应用独立运行，数据存储在操作系统的**用户数据目录**中，除非用户手动卸载软件或物理删除该文件夹，否则数据将永久保存。

## 实施步骤

### 1. 准备工作

确保你的电脑上已经安装了 Node.js 环境 (仅用于运行打包工具，非项目依赖)。

在项目根目录下，运行以下命令安装 Electron 核心及其打包工具：

```bash
npm install --save-dev electron electron-builder
```

### 2. 创建主进程文件

在项目根目录（与 `package.json` 同级）创建一个名为 `electron-main.js` 的文件，内容如下：

```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');

// 不需要 isDev 判断，因为生产和开发环境都直接加载本地 HTML 文件
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // 零构建架构可能依赖 Service Workers (如 esm.sh/run)
      // 在 file:// 协议下，需要显式启用
      webSecurity: false, 
    },
    title: "NextDo",
    // 注意: 图标文件需要被包含在打包配置中
    icon: path.join(__dirname, 'favicon.ico'), 
    autoHideMenuBar: true, // Windows 下自动隐藏菜单栏
  });

  // 直接加载项目的 index.html
  win.loadFile(path.join(__dirname, 'index.html'));
  
  // 如果需要调试，可以取消下面的注释
  // win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
```

### 3. 创建 package.json 文件

如果你的项目还没有 `package.json`，请在根目录运行 `npm init -y` 创建一个。然后，修改该文件以添加 Electron 打包配置：

1.  **设置入口文件**:
    ```json
    {
      "name": "nextdo",
      "version": "3.1.2",
      "description": "AI 驱动的智能待办应用。",
      "main": "electron-main.js",
      ...
    }
    ```

2.  **添加打包脚本 (`scripts`)**:
    ```json
    "scripts": {
      "electron:dev": "electron .",
      "dist": "electron-builder"
    }
    ```

3.  **添加构建配置 (`build`)**:
    在 `package.json` 的顶层添加 `build` 字段。这是最关键的一步，因为它告诉 `electron-builder` 需要将哪些源文件打包到最终的应用中。
    ```json
    "build": {
      "appId": "com.nextdo.app",
      "productName": "NextDo",
      "files": [
        "**/*",
        "!node_modules/**/*",
        "!dist/**/*",
        "!docs/**/*",
        "!*.md",
        "!*.log"
      ],
      "directories": {
        "output": "dist"
      },
      "win": {
        "target": "nsis",
        "icon": "favicon.ico"
      },
      "mac": {
        "target": "dmg",
        "icon": "favicon.ico"
      },
      "nsis": {
        "oneClick": false,
        "allowToChangeInstallationDirectory": true
      }
    }
    ```
    > **重要**: `files` 数组的配置 `["**/*", "!node_modules/**/*", ...]` 意味着打包所有文件，同时排除 `node_modules`、输出目录 `dist` 和其他不需要的文件。

### 4. 执行打包

完成上述配置后，运行以下命令即可生成安装包：

```bash
npm run dist
```

打包成功后，你会在项目根目录下的 `dist` 文件夹中找到适用于你当前操作系统的安装程序（例如 `NextDo Setup 3.1.2.exe` 或 `NextDo-3.1.2.dmg`）。

---

## 数据存储位置说明

打包后的应用会自动将 IndexedDB 数据存储在系统的标准应用数据目录下，完全独立于浏览器。

具体路径如下：

*   **Windows**: `C:\Users\<用户名>\AppData\Roaming\NextDo\IndexedDB`
*   **macOS**: `/Users/<用户名>/Library/Application Support/NextDo/IndexedDB`
*   **Linux**: `~/.config/NextDo/IndexedDB`

只要用户不重装操作系统或手动进入上述目录删除文件，**数据将永久存在**。即使你发布了新版本的安装包，只要 `appId` 保持不变，新版软件安装后依然能自动读取到旧版的数据。
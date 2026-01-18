# TaskCube 桌面端打包指南 (Electron)

本文档详细说明如何将 TaskCube 网页版应用打包为 Windows (.exe) 和 macOS (.dmg) 桌面应用程序。

通过 Electron 打包，应用将拥有独立的数据存储环境，不受浏览器缓存清理策略的影响，从而实现**数据持久化**。

## 核心原理

Web 应用在浏览器中运行时，IndexedDB 数据存储在浏览器的临时目录中，容易被用户误清理或被浏览器自动回收。
Electron 应用独立运行，数据存储在操作系统的**用户数据目录**中，除非用户手动卸载软件或物理删除该文件夹，否则数据将永久保存。

## 实施步骤

### 1. 准备工作

确保你的电脑上已经安装了 Node.js 环境。

在项目根目录下，运行以下命令安装 Electron 核心及其打包工具：

```bash
npm install --save-dev electron electron-builder
```

*可选（为了更方便的开发体验）：*
```bash
npm install --save-dev concurrently wait-on cross-env
```

### 2. 创建主进程文件

在项目根目录（与 `package.json` 同级）创建一个名为 `electron-main.js` 的文件，内容如下：

```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = !app.isPackaged; // 判断是否为生产环境

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: "TaskCube",
    icon: path.join(__dirname, 'public', 'favicon.ico'), // 设置图标
    autoHideMenuBar: true, // Windows 下自动隐藏菜单栏
  });

  if (isDev) {
    // 开发模式：加载本地 React 服务
    win.loadURL('http://localhost:3000');
    // win.webContents.openDevTools(); // 可选：打开调试控制台
  } else {
    // 生产模式：加载打包后的静态文件
    // 此时 electron-main.js 应该和 build 文件夹在一起
    win.loadFile(path.join(__dirname, 'build', 'index.html'));
  }
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

### 3. 修改 package.json 配置

你需要修改 `package.json` 文件来告诉构建工具如何打包。请添加或修改以下字段：

1.  **设置入口和主页路径**：
    ```json
    {
      "main": "electron-main.js",
      "homepage": "./", 
      ...
    }
    ```
    > **重要**：`"homepage": "./"` 是必须的，它确保 React 打包出来的 index.html 使用相对路径引用 JS/CSS，否则在 Electron 中会出现白屏。

2.  **添加打包脚本 (`scripts`)**：
    ```json
    "scripts": {
      "start": "react-scripts start",
      "build": "react-scripts build",
      "electron:dev": "concurrently \"cross-env BROWSER=none npm start\" \"wait-on http://localhost:3000 && electron .\"",
      "dist": "npm run build && electron-builder"
    }
    ```

3.  **添加构建配置 (`build`)**：
    在 `package.json` 的顶层添加 `build` 字段：
    ```json
    "build": {
      "appId": "com.yourname.taskcube",
      "productName": "TaskCube",
      "files": [
        "build/**/*",
        "electron-main.js"
      ],
      "directories": {
        "output": "dist"
      },
      "win": {
        "target": "nsis",
        "icon": "public/favicon.ico"
      },
      "mac": {
        "target": "dmg",
        "icon": "public/logo192.png"
      },
      "nsis": {
        "oneClick": false,
        "allowToChangeInstallationDirectory": true
      }
    }
    ```

### 4. 执行打包

完成上述配置后，运行以下命令即可生成安装包：

**Windows (.exe):**
```bash
npm run dist
```
打包成功后，你会在项目根目录下的 `dist` 文件夹中找到 `TaskCube Setup X.X.X.exe`。

**macOS (.dmg):**
如果在 Mac 电脑上运行 `npm run dist`，则会在 `dist` 文件夹中生成 `.dmg` 文件。

---

## 数据存储位置说明

打包后的应用会自动将 IndexedDB 数据存储在系统的标准应用数据目录下，完全独立于浏览器。

具体路径如下（假设应用名为 TaskCube）：

*   **Windows**: `C:\Users\<用户名>\AppData\Roaming\TaskCube\IndexedDB`
*   **macOS**: `/Users/<用户名>/Library/Application Support/TaskCube/IndexedDB`
*   **Linux**: `~/.config/TaskCube/IndexedDB`

只要用户不重装操作系统或手动进入上述目录删除文件，**数据将永久存在**。即使你发布了新版本的 `.exe` 安装包，只要 `appId` 保持不变，新版软件安装后依然能自动读取到旧版的数据。